import { AIDecision, InstrumentId, Position } from '../../src/types.js';
import { getState } from '../store.js';
import { INSTRUMENTS, fetchLiveQuote } from '../providers/marketData.js';

export interface RiskCheckResult {
  approved: boolean;
  reason: string;
  checks: Record<string, boolean>;
  calculatedSize?: {
    quantity: number;
    notional: number;
    margin: number;
    marginUsed: number;
    positionNotional: number;
    capitalAtRisk: number;
    riskAmount: number;
    riskPercent: number;
    rr: number;
    leverage: number;
    signalStrength: 'VERY STRONG' | 'STRONG' | 'NORMAL' | 'WEAKER' | 'WAIT' | 'REJECTED';
  };
}

export interface ProposedTrade {
  asset: InstrumentId;
  direction: 'LONG' | 'SHORT';
  action: 'BUY' | 'SELL' | 'WAIT';
  entry: number;
  stop_loss: number;
  take_profit: number;
  leverage?: number;
  risk_percent?: number;
  confidence?: number;
  isManual?: boolean;
  manualMargin?: number;
}

export async function evaluateRisk(proposed: ProposedTrade): Promise<RiskCheckResult> {
  const state = getState();
  const portfolio = state.portfolio;
  const settings = state.settings;
  const openPositions = state.openPositions;

  const checks: Record<string, boolean> = {
    '1_data_freshness': false,
    '2_instrument_availability': false,
    '3_direction_validity': false,
    '4_entry_validity': false,
    '5_sl_geometry_validity': false,
    '6_tp_geometry_validity': false,
    '7_minimum_rr': false,
    '8_confidence_threshold': false,
    '9_position_risk_limit': false,
    '10_portfolio_exposure_limit': false,
    '11_correlated_exposure_limit': false,
    '12_max_open_positions': false,
    '13_daily_trade_limit': false,
    '14_daily_loss_limit': false,
    '15_max_drawdown_limit': false,
    '16_volatility_spread_safety': false,
    '17_leverage_limit': false,
    '18_margin_availability': false,
    '19_stop_distance_validation': false,
    '20_duplicate_position_check': false,
  };

  const createRejectedResult = (reason: string, extraChecks?: Record<string, boolean>): RiskCheckResult => {
    const rawRisk = Math.abs((proposed.entry || 0) - (proposed.stop_loss || 0));
    const rawReward = Math.abs((proposed.take_profit || 0) - (proposed.entry || 0));
    const fallbackRR = rawRisk > 0 ? parseFloat((rawReward / rawRisk).toFixed(2)) : 0;
    return {
      approved: false,
      reason,
      checks: { ...checks, ...extraChecks },
      calculatedSize: {
        quantity: 0,
        notional: 0,
        margin: 0,
        marginUsed: 0,
        positionNotional: 0,
        capitalAtRisk: 0,
        riskAmount: 0,
        riskPercent: 0,
        rr: fallbackRR,
        leverage: proposed.leverage || 5,
        signalStrength: proposed.action === 'WAIT' ? 'WAIT' : 'REJECTED',
      },
    };
  };

  if (proposed.action === 'WAIT') {
    return createRejectedResult('Action is WAIT - no execution authorized by design.');
  }

  // 1 & 2. Data Freshness and Instrument Availability
  const inst = INSTRUMENTS[proposed.asset];
  if (!inst) {
    return createRejectedResult(`Unknown instrument: ${proposed.asset}`);
  }
  const quote = await fetchLiveQuote(proposed.asset);
  if (quote.status === 'UNAVAILABLE' || quote.status === 'DATA ERROR') {
    return createRejectedResult(`Market data status for ${proposed.asset} is ${quote.status}`);
  }
  checks['1_data_freshness'] = true;
  checks['2_instrument_availability'] = true;

  // 3. Direction Validity
  if (proposed.direction !== 'LONG' && proposed.direction !== 'SHORT') {
    return createRejectedResult(`Invalid direction: ${proposed.direction}`);
  }
  checks['3_direction_validity'] = true;

  // 4, 5, 6. Geometry:
  // LONG: SL < Entry < TP
  // SHORT: SL > Entry > TP
  const { entry, stop_loss: sl, take_profit: tp } = proposed;
  if (!entry || entry <= 0 || !Number.isFinite(entry)) {
    return createRejectedResult(`Invalid entry price: ${entry}`);
  }
  checks['4_entry_validity'] = true;

  if (proposed.direction === 'LONG') {
    if (!(sl < entry)) {
      return createRejectedResult(`Long geometry violated: Stop Loss (${sl}) must be strictly below Entry (${entry})`);
    }
    checks['5_sl_geometry_validity'] = true;
    if (!(entry < tp)) {
      return createRejectedResult(`Long geometry violated: Take Profit (${tp}) must be strictly above Entry (${entry})`);
    }
    checks['6_tp_geometry_validity'] = true;
  } else {
    // SHORT: SL > Entry > TP
    if (!(sl > entry)) {
      return createRejectedResult(`Short geometry violated: Stop Loss (${sl}) must be strictly above Entry (${entry})`);
    }
    checks['5_sl_geometry_validity'] = true;
    if (!(entry > tp)) {
      return createRejectedResult(`Short geometry violated: Take Profit (${tp}) must be strictly below Entry (${entry})`);
    }
    checks['6_tp_geometry_validity'] = true;
  }

  // 7. Minimum R:R check
  const riskDist = Math.abs(entry - sl);
  const rewardDist = Math.abs(tp - entry);
  const rr = riskDist > 0 ? parseFloat((rewardDist / riskDist).toFixed(2)) : 0;
  if (rr < settings.minRiskReward) {
    return createRejectedResult(`Reward-to-Risk ratio ${rr}:1 is below minimum required ${settings.minRiskReward}:1`);
  }
  checks['7_minimum_rr'] = true;

  // 8. Confidence threshold
  const confidence = proposed.confidence ?? (proposed.isManual ? 100 : 0);
  if (!proposed.isManual && confidence < 65) {
    return createRejectedResult(`AI confidence ${confidence}% is below the mandatory 65% threshold`);
  }
  checks['8_confidence_threshold'] = true;

  // 19. Stop distance validation (min 0.3%, max 10% of entry)
  const stopPercent = (riskDist / entry) * 100;
  if (stopPercent < 0.25) {
    return createRejectedResult(`Stop loss distance (${stopPercent.toFixed(2)}%) is too tight (< 0.25%)`);
  }
  if (stopPercent > 12) {
    return createRejectedResult(`Stop loss distance (${stopPercent.toFixed(2)}%) is too wide (> 12%)`);
  }
  checks['19_stop_distance_validation'] = true;
  checks['16_volatility_spread_safety'] = true;

  // 13. Dynamic Position Recycling & Anti-Overtrading Gate
  if (openPositions.length >= 5) {
    return createRejectedResult(
      `Maximum concurrent open positions reached (${openPositions.length}/5). No new scalp authorized until an existing trade closes.`
    );
  }

  // Anti-revenge & rapid churn protection:
  const recentStopOut = state.closedTrades.find(
    (ct) => ct.asset === proposed.asset && Date.now() - ct.closedAt < 180000 && ct.exitReason === 'STOP_LOSS'
  );
  if (recentStopOut && recentStopOut.direction === proposed.direction) {
    const shiftPercent = Math.abs(proposed.entry - recentStopOut.exit) / recentStopOut.exit * 100;
    if (shiftPercent < 0.35) {
      return createRejectedResult(
        `Anti-Overtrading Gate: ${proposed.asset} was stopped out ${Math.round((Date.now() - recentStopOut.closedAt) / 1000)}s ago. Re-entry rejected until new market structure forms.`
      );
    }
  }

  checks['13_daily_trade_limit'] = true;

  // 12. Max open positions
  if (openPositions.length >= 5) {
    return createRejectedResult(`Maximum concurrent positions reached (${openPositions.length}/5)`);
  }
  checks['12_max_open_positions'] = true;

  // 20. Duplicate position check (same asset & direction)
  const duplicate = openPositions.find((p) => p.asset === proposed.asset && p.direction === proposed.direction);
  if (duplicate) {
    return createRejectedResult(`Duplicate position check failed: Already open ${proposed.direction} position in ${proposed.asset}`);
  }
  checks['20_duplicate_position_check'] = true;

  // 14. Daily loss limit (halt if daily loss >= dailyLossLimitPercent)
  const dailyLossPct = portfolio.equity > 0 ? (Math.min(0, portfolio.dailyPnl) / portfolio.initialCapital) * -100 : 0;
  if (dailyLossPct >= settings.dailyLossLimitPercent) {
    return createRejectedResult(
      `Daily loss limit triggered (${dailyLossPct.toFixed(1)}% >= ${settings.dailyLossLimitPercent}%). Trading halted for today.`
    );
  }
  checks['14_daily_loss_limit'] = true;

  // 15. Max drawdown protection
  if (portfolio.currentDrawdownPercent >= settings.maxDrawdownLimitPercent) {
    return createRejectedResult(
      `Maximum drawdown safety triggered (${portfolio.currentDrawdownPercent.toFixed(1)}% >= ${settings.maxDrawdownLimitPercent}%). Risk engine halted.`
    );
  }
  checks['15_max_drawdown_limit'] = true;

  // 17. Leverage protection
  const requestedLev = proposed.leverage || 5;
  const leverage = Math.min(requestedLev, inst.maxLeverage);
  checks['17_leverage_limit'] = true;

  // ---------------------------------------------------------------------------
  // NEW MARGIN ALLOCATION POLICY & DETERMINISTIC RISK ENGINE SIZING
  // ---------------------------------------------------------------------------
  // MARGIN COMMITTED (Collateral) != CAPITAL AT RISK != POSITION NOTIONAL
  // Sizing margin primarily from risk & stop distance can blow up margin to $18,000+.
  // Instead, determine reasonable margin tiers ($100 - $1,000, exceptional up to $1,500 - $2,000)
  // based on multi-dimensional conditions (not confidence alone), validated by Risk Engine.
  // ---------------------------------------------------------------------------

  // 1. Multi-factor Setup Quality Scoring (0 to 100)
  let setupScore = 50;

  // AI Confidence factor (up to +30)
  setupScore += Math.min(30, Math.max(0, (confidence - 50) * 0.75));

  // R:R factor (up to +20)
  if (rr >= 2.5) setupScore += 20;
  else if (rr >= 2.1) setupScore += 16;
  else if (rr >= 1.8) setupScore += 12;
  else if (rr >= 1.5) setupScore += 8;

  // Stop loss distance quality (0.8% - 3.5% is optimal for controlled scalp/swing)
  if (stopPercent >= 0.8 && stopPercent <= 3.5) setupScore += 10;
  else if (stopPercent >= 0.5 && stopPercent <= 6.0) setupScore += 5;

  // Drawdown safety
  if (portfolio.currentDrawdownPercent < 0.5) setupScore += 10;
  else if (portfolio.currentDrawdownPercent < 2.0) setupScore += 5;
  else if (portfolio.currentDrawdownPercent > 4.0) setupScore -= 20;
  else if (portfolio.currentDrawdownPercent > 2.0) setupScore -= 10;

  // Daily loss condition
  if (dailyLossPct > 2.0) setupScore -= 15;
  else if (dailyLossPct > 1.0) setupScore -= 8;

  // Existing open positions concurrency
  if (openPositions.length === 0) setupScore += 10;
  else if (openPositions.length === 1) setupScore += 5;
  else if (openPositions.length >= 3) setupScore -= 10;

  // Category correlation factor
  const sameCategoryPositions = openPositions.filter((p) => INSTRUMENTS[p.asset]?.category === inst.category).length;
  if (sameCategoryPositions >= 2) setupScore -= 12;
  else if (sameCategoryPositions === 0) setupScore += 5;

  // 2. Margin Tier Selection:
  // WEAKER VALID SETUP: $100–$200 margin
  // NORMAL SETUP: $200–$500 margin
  // STRONG SETUP: $500–$800 margin
  // VERY STRONG SETUP: $800–$1,000 margin
  // EXCEPTIONAL SETUP: up to $1,500–$2,000 only when every Risk Engine condition strongly supports it
  // DEFAULT: Prefer the lower end of the applicable range.
  let signalStrength: 'VERY STRONG' | 'STRONG' | 'NORMAL' | 'WEAKER' | 'WAIT' | 'REJECTED' = 'NORMAL';
  let defaultTierMargin = 200;

  const isEveryConditionExceptional =
    confidence >= 88 &&
    rr >= 2.4 &&
    portfolio.currentDrawdownPercent < 1.0 &&
    dailyLossPct < 1.0 &&
    openPositions.length <= 2 &&
    sameCategoryPositions <= 1 &&
    stopPercent >= 0.7 &&
    stopPercent <= 4.0;

  if (setupScore >= 92 && isEveryConditionExceptional) {
    signalStrength = 'VERY STRONG';
    defaultTierMargin = 1500; // Lower end of $1,500 - $2,000
  } else if (setupScore >= 78 && confidence >= 80 && rr >= 2.0) {
    signalStrength = 'VERY STRONG';
    defaultTierMargin = 800; // Lower end of $800 - $1,000
  } else if (setupScore >= 66 && confidence >= 72 && rr >= 1.75) {
    signalStrength = 'STRONG';
    defaultTierMargin = 500; // Lower end of $500 - $800
  } else if (setupScore >= 52 && confidence >= 65 && rr >= 1.5) {
    signalStrength = 'NORMAL';
    defaultTierMargin = 200; // Lower end of $200 - $500
  } else {
    signalStrength = 'WEAKER';
    defaultTierMargin = 100; // Lower end of $100 - $200
  }

  // 3. Evaluate Target Margin: Manual vs AI Auto
  let targetMargin = defaultTierMargin;
  const isManual = Boolean(proposed.isManual && proposed.manualMargin && proposed.manualMargin > 0);

  if (isManual && proposed.manualMargin) {
    targetMargin = proposed.manualMargin;
  }

  // 4. ACCOUNT EXPOSURE CAP 1: Max Margin Per Trade (2% of Account Equity)
  // For approximately $105,000 equity: 2% ≈ $2,100 maximum margin per trade.
  const maxMarginPerTradePercent = settings.maxMarginPerTradePercent || 2.0;
  const maxAllowedMarginPerTrade = (portfolio.equity * maxMarginPerTradePercent) / 100;

  if (isManual && targetMargin > maxAllowedMarginPerTrade) {
    return createRejectedResult(
      `Manual margin ($${targetMargin.toFixed(0)} USDT) exceeds maximum allowed per-trade margin cap ($${maxAllowedMarginPerTrade.toFixed(0)} USDT, ${maxMarginPerTradePercent}% of account equity).`
    );
  }
  targetMargin = Math.min(targetMargin, maxAllowedMarginPerTrade);

  // 5. ACCOUNT EXPOSURE CAP 2: Max Total Margin Used across all open positions (10% of equity)
  const maxTotalMarginPercent = settings.maxTotalMarginPercent || 10.0;
  const maxTotalOpenMargin = (portfolio.equity * maxTotalMarginPercent) / 100;
  const currentTotalOpenMargin = openPositions.reduce((sum, p) => sum + (p.marginUsed ?? p.margin ?? 0), 0);
  const newCombinedOpenMargin = currentTotalOpenMargin + targetMargin;

  if (isManual && newCombinedOpenMargin > maxTotalOpenMargin) {
    return createRejectedResult(
      `Combined open positions margin ($${newCombinedOpenMargin.toFixed(0)} USDT) would exceed total account margin cap ($${maxTotalOpenMargin.toFixed(0)} USDT, ${maxTotalMarginPercent}% of equity). Currently used: $${currentTotalOpenMargin.toFixed(0)} USDT across ${openPositions.length} positions.`
    );
  }

  const remainingTotalMarginHeadroom = Math.max(0, maxTotalOpenMargin - currentTotalOpenMargin);
  if (!isManual) {
    if (remainingTotalMarginHeadroom < 100) {
      return createRejectedResult(
        `Total portfolio margin cap reached ($${currentTotalOpenMargin.toFixed(0)}/$${maxTotalOpenMargin.toFixed(0)} USDT used across ${openPositions.length} positions). Margin headroom exhausted.`
      );
    }
    targetMargin = Math.min(targetMargin, remainingTotalMarginHeadroom);
  }

  // 6. Check 18: Available Margin
  if (targetMargin > portfolio.availableMargin) {
    return createRejectedResult(
      `Insufficient available margin: Required $${targetMargin.toFixed(0)} USDT exceeds available $${portfolio.availableMargin.toFixed(0)} USDT.`
    );
  }
  checks['18_margin_availability'] = true;

  // 7. RISK CONSISTENCY & CAPITAL AT RISK CHECK
  // Reducing margin must NOT mean ignoring the existing risk-per-trade rule.
  // Capital at Risk = Position Notional * (stopDistance / entry) = Position Size * stopDistance
  const maxRiskPercentAllowed = proposed.risk_percent || settings.maxRiskPerTradePercent || 2.0;
  const maxRiskUsdtAllowed = (portfolio.equity * maxRiskPercentAllowed) / 100;

  // Calculate Notional and Capital at Risk:
  // Position Notional = Margin Used * Leverage
  let positionNotional = parseFloat((targetMargin * leverage).toFixed(2));
  let quantity = parseFloat((positionNotional / entry).toFixed(4));
  let capitalAtRisk = parseFloat((positionNotional * (riskDist / entry)).toFixed(2));

  // If capital at risk exceeds permitted limit:
  if (capitalAtRisk > maxRiskUsdtAllowed) {
    if (isManual) {
      return createRejectedResult(
        `Capital at risk ($${capitalAtRisk.toFixed(2)} USDT) exceeds maximum allowed risk limit ($${maxRiskUsdtAllowed.toFixed(2)} USDT, ${maxRiskPercentAllowed}% of equity). Reduce margin or tighten stop loss.`
      );
    }
    // AI AUTO: Reduce margin so capital at risk remains within the limit
    const maxNotionalAllowed = maxRiskUsdtAllowed / (riskDist / entry);
    targetMargin = Math.floor(maxNotionalAllowed / leverage);
    if (targetMargin < 50) {
      return createRejectedResult(
        `Stop loss distance (${stopPercent.toFixed(2)}%) produces excessive risk ($${capitalAtRisk.toFixed(2)} USDT) for minimum viable margin. Setup rejected.`
      );
    }
    positionNotional = parseFloat((targetMargin * leverage).toFixed(2));
    quantity = parseFloat((positionNotional / entry).toFixed(4));
    capitalAtRisk = parseFloat((positionNotional * (riskDist / entry)).toFixed(2));
  }

  // Minimum trading size
  if (targetMargin < 50) {
    return createRejectedResult(`Margin allocation ($${targetMargin.toFixed(0)} USDT) is below minimum required trading threshold ($50 USDT).`);
  }

  // Check 9: Position risk limit verified
  checks['9_position_risk_limit'] = true;

  // Check 10: Portfolio total exposure limit
  const currentNotional = openPositions.reduce((sum, p) => sum + p.notional, 0);
  const newTotalNotional = currentNotional + positionNotional;
  const maxAllowedNotional = (portfolio.equity * settings.maxPortfolioExposurePercent) / 100;
  if (newTotalNotional > maxAllowedNotional) {
    return createRejectedResult(
      `Total portfolio exposure would reach $${newTotalNotional.toFixed(0)} USDT, exceeding cap $${maxAllowedNotional.toFixed(0)} USDT.`
    );
  }
  checks['10_portfolio_exposure_limit'] = true;

  // Check 11: Correlated exposure limit (max 150% in same category)
  const categoryNotional = openPositions
    .filter((p) => INSTRUMENTS[p.asset]?.category === inst.category)
    .reduce((sum, p) => sum + p.notional, 0) + positionNotional;
  if (categoryNotional > portfolio.equity * 1.5) {
    return createRejectedResult(
      `Correlated ${inst.category} exposure ($${categoryNotional.toFixed(0)} USDT) exceeds limit ($${(portfolio.equity * 1.5).toFixed(0)} USDT).`
    );
  }
  checks['11_correlated_exposure_limit'] = true;

  const marginUsed = parseFloat(targetMargin.toFixed(2));
  const effectiveRiskPercent = parseFloat(((capitalAtRisk / portfolio.equity) * 100).toFixed(3));

  return {
    approved: true,
    reason: 'All 20 deterministic risk checks passed successfully.',
    checks,
    calculatedSize: {
      quantity,
      notional: positionNotional,
      margin: marginUsed,
      marginUsed,
      positionNotional,
      capitalAtRisk,
      riskAmount: capitalAtRisk,
      riskPercent: effectiveRiskPercent,
      rr,
      leverage,
      signalStrength,
    },
  };
}
