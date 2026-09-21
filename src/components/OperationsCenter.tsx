import React, { useState } from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Layers,
  Percent,
  Play,
  RotateCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  XCircle,
  Zap,
} from 'lucide-react';
import {
  AIDecision,
  AIActivityItem,
  AssetSummary,
  ClosedTrade,
  Position,
} from '../types.js';
import { formatUTCDateTime } from '../utils/timeFormat.js';
import { DailyPnlHistoryChart } from './DailyPnlHistoryChart.js';

interface OperationsCenterProps {
  agentState: {
    state: string;
    currentAsset: string | null;
    lastCycleAt: number;
    conviction: number;
  };
  radar: AssetSummary[];
  openPositions: Position[];
  aiDecisions: AIDecision[];
  activities: AIActivityItem[];
  dailyPnlHistory?: Array<{ date: string; pnl: number }>;
  onSelectAsset: (asset: string) => void;
  onOpenJournal: (tradeId: string) => void;
  onClosePosition: (id: string) => void;
  onTriggerCycle: () => void;
  isTriggering: boolean;
}

export const OperationsCenter: React.FC<OperationsCenterProps> = ({
  agentState,
  radar,
  openPositions,
  aiDecisions,
  activities,
  dailyPnlHistory,
  onSelectAsset,
  onOpenJournal,
  onClosePosition,
  onTriggerCycle,
  isTriggering,
}) => {
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'CRYPTO' | 'EQUITIES' | 'COMMODITIES'>('ALL');
  const [closingId, setClosingId] = useState<string | null>(null);

  const loopSteps = [
    { id: 'SCANNING', label: 'SCAN' },
    { id: 'ANALYZING EVENT', label: 'ANALYZE' },
    { id: 'CROSS-CHECKING', label: 'CROSS-CHECK' },
    { id: 'RISK CHECK', label: 'RISK GATE' },
    { id: 'EXECUTING', label: 'EXECUTE' },
    { id: 'MONITORING', label: 'MONITOR' },
    { id: 'WAITING', label: 'WAIT/STANDBY' },
  ];

  const filteredRadar = radar.filter((item) => {
    if (filterCategory === 'ALL') return true;
    return item.category === filterCategory;
  });

  const handleClose = async (id: string) => {
    setClosingId(id);
    try {
      await onClosePosition(id);
    } finally {
      setClosingId(null);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* 1. Autonomous Agent Control Deck */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-[#0e1526] via-[#10172a] to-[#0d121f] border border-cyan-500/20 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
              <span className="font-display text-sm font-bold tracking-wider text-cyan-400">
                AUTONOMOUS TRADING ENGINE STATE MACHINE
              </span>
              <span className="text-xs font-mono text-slate-400">
                • Strategy: MACROVEX-EVENT-TA-V2.1
              </span>
            </div>
            <p className="text-xs text-slate-300 font-mono mt-1">
              Autonomous loop scans 24 cross-asset instruments, correlates macro catalysts with SMC technical structures, and routes all signals through 20 deterministic risk checks.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-lg bg-black/40 border border-slate-800 font-mono text-xs">
              <span className="text-slate-400">AI CONVICTION: </span>
              <span className="text-cyan-400 font-bold">{agentState.conviction}%</span>
            </div>
            <button
              onClick={onTriggerCycle}
              disabled={isTriggering}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-500 text-black font-mono font-bold text-xs hover:bg-cyan-400 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isTriggering ? 'animate-spin' : ''}`} />
              EXECUTE CYCLE NOW
            </button>
          </div>
        </div>

        {/* State Machine Step Pipeline */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="grid grid-cols-3 sm:grid-cols-7 gap-1.5">
            {loopSteps.map((step, idx) => {
              const isCurrent = agentState.state === step.id;
              return (
                <div
                  key={step.id}
                  className={`p-2 rounded border text-center transition-all ${
                    isCurrent
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/20 font-bold'
                      : 'bg-slate-900/50 border-slate-800 text-slate-500 font-mono'
                  }`}
                >
                  <div className="text-[10px] text-slate-400">{idx + 1}. PHASE</div>
                  <div className="text-xs font-display tracking-wider mt-0.5">{step.label}</div>
                  {isCurrent && (
                    <div className="text-[9px] text-cyan-400 font-mono mt-0.5 animate-pulse">
                      ● ACTIVE NOW
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Visual Performance Tracking: Historical Daily P&L Line Chart */}
      <DailyPnlHistoryChart dailyPnlHistory={dailyPnlHistory} />

      {/* 3. Open Positions Live Monitor */}
      <div className="p-4 rounded-xl bg-[#0e1422] border border-slate-800/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h2 className="font-display text-sm font-bold text-white tracking-wide">
              ACTIVE POSITIONS MONITOR
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              {openPositions.length} / 5 MAXIMUM SLOTS
            </span>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Real-time Mark-to-Market & SL/TP Triggers
          </span>
        </div>

        {openPositions.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-slate-800 rounded-lg">
            <ShieldCheck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-mono text-slate-400">NO POSITIONS CURRENTLY ACTIVE</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Autonomous agent is actively scanning markets or waiting for high-conviction catalysts.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-[#090d14] text-slate-400 text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">ASSET</th>
                  <th className="py-2.5 px-3">SIDE</th>
                  <th className="py-2.5 px-3">ENTRY</th>
                  <th className="py-2.5 px-3">MARK PRICE</th>
                  <th className="py-2.5 px-3">STOP LOSS</th>
                  <th className="py-2.5 px-3">TAKE PROFIT</th>
                  <th className="py-2.5 px-3">NOTIONAL / MARGIN</th>
                  <th className="py-2.5 px-3">UNREALIZED P&L</th>
                  <th className="py-2.5 px-3">R:R</th>
                  <th className="py-2.5 px-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {openPositions.map((pos, idx) => {
                  const isLong = pos.direction === 'LONG';
                  const isProfitable = pos.unrealizedPnl >= 0;
                  return (
                    <tr key={pos.id ? `${pos.id}-${idx}` : `pos-${idx}`} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{pos.asset}</span>
                          <span className="text-[10px] text-slate-500">[{pos.leverage}x]</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                          {pos.macroCatalyst}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            isLong
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {pos.direction}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300 font-mono">${pos.entry.toFixed(2)}</td>
                      <td className="py-3 px-3 text-cyan-300 font-mono font-bold">
                        ${pos.currentPrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-rose-400 font-mono">${pos.stopLoss.toFixed(2)}</td>
                      <td className="py-3 px-3 text-emerald-400 font-mono">${pos.takeProfit.toFixed(2)}</td>
                      <td className="py-3 px-3 text-slate-300 font-mono">
                        <div>${pos.notional.toFixed(0)}</div>
                        <div className="text-[10px] text-slate-500">M: ${pos.margin.toFixed(0)}</div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold">
                        <div className={isProfitable ? 'text-emerald-400' : 'text-rose-400'}>
                          {isProfitable ? '+' : ''}${pos.unrealizedPnl.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {isProfitable ? '+' : ''}{pos.unrealizedPnlPercent.toFixed(1)}%
                        </div>
                      </td>
                      <td className="py-3 px-3 text-amber-400 font-mono">{pos.rr}:1</td>
                      <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => onOpenJournal(pos.tradeId)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono transition-colors cursor-pointer"
                          title="View Trade Journal with 5-Step Execution Timeline"
                        >
                          JOURNAL
                        </button>
                        <button
                          onClick={() => handleClose(pos.id)}
                          disabled={closingId === pos.id}
                          className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[11px] font-mono transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {closingId === pos.id ? 'CLOSING...' : 'CLOSE'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. Two-Column Operations Grid: Opportunity Radar & AI Decision Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Market Opportunity Radar (7 Cols) */}
        <div className="lg:col-span-7 p-4 rounded-xl bg-[#0e1422] border border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <h2 className="font-display text-sm font-bold text-white tracking-wide">
                MARKET OPPORTUNITY RADAR
              </h2>
            </div>
            <div className="flex items-center gap-1 font-mono text-[11px]">
              {(['ALL', 'CRYPTO', 'EQUITIES', 'COMMODITIES'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                    filterCategory === cat
                      ? 'bg-cyan-500 text-black font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-[#090d14] text-slate-400 text-[11px] sticky top-0 border-b border-slate-800">
                <tr>
                  <th className="py-2 px-2.5">ASSET</th>
                  <th className="py-2 px-2.5">PRICE</th>
                  <th className="py-2 px-2.5">24H</th>
                  <th className="py-2 px-2.5">SCORE</th>
                  <th className="py-2 px-2.5">BIAS</th>
                  <th className="py-2 px-2.5">STATUS</th>
                  <th className="py-2 px-2.5 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRadar.slice(0, 10).map((item) => {
                  const isUp = item.change24h >= 0;
                  const isHighConviction = item.setupStatus === 'HIGH CONVICTION';
                  return (
                    <tr
                      key={item.symbol}
                      className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                      onClick={() => onSelectAsset(item.symbol)}
                    >
                      <td className="py-2.5 px-2.5">
                        <div className="font-bold text-white flex items-center gap-1">
                          <span>{item.symbol}</span>
                          <span className="text-[10px] text-slate-500">({item.category.slice(0, 3)})</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                          {item.name}
                        </div>
                      </td>
                      <td className="py-2.5 px-2.5 text-slate-200 font-mono">
                        ${item.price > 1 ? item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : item.price}
                      </td>
                      <td className="py-2.5 px-2.5 font-mono">
                        <span className={isUp ? 'text-emerald-400' : 'text-rose-400'}>
                          {isUp ? '+' : ''}{item.change24h}%
                        </span>
                      </td>
                      <td className="py-2.5 px-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-cyan-400">{item.opportunityScore}</span>
                          <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-cyan-400 rounded-full"
                              style={{ width: `${item.opportunityScore}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-2.5">
                        <span
                          className={`text-[10px] font-bold ${
                            item.technicalBias === 'BULLISH'
                              ? 'text-emerald-400'
                              : item.technicalBias === 'BEARISH'
                              ? 'text-rose-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {item.technicalBias}
                        </span>
                      </td>
                      <td className="py-2.5 px-2.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                            isHighConviction
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : item.setupStatus === 'WATCH'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {item.setupStatus}
                        </span>
                      </td>
                      <td className="py-2.5 px-2.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectAsset(item.symbol);
                          }}
                          className="px-2 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono cursor-pointer"
                        >
                          VIEW INTEL
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: AI Decision & Activity Stream (5 Cols) */}
        <div className="lg:col-span-5 p-4 rounded-xl bg-[#0e1422] border border-slate-800/80 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h2 className="font-display text-sm font-bold text-white tracking-wide">
                AI ACTIVITY & DECISION STREAM
              </h2>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Live Agent Feed</span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[380px] space-y-2.5 pr-1">
            {activities.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs font-mono">
                No recent activities recorded yet.
              </div>
            ) : (
              activities.map((act, idx) => {
                const isExec = act.type === 'EXECUTE';
                const isPass = act.type === 'RISK_PASS';
                const isReject = act.type === 'RISK_REJECT';
                const isExit = act.type === 'EXIT';
                return (
                  <div
                    key={act.id ? `${act.id}-${idx}` : `act-${idx}`}
                    className={`p-2.5 rounded-lg border text-xs font-mono transition-colors ${
                      isExec
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                        : isPass
                        ? 'bg-cyan-950/30 border-cyan-500/40 text-cyan-300'
                        : isReject
                        ? 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                        : isExit
                        ? 'bg-violet-950/30 border-violet-500/40 text-violet-300'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span className="font-bold flex items-center gap-1">
                        {isExec && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                        {isReject && <ShieldAlert className="w-3 h-3 text-amber-400" />}
                        {isExit && <Clock className="w-3 h-3 text-violet-400" />}
                        {act.title}
                      </span>
                      <span className="text-cyan-400 font-mono font-bold">{formatUTCDateTime(act.timestamp)}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-300">{act.detail}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
