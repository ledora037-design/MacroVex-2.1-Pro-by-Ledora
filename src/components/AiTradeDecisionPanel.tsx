import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Cpu,
  Layers,
  Play,
  RotateCw,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { AIDecisionRecord, AssetIntelligence } from '../types.js';

interface AiTradeDecisionPanelProps {
  selectedAsset: string;
  intel: AssetIntelligence | null;
  currentPrice: number;
  onExecuteTrade?: (trade: any) => void;
  onAutofillTicket?: () => void;
}

export const AiTradeDecisionPanel: React.FC<AiTradeDecisionPanelProps> = ({
  selectedAsset,
  intel,
  currentPrice,
  onExecuteTrade,
  onAutofillTicket,
}) => {
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [lastDecision, setLastDecision] = useState<AIDecisionRecord | null>(null);

  // Compute calculated trade parameters
  const isBull = intel?.technicalBias === 'BULLISH';
  const defaultAction: 'BUY' | 'SELL' | 'WAIT' = intel?.technicalBias === 'BULLISH' ? 'BUY' : intel?.technicalBias === 'BEARISH' ? 'SELL' : 'WAIT';

  const entryPrice = currentPrice > 0 ? currentPrice : 100;
  const stopLoss = isBull ? entryPrice * 0.982 : entryPrice * 1.018;
  const takeProfit = isBull ? entryPrice * 1.042 : entryPrice * 0.958;
  const riskDistance = Math.abs(entryPrice - stopLoss);
  const rewardDistance = Math.abs(takeProfit - entryPrice);
  const defaultRiskReward = riskDistance > 0 ? (rewardDistance / riskDistance).toFixed(2) : '2.20';
  const confidence = intel?.aiConfidence || 84;

  const handleEvaluateAI = async () => {
    setIsEvaluating(true);
    try {
      const res = await fetch('/api/decisions/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asset: selectedAsset }),
      });
      if (res.ok) {
        const data = await res.json();
        setLastDecision(data);
      }
    } catch (err) {
      console.error('Failed to trigger AI decision evaluation:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  useEffect(() => {
    handleEvaluateAI();
  }, [selectedAsset]);

  // Read canonical Risk Engine sizing and gate decisions
  const currentAction = lastDecision?.action || defaultAction;
  const entryVal = lastDecision?.entry ?? entryPrice;
  const slVal = lastDecision?.stop_loss ?? stopLoss;
  const tpVal = lastDecision?.take_profit ?? takeProfit;
  const leverageVal = lastDecision?.leverage ?? 5;
  const rrVal = lastDecision?.rr !== undefined ? lastDecision.rr.toFixed(2) : defaultRiskReward;
  const confidenceVal = lastDecision?.confidence ?? confidence;

  // Authoritative Risk Gate result from Risk Engine
  const passesRiskEngine = lastDecision?.risk_decision
    ? lastDecision.risk_decision.approved && currentAction !== 'WAIT'
    : (parseFloat(rrVal) >= 1.5 && confidenceVal >= 60 && currentAction !== 'WAIT');

  const riskRejectionReason = lastDecision?.risk_decision?.reason || (
    currentAction === 'WAIT'
      ? 'Opportunity score or market structure below execution barrier (AI WAIT)'
      : parseFloat(rrVal) < 1.5
      ? 'Risk:Reward below minimum required threshold (1.5:1)'
      : confidenceVal < 60
      ? 'AI Conviction score below minimum execution barrier (60%)'
      : 'Deterministic risk controls active'
  );

  // Canonical calculations (zeroed out if rejected/waiting)
  const marginUsed = passesRiskEngine
    ? (lastDecision?.marginUsed ?? lastDecision?.margin_used ?? lastDecision?.risk_decision?.calculatedSize?.marginUsed ?? 0)
    : 0;
  const positionNotional = passesRiskEngine
    ? (lastDecision?.positionNotional ?? lastDecision?.position_notional ?? lastDecision?.risk_decision?.calculatedSize?.positionNotional ?? 0)
    : 0;
  const capitalAtRisk = passesRiskEngine
    ? (lastDecision?.capitalAtRisk ?? lastDecision?.capital_at_risk ?? lastDecision?.risk_decision?.calculatedSize?.capitalAtRisk ?? 0)
    : 0;
  const signalStrength = passesRiskEngine
    ? (lastDecision?.signalStrength ?? lastDecision?.signal_strength ?? lastDecision?.risk_decision?.calculatedSize?.signalStrength ?? (confidenceVal >= 80 ? 'STRONG' : 'NORMAL'))
    : (currentAction === 'WAIT' ? 'WAIT' : 'REJECTED');

  return (
    <div className="bg-[#0b0f17] border border-[#161f2e] rounded-xl p-4 font-mono text-xs space-y-3 shadow-lg">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Bot className="w-3 h-3" />
          </div>
          <span className="font-bold text-white text-xs tracking-wider">
            AI TRADE DECISION &amp; RISK AUTHORITY
          </span>
        </div>
        <button
          onClick={handleEvaluateAI}
          disabled={isEvaluating}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[11px] font-mono font-bold transition-colors cursor-pointer disabled:opacity-50"
        >
          <RotateCw className={`w-3 h-3 ${isEvaluating ? 'animate-spin' : ''}`} />
          <span>{isEvaluating ? 'EVALUATING...' : 'AI RE-EVALUATE'}</span>
        </button>
      </div>

      {/* Decision Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Left: Action & Confidence (4 Cols) */}
        <div className="md:col-span-4 p-3 rounded-lg bg-[#080c12] border border-slate-800 flex flex-col justify-between space-y-2">
          <div>
            <span className="text-[10px] text-slate-400 block">RECOMMENDED ACTION</span>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-xl font-bold px-2.5 py-0.5 rounded tracking-wider ${
                  currentAction === 'BUY'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : currentAction === 'SELL'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                {currentAction}
              </span>
              <span className="text-xs text-slate-300 font-bold">{selectedAsset}/USDT</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-slate-400">AI CONVICTION:</span>
              <span className="text-cyan-400 font-bold">{confidenceVal}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded"
                style={{ width: `${confidenceVal}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Key Trade Parameters (8 Cols) */}
        <div className="md:col-span-8 p-3 rounded-lg bg-[#080c12] border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
          <div>
            <span className="text-[10px] text-slate-400 block">ENTRY PRICE</span>
            <span className="font-bold font-mono text-white text-xs">${entryVal.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-[10px] text-rose-400 block">STOP LOSS</span>
            <span className="font-bold font-mono text-rose-400 text-xs">${slVal.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-[10px] text-emerald-400 block">TAKE PROFIT</span>
            <span className="font-bold font-mono text-emerald-400 text-xs">${tpVal.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-[10px] text-cyan-400 block">R:R RATIO</span>
            <span className="font-bold font-mono text-cyan-300 text-xs">{rrVal}:1</span>
          </div>

          {/* Core Sizing & Dynamic Risk Metrics */}
          <div className="bg-[#0e1624] p-1.5 rounded border border-amber-500/20">
            <span className="text-[9px] text-amber-400 font-bold block uppercase tracking-wider">MARGIN USED</span>
            <span className="font-bold font-mono text-amber-300 text-xs">
              {marginUsed > 0 ? `$${marginUsed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT` : '$0.00 USDT'}
            </span>
          </div>
          <div className="bg-[#0e1624] p-1.5 rounded border border-slate-700">
            <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">LEVERAGE</span>
            <span className="font-bold font-mono text-amber-300 text-xs">{leverageVal}x</span>
          </div>
          <div className="bg-[#0e1624] p-1.5 rounded border border-cyan-500/20">
            <span className="text-[9px] text-cyan-400 font-bold block uppercase tracking-wider">POSITION NOTIONAL</span>
            <span className="font-bold font-mono text-white text-xs">
              {positionNotional > 0 ? `$${positionNotional.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT` : '$0.00 USDT'}
            </span>
          </div>
          <div className="bg-[#0e1624] p-1.5 rounded border border-slate-700">
            <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">CAPITAL AT RISK</span>
            <span className="font-bold font-mono text-white text-xs">
              {capitalAtRisk > 0 ? `$${capitalAtRisk.toFixed(2)}` : '$0.00'}
            </span>
          </div>

          <div className="sm:col-span-2">
            <span className="text-[10px] text-slate-400 block">SIGNAL STRENGTH</span>
            <span
              className={`inline-block mt-0.5 px-2 py-0.5 rounded font-extrabold text-[10px] tracking-wide border ${
                signalStrength === 'VERY STRONG'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : signalStrength === 'STRONG'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : signalStrength === 'NORMAL'
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                  : signalStrength === 'WEAKER'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {signalStrength}
            </span>
          </div>
          <div className="sm:col-span-2">
            <span className="text-[10px] text-slate-400 block">INVALIDATION</span>
            <span className="font-bold text-slate-300 truncate block">
              {lastDecision?.invalidation || `Sweep under $${slVal.toFixed(2)}`}
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Sizing Equation Callout */}
      {passesRiskEngine && marginUsed > 0 && (
        <div className="space-y-1.5">
          <div className="px-3 py-2 rounded-lg bg-[#0e1726] border border-cyan-500/30 flex items-center justify-between text-[11px] font-mono">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold">SIZING FORMULA:</span>
              <span className="text-amber-300 font-bold">${marginUsed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT Margin</span>
              <span className="text-slate-500 font-bold">×</span>
              <span className="text-cyan-400 font-bold">{leverageVal}x Leverage</span>
              <span className="text-slate-500 font-bold">=</span>
              <span className="text-emerald-400 font-extrabold">${positionNotional.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT Notional</span>
            </div>
            <span className="text-[10px] text-slate-400 hidden sm:inline">DETERMINISTIC RISK ALLOCATION</span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-[#090d14] border border-slate-800/80 text-[10px] font-mono text-slate-400 flex flex-wrap items-center justify-between gap-1.5">
            <span className="text-slate-400 font-bold">RISK CLARITY:</span>
            <span><strong className="text-amber-300">USDT COMMITTED</strong> (Collateral)</span>
            <span className="text-slate-600 font-bold">≠</span>
            <span><strong className="text-rose-300">USDT AT RISK</strong> (${capitalAtRisk.toFixed(2)} Max Loss)</span>
            <span className="text-slate-600 font-bold">≠</span>
            <span><strong className="text-cyan-300">POSITION NOTIONAL</strong> (${positionNotional.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>
          </div>
        </div>
      )}

      {/* Deterministic Risk Engine Authority Pipeline */}
      <div className="p-3 rounded-lg bg-[#080c12] border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span className="text-slate-400 font-bold">PIPELINE:</span>
            <span className="text-cyan-400">AI DECISION</span>
            <ArrowRight className="w-3 h-3 text-slate-500" />
            <span className="text-amber-400 font-bold">DETERMINISTIC RISK ENGINE</span>
            <ArrowRight className="w-3 h-3 text-slate-500" />
            <span className="text-emerald-400">PAPER EXECUTION</span>
          </div>

          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded font-bold text-[10px] ${
              passesRiskEngine
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
            }`}
          >
            {passesRiskEngine ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
            <span>{passesRiskEngine ? 'RISK ENGINE: PASS' : 'RISK ENGINE: REJECTED / WAIT'}</span>
          </div>
        </div>

        {!passesRiskEngine && (
          <div className="p-2 rounded bg-rose-950/20 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>
              Execution Blocked by Deterministic Risk Gate: {riskRejectionReason}. Safety rule strictly enforced. MARGIN USED: $0.
            </span>
          </div>
        )}
      </div>

      {/* WHY? Explanation Section */}
      <div className="p-3 rounded-lg bg-[#080c12] border border-slate-800 space-y-1.5">
        <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1">
          <Zap className="w-3 h-3" />
          WHY? AI CROSS-ASSET &amp; SMC REASONING:
        </span>
        <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
          {lastDecision?.technical_reasoning ||
            `${selectedAsset} is displaying high structural confluence on Bitget MCP live market feeds. Higher-timeframe market structure confirms ${
              isBull ? 'Higher Lows (HL) accumulation' : 'Lower Highs (LH) distribution'
            } with price holding key institutional order block support and active fair value gap (FVG) re-test. Cross-asset liquidity flow signals institutional risk tolerance with supportive transmission.`}
        </p>
      </div>

      {/* Bottom Action Bar */}
      {onAutofillTicket && (
        <div className="flex items-center justify-end pt-1">
          <button
            onClick={onAutofillTicket}
            disabled={!passesRiskEngine}
            className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-black font-bold text-xs flex items-center gap-1.5 transition-all shadow cursor-pointer"
          >
            <Play className="w-3 h-3" />
            <span>APPLY TO ORDER TICKET</span>
          </button>
        </div>
      )}
    </div>
  );
};

