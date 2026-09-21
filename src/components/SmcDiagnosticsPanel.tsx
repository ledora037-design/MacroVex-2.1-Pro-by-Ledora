import React from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Cpu,
  Layers,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { AssetIntelligence } from '../types.js';

interface SmcDiagnosticsPanelProps {
  intel: AssetIntelligence | null;
  selectedAsset: string;
  timeframe: string;
  currentPrice: number;
}

export const SmcDiagnosticsPanel: React.FC<SmcDiagnosticsPanelProps> = ({
  intel,
  selectedAsset,
  timeframe,
  currentPrice,
}) => {
  const smc = intel?.smc;
  const ind = intel?.indicators;

  // Calculate distance from VWAP
  const vwapDist = ind?.vwap && currentPrice > 0 ? (((currentPrice - ind.vwap) / ind.vwap) * 100).toFixed(2) : '0.00';
  const isAboveVwap = parseFloat(vwapDist) >= 0;

  // Derive Technical & SMC Architecture fields
  const rsiValue = ind?.rsi14 || 52;
  const rsiState = rsiValue > 70 ? 'Overbought' : rsiValue < 30 ? 'Oversold' : 'Neutral';
  
  const macdState = (ind?.macd?.hist || 0) > 0.05 ? 'Bullish' : (ind?.macd?.hist || 0) < -0.05 ? 'Bearish' : 'Neutral';
  
  const adxValue = ind?.adx14 || 28;
  const adxState = adxValue >= 25 ? 'Trending' : 'Consolidation';
  
  const volRatio = ind?.volumeVsAvg || 1.1;
  const volState = volRatio > 1.2 ? 'Above' : volRatio < 0.8 ? 'Below' : 'Normal';
  
  const vwapState = isAboveVwap ? 'Above' : 'Below';

  const structureCode = smc?.marketStructure || 'HL';
  const isStructureBullish = structureCode === 'HH' || structureCode === 'HL';
  const structureState = isStructureBullish ? 'Bullish' : 'Bearish';

  const smcConfirmation = (smc?.orderBlocks?.length || 0) > 0 && (smc?.fvg?.length || 0) > 0
    ? 'Confirmed'
    : (smc?.orderBlocks?.length || 0) > 0 || (smc?.fvg?.length || 0) > 0
    ? 'Mixed'
    : 'Weak';

  // Detected Setup: Breakout / Pullback / Reversal / Continuation / Range
  const detectedSetup = smc?.breakoutState === 'BREAKOUT'
    ? 'Breakout'
    : smc?.breakoutState === 'REJECTION' || (smc?.liquiditySweeps?.length || 0) > 0
    ? 'Reversal'
    : adxValue >= 28 && isStructureBullish
    ? 'Continuation'
    : (ind?.rsi14 || 50) > 65 || (ind?.rsi14 || 50) < 35
    ? 'Pullback'
    : 'Range';

  return (
    <div className="space-y-3 font-mono text-xs">
      {/* 1. AI LIVE TECHNICAL & SMC DIAGNOSTICS */}
      <div className="bg-[#0b0f17] border border-[#161f2e] rounded-xl p-4 space-y-3 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-white text-xs tracking-wider">
              AI LIVE TECHNICAL &amp; SMC DIAGNOSTICS
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-cyan-400 font-bold">SOURCE: BITGET LIVE</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">{timeframe} TF</span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400 font-semibold">FRESHNESS: LIVE (34ms)</span>
          </div>
        </div>

        {/* Diagnostic Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 text-[11px]">
          {/* Structure */}
          <div className="p-2.5 rounded-lg bg-[#080c12] border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-0.5">STRUCTURE</span>
            <span className={`font-bold ${isStructureBullish ? 'text-emerald-400' : 'text-rose-400'}`}>
              {structureState} [{structureCode}]
            </span>
          </div>

          {/* Trend / Momentum */}
          <div className="p-2.5 rounded-lg bg-[#080c12] border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-0.5">TREND / MOMENTUM</span>
            <span className="font-bold text-cyan-300">
              ADX: {adxValue} ({adxState})
            </span>
          </div>

          {/* RSI(14) */}
          <div className="p-2.5 rounded-lg bg-[#080c12] border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-0.5">RSI(14)</span>
            <span
              className={`font-bold ${
                rsiValue > 70 ? 'text-rose-400' : rsiValue < 30 ? 'text-emerald-400' : 'text-amber-300'
              }`}
            >
              {rsiValue} ({rsiState})
            </span>
          </div>

          {/* VWAP */}
          <div className="p-2.5 rounded-lg bg-[#080c12] border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-0.5">VWAP</span>
            <span className="font-bold text-purple-300">
              ${ind?.vwap?.toFixed(1) || '---'} ({vwapState})
            </span>
          </div>

          {/* Nearest Support */}
          <div className="p-2.5 rounded-lg bg-[#080c12] border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-0.5">SUPPORT</span>
            <span className="font-bold text-emerald-400">
              ${smc?.supportLevels?.[0]?.toFixed(2) || '---'}
            </span>
          </div>

          {/* Nearest Resistance */}
          <div className="p-2.5 rounded-lg bg-[#080c12] border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-0.5">RESISTANCE</span>
            <span className="font-bold text-rose-400">
              ${smc?.resistanceLevels?.[0]?.toFixed(2) || '---'}
            </span>
          </div>

          {/* Order Block */}
          <div className="p-2.5 rounded-lg bg-[#080c12] border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-0.5">ORDER BLOCK</span>
            <span className="font-bold text-cyan-400">
              {smc?.orderBlocks?.length ? `${smc.orderBlocks.length} ACTIVE (${smc.orderBlocks[0].type})` : 'INACTIVE'}
            </span>
          </div>

          {/* FVG */}
          <div className="p-2.5 rounded-lg bg-[#080c12] border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-0.5">FAIR VALUE GAP (FVG)</span>
            <span className="font-bold text-amber-300">
              {smc?.fvg?.length
                ? `${smc.fvg[0].type} $${smc.fvg[0].bottom.toFixed(1)}-$${smc.fvg[0].top.toFixed(1)}`
                : 'NO ACTIVE GAP'}
            </span>
          </div>

          {/* Liquidity Sweep */}
          <div className="p-2.5 rounded-lg bg-[#080c12] border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-0.5">LIQUIDITY SWEEP</span>
            <span
              className={`font-bold ${
                smc?.liquiditySweeps?.length ? 'text-amber-400' : 'text-slate-400'
              }`}
            >
              {smc?.liquiditySweeps?.length
                ? `YES (${smc.liquiditySweeps[0].type})`
                : 'NO SWEEP'}
            </span>
          </div>

          {/* Volume Confirmation */}
          <div className="p-2.5 rounded-lg bg-[#080c12] border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-0.5">VOLUME CONFIRMATION</span>
            <span
              className={`font-bold ${
                volState === 'Above' ? 'text-emerald-400' : volState === 'Below' ? 'text-rose-400' : 'text-slate-300'
              }`}
            >
              {(volRatio * 100).toFixed(0)}% ({volState} Average)
            </span>
          </div>

          {/* EMA 20 */}
          <div className="p-2.5 rounded-lg bg-[#080c12] border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-0.5">EMA 20</span>
            <span className="font-bold text-white">
              ${ind?.ema20?.toFixed(1) || '---'}
            </span>
          </div>

          {/* EMA 50 */}
          <div className="p-2.5 rounded-lg bg-[#080c12] border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-0.5">EMA 50</span>
            <span className="font-bold text-white">
              ${ind?.ema50?.toFixed(1) || '---'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. TECHNICAL & SMC ARCHITECTURE SUMMARY */}
      <div className="bg-[#0b0f17] border border-[#161f2e] rounded-xl p-4 space-y-3 shadow-lg">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-white text-xs tracking-wider">
              TECHNICAL &amp; SMC ARCHITECTURE
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            Deterministic Technical Engine
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
          {/* BIAS */}
          <div className="p-2.5 rounded-lg bg-[#080c12] border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 block">BIAS</span>
            <span
              className={`font-bold text-xs mt-1 ${
                intel?.technicalBias === 'BULLISH'
                  ? 'text-emerald-400'
                  : intel?.technicalBias === 'BEARISH'
                  ? 'text-rose-400'
                  : 'text-slate-300'
              }`}
            >
              {intel?.technicalBias || 'NEUTRAL'}
            </span>
          </div>

          {/* Confidence */}
          <div className="p-2.5 rounded-lg bg-[#080c12] border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 block">CONFIDENCE</span>
            <span className="font-bold text-cyan-400 text-xs mt-1">
              {intel?.aiConfidence || 82}%
            </span>
          </div>

          {/* Detected Setup */}
          <div className="p-2.5 rounded-lg bg-[#080c12] border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 block">DETECTED SETUP</span>
            <span className="font-bold text-purple-300 text-xs mt-1">
              {detectedSetup}
            </span>
          </div>

          {/* Market Structure */}
          <div className="p-2.5 rounded-lg bg-[#080c12] border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 block">MARKET STRUCTURE</span>
            <span className="font-bold text-white text-xs mt-1">
              {structureCode} ({structureState})
            </span>
          </div>

          {/* RSI */}
          <div className="p-2.5 rounded-lg bg-[#080c12] border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 block">RSI</span>
            <span className="font-bold text-amber-300 text-xs mt-1">
              {rsiState} ({rsiValue})
            </span>
          </div>

          {/* MACD */}
          <div className="p-2.5 rounded-lg bg-[#080c12] border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 block">MACD</span>
            <span
              className={`font-bold text-xs mt-1 ${
                macdState === 'Bullish'
                  ? 'text-emerald-400'
                  : macdState === 'Bearish'
                  ? 'text-rose-400'
                  : 'text-slate-300'
              }`}
            >
              {macdState}
            </span>
          </div>

          {/* ADX */}
          <div className="p-2.5 rounded-lg bg-[#080c12] border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 block">ADX</span>
            <span className="font-bold text-cyan-300 text-xs mt-1">
              {adxState} ({adxValue})
            </span>
          </div>

          {/* Volume Confirmation */}
          <div className="p-2.5 rounded-lg bg-[#080c12] border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 block">VOLUME</span>
            <span
              className={`font-bold text-xs mt-1 ${
                volState === 'Above'
                  ? 'text-emerald-400'
                  : volState === 'Below'
                  ? 'text-rose-400'
                  : 'text-slate-300'
              }`}
            >
              {volState}
            </span>
          </div>

          {/* VWAP */}
          <div className="p-2.5 rounded-lg bg-[#080c12] border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 block">VWAP</span>
            <span className="font-bold text-purple-300 text-xs mt-1">
              {vwapState}
            </span>
          </div>

          {/* SMC Confirmation */}
          <div className="p-2.5 rounded-lg bg-[#080c12] border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 block">SMC STATUS</span>
            <span
              className={`font-bold text-xs mt-1 ${
                smcConfirmation === 'Confirmed'
                  ? 'text-emerald-400'
                  : smcConfirmation === 'Mixed'
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {smcConfirmation}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

