import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Layers,
  Shield,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { TradeJournal } from '../types.js';
import { formatUTCDateTime, formatDuration } from '../utils/timeFormat.js';

interface TradeJournalModalProps {
  tradeId: string | null;
  onClose: () => void;
}

export const TradeJournalModal: React.FC<TradeJournalModalProps> = ({
  tradeId,
  onClose,
}) => {
  const [journal, setJournal] = useState<TradeJournal | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tradeId) return;
    const fetchJournal = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/trades/journal/${tradeId}`);
        if (res.ok) {
          const data = await res.json();
          setJournal(data);
        }
      } catch (err) {
        console.error('Error fetching journal:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchJournal();
  }, [tradeId]);

  if (!tradeId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0e1422] border border-cyan-500/30 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl my-8">
        {/* Modal Header */}
        <div className="p-4 bg-[#090d14] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="font-display text-base font-bold text-white tracking-wide">
                COMPREHENSIVE TRADE JOURNAL
              </h2>
              <p className="text-[11px] font-mono text-slate-400">
                AUDIT LOG: {tradeId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 font-mono text-xs">
            Loading trade audit trail...
          </div>
        ) : !journal ? (
          <div className="p-12 text-center text-slate-500 font-mono text-xs">
            No journal found for trade {tradeId}
          </div>
        ) : (
          <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
            {/* Quick Metrics Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-[#090d14] border border-slate-800 text-xs font-mono">
              <div>
                <span className="text-slate-500 text-[10px]">ASSET & DIRECTION</span>
                <div className="font-bold text-white text-sm mt-0.5">
                  {journal.direction} {journal.asset}
                </div>
              </div>
              <div>
                <span className="text-slate-500 text-[10px]">ENTRY / SL / TP</span>
                <div className="text-slate-200 mt-0.5">
                  ${journal.entry} | ${journal.sl} | ${journal.tp}
                </div>
              </div>
              <div>
                <span className="text-slate-500 text-[10px]">POSITION & LEVERAGE</span>
                <div className="text-slate-200 mt-0.5">
                  {journal.positionSize} units ({journal.leverage}x)
                </div>
              </div>
              <div>
                <span className="text-slate-500 text-[10px]">OUTCOME</span>
                <div
                  className={`font-bold text-sm mt-0.5 ${
                    (journal.resultPnl || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {journal.closedAt
                    ? `${(journal.resultPnl || 0) >= 0 ? '+' : ''}$${journal.resultPnl?.toFixed(2)} (${journal.rMultiple}R)`
                    : 'POSITION OPEN'}
                </div>
              </div>
            </div>

            {/* Canonical Risk & Margin Allocation Banner */}
            <div className="p-3 rounded-xl bg-[#090d14] border border-amber-500/20 space-y-2 text-xs font-mono">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
                <div className="bg-[#0e1624] p-2 rounded border border-amber-500/20">
                  <span className="text-amber-400 text-[9px] font-bold block uppercase">MARGIN USED</span>
                  <div className="font-bold text-amber-300 text-xs mt-0.5">
                    ${(journal.marginUsed || journal.margin || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                  </div>
                </div>
                <div className="bg-[#0e1624] p-2 rounded border border-slate-700">
                  <span className="text-slate-400 text-[9px] font-bold block uppercase">LEVERAGE</span>
                  <div className="font-bold text-amber-300 text-xs mt-0.5">
                    {journal.leverage}x
                  </div>
                </div>
                <div className="bg-[#0e1624] p-2 rounded border border-cyan-500/20">
                  <span className="text-cyan-400 text-[9px] font-bold block uppercase">POSITION NOTIONAL</span>
                  <div className="font-bold text-white text-xs mt-0.5">
                    ${(journal.positionNotional || ((journal.marginUsed || journal.margin || 0) * (journal.leverage || 1))).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                  </div>
                </div>
                <div className="bg-[#0e1624] p-2 rounded border border-slate-700">
                  <span className="text-slate-400 text-[9px] font-bold block uppercase">CAPITAL AT RISK</span>
                  <div className="font-bold text-white text-xs mt-0.5">
                    ${(journal.capitalAtRisk || 0).toFixed(2)}
                  </div>
                </div>
                <div className="bg-[#0e1624] p-2 rounded border border-slate-700 col-span-2 sm:col-span-1">
                  <span className="text-slate-400 text-[9px] font-bold block uppercase">SIGNAL STRENGTH</span>
                  <div className="font-extrabold text-emerald-400 text-xs mt-0.5">
                    {journal.signalStrength || 'STRONG'}
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-800 pt-1.5">
                <span className="text-slate-500 font-bold">RISK ALLOCATION FORMULA:</span>
                <span className="text-slate-300">
                  <strong className="text-amber-300">${(journal.marginUsed || journal.margin || 0).toFixed(2)} USDT</strong> Margin × <strong className="text-cyan-400">{journal.leverage}x</strong> = <strong className="text-emerald-400">${(journal.positionNotional || ((journal.marginUsed || journal.margin || 0) * (journal.leverage || 1))).toFixed(2)} USDT</strong> Notional Position
                </span>
              </div>
            </div>

            {/* Authoritative Timestamp & Holding Audit Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-[#090d14]/80 border border-cyan-500/20 text-xs font-mono">
              <div>
                <span className="text-slate-500 text-[10px]">OPENING TIME (UTC)</span>
                <div className="font-bold text-white mt-0.5">
                  {journal.openedAt && journal.openedAt > 0
                    ? formatUTCDateTime(journal.openedAt)
                    : (journal.openingTime ? formatUTCDateTime(journal.openingTime) : 'TIMESTAMP UNAVAILABLE')}
                </div>
              </div>
              <div>
                <span className="text-slate-500 text-[10px]">CLOSING TIME (UTC)</span>
                <div className="font-bold text-slate-200 mt-0.5">
                  {journal.closedAt && journal.closedAt > 0
                    ? formatUTCDateTime(journal.closedAt)
                    : (journal.closingTime ? formatUTCDateTime(journal.closingTime) : 'ACTIVE / OPEN')}
                </div>
              </div>
              <div>
                <span className="text-slate-500 text-[10px]">EXECUTION DURATION</span>
                <div className="font-bold text-cyan-400 mt-0.5">
                  {journal.durationFormatted || (journal.durationSeconds !== undefined ? formatDuration(journal.durationSeconds) : 'ACTIVE')}
                </div>
              </div>
              <div>
                <span className="text-slate-500 text-[10px]">LIFECYCLE STATUS</span>
                <div className="mt-0.5">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    journal.closedAt ? 'bg-slate-800 text-slate-300' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {journal.closedAt ? 'CLOSED & RECORDED' : 'LIVE IN-FLIGHT'}
                  </span>
                </div>
              </div>
            </div>

            {/* Context Blocks: Macro Catalyst, Technical Setup, Risk Decision */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-cyan-400 font-bold text-[11px]">MACRO CATALYST</span>
                <p className="text-slate-300 mt-1 leading-relaxed text-[11px]">
                  {journal.macroCatalyst}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-amber-400 font-bold text-[11px]">TECHNICAL SETUP</span>
                <p className="text-slate-300 mt-1 leading-relaxed text-[11px]">
                  {journal.technicalSetup}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-emerald-400 font-bold text-[11px]">RISK GATE APPROVAL</span>
                <p className="text-slate-300 mt-1 leading-relaxed text-[11px]">
                  {journal.riskDecision.summary}
                </p>
              </div>
            </div>

            {/* Full 5-Step Lifecycle Timeline */}
            <div>
              <h3 className="font-display text-xs font-bold text-white tracking-wider mb-3">
                EXECUTION & MONITORING LIFECYCLE TIMELINE
              </h3>
              <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800">
                {journal.timeline.map((step, idx) => {
                  const isCompleted = step.status === 'COMPLETED';
                  const isActive = step.status === 'ACTIVE';
                  const isFailed = step.status === 'FAILED';
                  return (
                    <div key={idx} className="relative flex items-start gap-3 pl-8">
                      <div
                        className={`absolute left-2 top-1 w-3.5 h-3.5 rounded-full border-2 bg-[#0e1422] ${
                          isCompleted
                            ? 'border-emerald-400 bg-emerald-400'
                            : isActive
                            ? 'border-cyan-400 animate-pulse'
                            : isFailed
                            ? 'border-rose-400 bg-rose-400'
                            : 'border-slate-600'
                        }`}
                      ></div>
                      <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 w-full text-xs font-mono">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-white">{step.label}</span>
                          <span className="text-[10px] text-cyan-400 font-bold">
                            {step.timestamp && step.timestamp > 0
                              ? formatUTCDateTime(step.timestamp)
                              : (step.timeFormatted ? formatUTCDateTime(step.timeFormatted) : 'TIMESTAMP UNAVAILABLE')}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">{step.detail}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="p-3 bg-[#090d14] border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono transition-colors cursor-pointer"
          >
            CLOSE JOURNAL
          </button>
        </div>
      </div>
    </div>
  );
};
