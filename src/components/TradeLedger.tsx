import React, { useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Filter,
  Shield,
  TrendingDown,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { ClosedTrade, Position } from '../types.js';
import { formatUTCDateTime, formatDuration } from '../utils/timeFormat.js';

interface TradeLedgerProps {
  closedTrades: ClosedTrade[];
  openPositions: Position[];
  onOpenJournal: (tradeId: string) => void;
}

export const TradeLedger: React.FC<TradeLedgerProps> = ({
  closedTrades,
  openPositions,
  onOpenJournal,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'WINNERS' | 'LOSERS' | 'OPEN'>('ALL');

  const totalClosed = closedTrades.length;
  const winners = closedTrades.filter((t) => t.pnl > 0);
  const losers = closedTrades.filter((t) => t.pnl <= 0);

  const winRate = totalClosed > 0 ? ((winners.length / totalClosed) * 100).toFixed(1) : '0';
  const totalNetPnl = closedTrades.reduce((acc, t) => acc + t.pnl, 0);
  const avgR = totalClosed > 0
    ? (closedTrades.reduce((acc, t) => acc + t.rMultiple, 0) / totalClosed).toFixed(2)
    : '0';

  const displayedTrades = closedTrades.filter((t) => {
    if (filter === 'WINNERS') return t.pnl > 0;
    if (filter === 'LOSERS') return t.pnl <= 0;
    return true;
  });

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* 1. Header Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-[#0e1422] border border-slate-800/80">
        <div>
          <div className="text-[11px] font-mono text-slate-400">TOTAL CLOSED TRADES</div>
          <div className="text-xl font-mono font-bold text-white mt-1">{totalClosed}</div>
          <div className="text-[10px] font-mono text-slate-500">
            {winners.length} Wins • {losers.length} Losses
          </div>
        </div>

        <div>
          <div className="text-[11px] font-mono text-slate-400">WIN RATE</div>
          <div className="text-xl font-mono font-bold text-cyan-400 mt-1">{winRate}%</div>
          <div className="text-[10px] font-mono text-slate-500">Target: 55.0% - 62.0%</div>
        </div>

        <div>
          <div className="text-[11px] font-mono text-slate-400">NET REALIZED P&L</div>
          <div
            className={`text-xl font-mono font-bold mt-1 ${
              totalNetPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {totalNetPnl >= 0 ? '+' : ''}${totalNetPnl.toFixed(2)}
          </div>
          <div className="text-[10px] font-mono text-slate-500">Includes Bitget MCP fees & slippage</div>
        </div>

        <div>
          <div className="text-[11px] font-mono text-slate-400">AVERAGE R MULTIPLE</div>
          <div className="text-xl font-mono font-bold text-amber-400 mt-1">{avgR}R</div>
          <div className="text-[10px] font-mono text-slate-500">Baseline R:R 2.1:1</div>
        </div>
      </div>

      {/* 2. Ledger Controls & Table */}
      <div className="p-4 rounded-xl bg-[#0e1422] border border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <h2 className="font-display text-sm font-bold text-white tracking-wide">
              EXECUTION LEDGER & TRADE JOURNALS
            </h2>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-xs">
            {(['ALL', 'WINNERS', 'LOSERS'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded cursor-pointer transition-all ${
                  filter === f
                    ? 'bg-cyan-500 text-black font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {displayedTrades.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-slate-800 rounded-lg">
            <Shield className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-mono text-slate-400">NO CLOSED TRADES MATCHING FILTER</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Trades will populate automatically as autonomous exits trigger or manual closes occur.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-[#090d14] text-slate-400 text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">TRADE ID / ASSET</th>
                  <th className="py-2.5 px-3">SIDE</th>
                  <th className="py-2.5 px-3">ENTRY</th>
                  <th className="py-2.5 px-3">EXIT</th>
                  <th className="py-2.5 px-3">TIMESTAMPS (24H)</th>
                  <th className="py-2.5 px-3">DURATION</th>
                  <th className="py-2.5 px-3">NET P&L</th>
                  <th className="py-2.5 px-3">R MULTIPLE</th>
                  <th className="py-2.5 px-3">EXIT REASON</th>
                  <th className="py-2.5 px-3">MACRO CATALYST</th>
                  <th className="py-2.5 px-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {displayedTrades.map((t) => {
                  const isLong = t.direction === 'LONG';
                  const isWin = t.pnl > 0;
                  const openTime =
                    t.openedAt && t.openedAt > 0
                      ? formatUTCDateTime(t.openedAt)
                      : (t.openingTime ? formatUTCDateTime(t.openingTime) : 'TIMESTAMP UNAVAILABLE');
                  const closeTime =
                    t.closedAt && t.closedAt > 0
                      ? formatUTCDateTime(t.closedAt)
                      : (t.closingTime ? formatUTCDateTime(t.closingTime) : 'TIMESTAMP UNAVAILABLE');
                  const durationStr =
                    t.durationFormatted ||
                    (t.durationSeconds !== undefined
                      ? formatDuration(t.durationSeconds)
                      : '00:00:00');

                  return (
                    <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{t.asset}</span>
                          <span className="text-[10px] text-slate-500">[{t.leverage}x]</span>
                        </div>
                        <div className="text-[10px] text-slate-400">{t.tradeId}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            isLong
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {t.direction}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300 font-mono">${t.entry.toFixed(2)}</td>
                      <td className="py-3 px-3 text-slate-200 font-mono font-bold">
                        ${t.exit.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 font-mono text-[10px]">
                        <div className="text-slate-300">
                          <span className="text-slate-500">IN: </span>
                          {openTime}
                        </div>
                        <div className="text-slate-400">
                          <span className="text-slate-500">OUT: </span>
                          {closeTime}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-cyan-400 font-mono font-bold">
                        {durationStr}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold">
                        <div className={isWin ? 'text-emerald-400' : 'text-rose-400'}>
                          {isWin ? '+' : ''}${t.pnl.toFixed(2)}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold">
                        <span className={t.rMultiple >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {t.rMultiple >= 0 ? '+' : ''}{t.rMultiple}R
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.exitReason === 'TAKE_PROFIT'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : t.exitReason === 'STOP_LOSS'
                              ? 'bg-rose-500/10 text-rose-400'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {t.exitReason}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-[11px] truncate max-w-[180px]">
                        {t.catalyst}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => onOpenJournal(t.tradeId)}
                          className="px-2.5 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-mono transition-colors cursor-pointer"
                        >
                          VIEW JOURNAL
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
    </div>
  );
};
