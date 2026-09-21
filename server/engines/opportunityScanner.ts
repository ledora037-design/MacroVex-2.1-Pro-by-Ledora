import {
  FullMarketScannerState,
  InstrumentId,
  MarketOpportunity,
} from '../../src/types.js';
import { getState } from '../store.js';
import { INSTRUMENTS, fetchLiveQuote, fetchCandles, getAssetIntelligence } from '../providers/marketData.js';
import { fetchMacroEvents } from '../providers/newsEngine.js';
import { analyzeCrossAsset } from './crossAssetEngine.js';

let latestScannerState: FullMarketScannerState = {
  isScanning: false,
  lastScanTimestamp: Date.now(),
  assetsScannedCount: 0,
  validSignalsCount: 0,
  riskApprovedCount: 0,
  activePositionsCount: 0,
  maxOpenPositions: 5,
  availableSlots: 5,
  dailyLimitRule: 'UNLIMITED_TRADES_MAX_5_CONCURRENT',
  antiOvertradingActive: true,
  rankedOpportunities: [],
};

// Scan throttle cache (to keep scanner responsive without hammering Bitget)
let lastFullScanTime = 0;
const SCAN_CACHE_TTL_MS = 6000; // 6 seconds

export function getLatestScannerState(): FullMarketScannerState {
  const state = getState();
  const activeCount = state.openPositions.length;
  latestScannerState.activePositionsCount = activeCount;
  latestScannerState.availableSlots = Math.max(0, 5 - activeCount);
  return latestScannerState;
}

export async function scanAndRankOpportunities(): Promise<FullMarketScannerState> {
  const now = Date.now();
  if (latestScannerState.isScanning) {
    return getLatestScannerState();
  }

  // If recent scan was within TTL, return updated state
  if (now - lastFullScanTime < SCAN_CACHE_TTL_MS && latestScannerState.rankedOpportunities.length > 0) {
    return getLatestScannerState();
  }

  latestScannerState.isScanning = true;
  const state = getState();
  const openPositions = state.openPositions;
  const closedTrades = state.closedTrades;
  const activeCount = openPositions.length;
  const availableSlots = Math.max(0, 5 - activeCount);

  try {
    const allSymbols = Object.keys(INSTRUMENTS) as InstrumentId[];
    const macroEvents = await fetchMacroEvents();
    const crossAsset = await analyzeCrossAsset();

    // BTC & ETH baseline condition for crypto market direction
    const btcQuote = await fetchLiveQuote('BTC');
    const ethQuote = await fetchLiveQuote('ETH');
    const btcTrendBullish = btcQuote.change24h >= -0.5;
    const btcTrendBearish = btcQuote.change24h <= -1.5;

    const opportunities: MarketOpportunity[] = [];

    // Scan the full market universe
    for (const symbol of allSymbols) {
      const inst = INSTRUMENTS[symbol];
      if (!inst) continue;

      try {
        const intel = await getAssetIntelligence(symbol);
        const p = intel.price;
        if (!p || p <= 0) continue;

        const isCrypto = inst.category === 'CRYPTO';
        const isBullish = intel.technicalBias === 'BULLISH';
        const isBearish = intel.technicalBias === 'BEARISH';

        // Check recent stop-out for anti-revenge
        const recentStop = closedTrades.find(
          (ct) => ct.asset === symbol && now - ct.closedAt < 180000 && ct.exitReason === 'STOP_LOSS'
        );

        // Check if currently holding open position
        const activePos = openPositions.find((pos) => pos.asset === symbol);

        // Scalping execution structure:
        // Prioritize 1m / 5m / 15m structure; trend on 1H / 4H
        const mtf15m = intel.multiTimeframe['15m'];
        const mtf1h = intel.multiTimeframe['1h'];
        const mtf4h = intel.multiTimeframe['4h'];

        const mtfAlignedBull = mtf15m.bias === 'BULLISH' && (mtf1h.bias === 'BULLISH' || mtf4h.bias === 'BULLISH');
        const mtfAlignedBear = mtf15m.bias === 'BEARISH' && (mtf1h.bias === 'BEARISH' || mtf4h.bias === 'BEARISH');

        let direction: 'LONG' | 'SHORT' = 'LONG';
        let action: 'BUY' | 'SELL' | 'WAIT' = 'WAIT';

        if (isBullish && mtfAlignedBull) {
          direction = 'LONG';
          action = 'BUY';
        } else if (isBearish && mtfAlignedBear) {
          direction = 'SHORT';
          action = 'SELL';
        } else if (isBullish) {
          direction = 'LONG';
          action = 'BUY';
        } else if (isBearish) {
          direction = 'SHORT';
          action = 'SELL';
        }

        // Cross-asset & BTC market condition validation
        let macroAligned = true;
        if (isCrypto) {
          if (direction === 'LONG' && btcTrendBearish && btcQuote.change24h < -2.5) {
            macroAligned = false;
          } else if (direction === 'SHORT' && btcTrendBullish && btcQuote.change24h > 3.0) {
            macroAligned = false;
          }
        }

        // SMC detection signals
        const hasBullOb = intel.smc.orderBlocks.some((ob) => ob.type === 'BULLISH' && ob.active);
        const hasBearOb = intel.smc.orderBlocks.some((ob) => ob.type === 'BEARISH' && ob.active);
        const hasBullFvg = intel.smc.fvg.some((f) => f.type === 'BULLISH');
        const hasBearFvg = intel.smc.fvg.some((f) => f.type === 'BEARISH');
        const hasSweep = intel.smc.liquiditySweeps.length > 0;

        let bosChoch: MarketOpportunity['bosChoch'] = 'NONE';
        if (intel.smc.breakoutState === 'BREAKOUT') {
          bosChoch = direction === 'LONG' ? 'BOS_BULL' : 'BOS_BEAR';
        } else if (intel.smc.breakoutState === 'REJECTION') {
          bosChoch = direction === 'LONG' ? 'CHOCH_BULL' : 'CHOCH_BEAR';
        }

        // Precision scalping stop-loss and take-profit geometry
        // Scalp target: 1.2% - 2.2% stop distance, 2.15:1 R:R ratio
        const stopDistancePct = isCrypto ? 0.016 : 0.012; // 1.6% crypto scalp, 1.2% equities scalp
        const targetDistancePct = stopDistancePct * 2.15; // 2.15:1 R:R

        const entry = parseFloat(p.toFixed(2));
        const sl = direction === 'LONG'
          ? parseFloat((p * (1 - stopDistancePct)).toFixed(2))
          : parseFloat((p * (1 + stopDistancePct)).toFixed(2));
        const tp = direction === 'LONG'
          ? parseFloat((p * (1 + targetDistancePct)).toFixed(2))
          : parseFloat((p * (1 - targetDistancePct)).toFixed(2));

        const riskDist = Math.abs(entry - sl);
        const rewardDist = Math.abs(tp - entry);
        const rr = riskDist > 0 ? parseFloat((rewardDist / riskDist).toFixed(2)) : 2.15;

        // Spread & Liquidity assessment
        const spreadBps = isCrypto ? 2.5 : 1.5;
        const volumeScore = Math.min(100, Math.round(intel.volume24h > 1000000 ? 90 : 65));

        // Multi-Timeframe Alignment classification
        let mtfAlignment: MarketOpportunity['mtfAlignment'] = 'PARTIAL';
        if ((direction === 'LONG' && mtfAlignedBull) || (direction === 'SHORT' && mtfAlignedBear)) {
          mtfAlignment = 'ALIGNED';
        } else if ((direction === 'LONG' && mtf15m.bias === 'BEARISH') || (direction === 'SHORT' && mtf15m.bias === 'BULLISH')) {
          mtfAlignment = 'CONFLICT';
        }

        // Dynamic Opportunity Ranking Model:
        // 1. Signal Strength (25%)
        // 2. MTF Alignment (20%)
        // 3. SMC Confirmation (OB, FVG, BOS/CHoCH, Sweep) (20%)
        // 4. Momentum & Volume (15%)
        // 5. Risk/Reward (10%)
        // 6. Macro & Cross-Asset Alignment (10%)
        let score = intel.opportunityScore;
        if (mtfAlignment === 'ALIGNED') score += 10;
        if (mtfAlignment === 'CONFLICT') score -= 15;
        if (hasSweep) score += 6;
        if ((direction === 'LONG' && hasBullOb) || (direction === 'SHORT' && hasBearOb)) score += 6;
        if ((direction === 'LONG' && hasBullFvg) || (direction === 'SHORT' && hasBearFvg)) score += 4;
        if (macroAligned) score += 5; else score -= 10;
        if (intel.indicators.adx14 > 25) score += 4; // strong trend
        score = Math.min(99, Math.max(25, Math.round(score)));

        // Risk Gate Status Evaluation
        let riskGateStatus: MarketOpportunity['riskGateStatus'] = 'APPROVED';
        let rejectionReason: string | undefined;

        if (activePos) {
          riskGateStatus = 'MAX_POSITIONS_REACHED';
          rejectionReason = `Already active in ${activePos.direction} ${symbol}`;
          action = 'WAIT';
        } else if (activeCount >= 5) {
          riskGateStatus = 'MAX_POSITIONS_REACHED';
          rejectionReason = 'Max 5 concurrent positions active. Waiting for exit to recycle slot.';
          action = 'WAIT';
        } else if (recentStop && recentStop.direction === direction) {
          riskGateStatus = 'COOLDOWN_PROTECTED';
          rejectionReason = `Stopped out ${Math.round((now - recentStop.closedAt) / 1000)}s ago. Anti-revenge active.`;
          action = 'WAIT';
        } else if (score < 70 || mtfAlignment === 'CONFLICT') {
          riskGateStatus = 'REJECTED';
          rejectionReason = `Opportunity score (${score}/100) or MTF conflict (${mtfAlignment}) below execution threshold`;
          action = 'WAIT';
        } else if (availableSlots <= 0) {
          riskGateStatus = 'WAITING_SLOT';
          rejectionReason = 'Valid setup identified. All 5 position slots currently occupied.';
        }

        opportunities.push({
          asset: symbol,
          name: inst.name,
          category: inst.category,
          price: entry,
          change24h: intel.change24h,
          volume24h: intel.volume24h,
          direction,
          action,
          rankScore: score,
          signalStrength: intel.opportunityScore,
          mtfAlignment,
          executionTimeframe: '5m',
          trendTimeframe: '1H',
          marketStructure: intel.smc.marketStructure,
          bosChoch,
          orderBlock: (direction === 'LONG' && hasBullOb) ? 'BULL_OB' : (direction === 'SHORT' && hasBearOb) ? 'BEAR_OB' : 'NONE',
          fvg: (direction === 'LONG' && hasBullFvg) ? 'BULL_FVG' : (direction === 'SHORT' && hasBearFvg) ? 'BEAR_FVG' : 'NONE',
          liquiditySweep: hasSweep,
          momentum: intel.momentum,
          volatility: intel.volatility,
          liquidity: volumeScore,
          spreadBps,
          rr,
          entry,
          sl,
          tp,
          confidence: intel.aiConfidence,
          macroAlignment: macroAligned,
          crossAssetStatus: crossAsset.regime,
          riskGateStatus,
          rejectionReason,
          lastScannedAt: now,
        });
      } catch (assetErr) {
        // Continue scanning other assets
      }
    }

    // Helper: Category Priority (Requirement 4: Stocks / stock tokens first, Crypto second, Gold / Silver / Oil afterward)
    const getCategoryPriority = (category: string): number => {
      if (category === 'EQUITIES') return 1; // Stocks / stock tokens FIRST
      if (category === 'CRYPTO') return 2;   // Crypto SECOND
      if (category === 'COMMODITIES') return 3; // Gold / Silver / Oil AFTERWARD
      return 4;
    };

    // Sort opportunities:
    // 1. Actionable setups first (action !== 'WAIT')
    // 2. Strict category priority (Stocks -> Crypto -> Commodities)
    // 3. Rank score descending (Highest conviction within class)
    opportunities.sort((a, b) => {
      const aActionable = a.action !== 'WAIT';
      const bActionable = b.action !== 'WAIT';
      if (aActionable && !bActionable) return -1;
      if (!aActionable && bActionable) return 1;

      // Both actionable or both waiting: apply strict category priority
      const catDiff = getCategoryPriority(a.category) - getCategoryPriority(b.category);
      if (catDiff !== 0) return catDiff;

      return b.rankScore - a.rankScore;
    });

    const validSignals = opportunities.filter((o) => o.action !== 'WAIT');
    const riskApproved = opportunities.filter((o) => o.riskGateStatus === 'APPROVED');

    latestScannerState = {
      isScanning: false,
      lastScanTimestamp: now,
      assetsScannedCount: allSymbols.length,
      validSignalsCount: validSignals.length,
      riskApprovedCount: riskApproved.length,
      activePositionsCount: activeCount,
      maxOpenPositions: 5,
      availableSlots,
      dailyLimitRule: 'UNLIMITED_TRADES_MAX_5_CONCURRENT',
      antiOvertradingActive: true,
      rankedOpportunities: opportunities,
    };

    lastFullScanTime = now;
  } catch (err) {
    console.error('[Opportunity Scanner] Error running full market scan:', err);
    latestScannerState.isScanning = false;
  }

  return latestScannerState;
}
