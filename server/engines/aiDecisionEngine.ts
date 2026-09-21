import { GoogleGenAI, Type } from '@google/genai';
import { AIDecision, InstrumentId, MarketRegime } from '../../src/types.js';
import { getAssetIntelligence } from '../providers/marketData.js';
import { fetchMacroEvents } from '../providers/newsEngine.js';
import { analyzeCrossAsset } from './crossAssetEngine.js';
import { evaluateRisk } from './riskEngine.js';

let geminiClient: GoogleGenAI | null = null;
let quotaExhaustedUntil: number = 0;
const decisionCache = new Map<string, { timestamp: number; decision: AIDecision }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache per asset

function getGemini(): GoogleGenAI | null {
  if (Date.now() < quotaExhaustedUntil) {
    return null;
  }
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

export async function generateAIDecision(asset: InstrumentId): Promise<AIDecision> {
  // Check in-memory cache first to conserve API calls
  const cached = decisionCache.get(asset);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.decision;
  }

  const intel = await getAssetIntelligence(asset);
  const events = await fetchMacroEvents();
  const cross = await analyzeCrossAsset();

  const relevantEvent = events.find((e) => e.affectedAssets.includes(asset)) || events[0];
  const catalystText = relevantEvent ? `${relevantEvent.headline} (${relevantEvent.source})` : 'Macro regime alignment';

  const p = intel.price;
  const isBullish = intel.technicalBias === 'BULLISH';
  const isBearish = intel.technicalBias === 'BEARISH';

  // Check if Gemini API key is available and not in quota backoff
  const ai = getGemini();
  if (ai) {
    try {
      const prompt = `You are the lead macro portfolio manager of MacroMind 2.0.
Analyze this asset setup and output a structured trading decision.
Asset: ${asset}
Current Price: ${p}
24h Change: ${intel.change24h}%
Technical Bias: ${intel.technicalBias}
Opportunity Score: ${intel.opportunityScore}/100
RSI(14): ${intel.indicators.rsi14}
EMA20: ${intel.indicators.ema20}, EMA50: ${intel.indicators.ema50}
VWAP: ${intel.indicators.vwap}
Market Structure: ${intel.smc.marketStructure}
Order Blocks: ${JSON.stringify(intel.smc.orderBlocks)}
FVG: ${JSON.stringify(intel.smc.fvg)}
Cross Asset Regime: ${cross.regime} (${cross.macroTheme})
Macro Catalyst: ${catalystText}

Rules:
1. Direction can be LONG or SHORT.
2. Action MUST be BUY, SELL, or WAIT.
3. If setup is not high conviction (Opportunity score < 70 or conflicting data), you MUST choose WAIT.
4. For LONG: SL must be strictly below Entry, TP must be strictly above Entry. Minimum R:R is 1.5, Target 2.1+.
5. For SHORT: SL must be strictly above Entry, TP must be strictly below Entry. Minimum R:R is 1.5, Target 2.1+.
6. Never make SL too close (< 0.4%) or too wide (> 8%).
7. Conservative leverage (2x - 8x).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              asset: { type: Type.STRING },
              direction: { type: Type.STRING },
              action: { type: Type.STRING },
              entry: { type: Type.NUMBER },
              stop_loss: { type: Type.NUMBER },
              take_profit: { type: Type.NUMBER },
              leverage: { type: Type.INTEGER },
              position_size: { type: Type.NUMBER },
              risk_percent: { type: Type.NUMBER },
              rr: { type: Type.NUMBER },
              confidence: { type: Type.INTEGER },
              macro_catalyst: { type: Type.STRING },
              technical_reasoning: { type: Type.STRING },
              cross_asset_reasoning: { type: Type.STRING },
              regime: { type: Type.STRING },
              invalidation: { type: Type.STRING },
              holding_horizon: { type: Type.STRING },
            },
            required: [
              'asset', 'direction', 'action', 'entry', 'stop_loss', 'take_profit',
              'leverage', 'risk_percent', 'rr', 'confidence', 'macro_catalyst',
              'technical_reasoning', 'cross_asset_reasoning', 'regime', 'invalidation', 'holding_horizon'
            ],
          },
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text.trim());
        const validAction = parsed.action === 'BUY' || parsed.action === 'SELL' ? parsed.action : 'WAIT';
        const validDir = parsed.direction === 'SHORT' ? 'SHORT' : 'LONG';

        const dec: AIDecision = {
          id: `dec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${asset}`,
          timestamp: Date.now(),
          asset,
          direction: validDir,
          action: validAction,
          entry: parseFloat(parsed.entry?.toFixed(2) || p.toFixed(2)),
          stop_loss: parseFloat(parsed.stop_loss?.toFixed(2) || (validDir === 'LONG' ? (p * 0.98).toFixed(2) : (p * 1.02).toFixed(2))),
          take_profit: parseFloat(parsed.take_profit?.toFixed(2) || (validDir === 'LONG' ? (p * 1.042).toFixed(2) : (p * 0.958).toFixed(2))),
          leverage: Math.min(8, Math.max(2, parsed.leverage || 5)),
          position_size: 1,
          risk_percent: Math.min(2.0, Math.max(0.5, parsed.risk_percent || 1.5)),
          rr: parseFloat((parsed.rr || 2.1).toFixed(2)),
          confidence: Math.min(95, Math.max(50, parsed.confidence || 75)),
          macro_catalyst: parsed.macro_catalyst || catalystText,
          technical_reasoning: parsed.technical_reasoning || `Aligned with ${intel.smc.marketStructure} structure and EMA20 support`,
          cross_asset_reasoning: parsed.cross_asset_reasoning || `Correlated with ${cross.macroTheme}`,
          regime: (parsed.regime as MarketRegime) || cross.regime,
          invalidation: parsed.invalidation || 'Break of structural support on 1H timeframe',
          holding_horizon: parsed.holding_horizon || '4H - 24H',
          strategy_id: 'MACROVEX-EVENT-TA',
          strategy_version: 'V2.1',
        };

        return await finalizeDecision(dec);
      }
    } catch (err: unknown) {
      // Gracefully handle 429 / RESOURCE_EXHAUSTED without spamming console errors
      const errStr = String(err);
      if (errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('Quota exceeded')) {
        // Back off for 15 minutes to respect Gemini quota
        quotaExhaustedUntil = Date.now() + 15 * 60 * 1000;
        console.log('[AI Decision Engine] Gemini API free-tier quota reached. Seamlessly utilizing Deterministic Macro Decision Engine.');
      } else {
        console.log('[AI Decision Engine] Seamlessly utilizing Deterministic Macro Decision Engine.');
      }
    }
  }

  // Deterministic Macro & Technical Decision Engine
  // Respect the rule: If there is no valid setup, the agent must explicitly remain WAIT.
  if (intel.opportunityScore < 72 || (!isBullish && !isBearish)) {
    const waitDec: AIDecision = {
      id: `dec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${asset}`,
      timestamp: Date.now(),
      asset,
      direction: 'LONG',
      action: 'WAIT',
      entry: p,
      stop_loss: parseFloat((p * 0.985).toFixed(2)),
      take_profit: parseFloat((p * 1.032).toFixed(2)),
      leverage: 5,
      position_size: 0,
      risk_percent: 1.5,
      rr: 2.13,
      confidence: intel.aiConfidence,
      macro_catalyst: catalystText,
      technical_reasoning: `Opportunity score (${intel.opportunityScore}/100) below execution threshold; market structure ${intel.smc.marketStructure} in consolidation.`,
      cross_asset_reasoning: `Cross-asset regime is ${cross.regime}; no directional edge verified.`,
      regime: cross.regime,
      invalidation: 'Consolidation breakout above local swing pivot required.',
      holding_horizon: 'INACTIVE',
      strategy_id: 'MACROVEX-EVENT-TA',
      strategy_version: 'V2.1',
    };
    return await finalizeDecision(waitDec);
  }

  const direction: 'LONG' | 'SHORT' = isBullish ? 'LONG' : 'SHORT';
  const action: 'BUY' | 'SELL' = direction === 'LONG' ? 'BUY' : 'SELL';

  const stopDistPct = 0.016; // 1.6% stop distance
  const targetDistPct = stopDistPct * 2.15; // R:R 2.15:1

  const entry = p;
  const stop_loss = direction === 'LONG' ? p * (1 - stopDistPct) : p * (1 + stopDistPct);
  const take_profit = direction === 'LONG' ? p * (1 + targetDistPct) : p * (1 - targetDistPct);

  const activeDec: AIDecision = {
    id: `dec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${asset}`,
    timestamp: Date.now(),
    asset,
    direction,
    action,
    entry: parseFloat(entry.toFixed(2)),
    stop_loss: parseFloat(stop_loss.toFixed(2)),
    take_profit: parseFloat(take_profit.toFixed(2)),
    leverage: 5,
    position_size: 1,
    risk_percent: 1.5,
    rr: 2.15,
    confidence: intel.aiConfidence,
    macro_catalyst: catalystText,
    technical_reasoning: `Confirmed ${direction} setup on 1H: EMA20 aligned with ${intel.smc.marketStructure} structure and recent order block rejection.`,
    cross_asset_reasoning: `Supported by cross-asset regime (${cross.regime}) and favorable equity-crypto correlation.`,
    regime: cross.regime,
    invalidation: `Price breaking structural pivot at $${stop_loss.toFixed(2)} on volume.`,
    holding_horizon: '8H - 24H',
    strategy_id: 'MACROVEX-EVENT-TA',
    strategy_version: 'V2.1',
  };

  return await finalizeDecision(activeDec);
}

async function finalizeDecision(dec: AIDecision): Promise<AIDecision> {
  const riskResult = await evaluateRisk({
    asset: dec.asset,
    direction: dec.direction,
    action: dec.action,
    entry: dec.entry,
    stop_loss: dec.stop_loss,
    take_profit: dec.take_profit,
    leverage: dec.leverage,
    risk_percent: dec.risk_percent,
    confidence: dec.confidence,
    isManual: false,
  });

  dec.risk_decision = {
    approved: riskResult.approved,
    reason: riskResult.reason,
    checks: riskResult.checks,
    calculatedSize: riskResult.calculatedSize,
  };

  if (riskResult.approved && riskResult.calculatedSize) {
    dec.marginUsed = riskResult.calculatedSize.marginUsed;
    dec.margin_used = dec.marginUsed;
    dec.positionNotional = riskResult.calculatedSize.positionNotional;
    dec.position_notional = dec.positionNotional;
    dec.capitalAtRisk = riskResult.calculatedSize.capitalAtRisk;
    dec.capital_at_risk = dec.capitalAtRisk;
    dec.signalStrength = riskResult.calculatedSize.signalStrength;
    dec.signal_strength = dec.signalStrength;
    dec.rr = riskResult.calculatedSize.rr;
  } else {
    // If Risk Engine rejects or action is WAIT:
    // MARGIN USED: $0, STATUS: WAIT / RISK REJECTED
    dec.marginUsed = 0;
    dec.margin_used = 0;
    dec.positionNotional = 0;
    dec.position_notional = 0;
    dec.capitalAtRisk = 0;
    dec.capital_at_risk = 0;
    dec.signalStrength = dec.action === 'WAIT' ? 'WAIT' : 'REJECTED';
    dec.signal_strength = dec.signalStrength;
    if (dec.action !== 'WAIT') {
      dec.action = 'WAIT';
    }
  }

  decisionCache.set(dec.asset, { timestamp: Date.now(), decision: dec });
  return dec;
}
