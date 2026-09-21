import React, { useState, useEffect } from 'react';
import {
  Search,
  Zap,
  TrendingUp,
  TrendingDown,
  Shield,
  RotateCw,
  Clock,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  BarChart3,
  ExternalLink,
  Target,
  Sparkles,
} from 'lucide-react';
import { FullMarketScannerState, MarketOpportunity } from '../types.js';

interface OpportunityScannerDeckProps {
  onSelectAsset?: (asset: string) => void;
  onTradeExecuted?: () => void;
}

export const OpportunityScannerDeck: React.FC<OpportunityScannerDeckProps> = ({
  onSelectAsset,
  onTradeExecuted,
}) => {
  const [scannerData, setScannerData] = useState<FullMarketScannerState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isScanningNow, setIsScanningNow] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'CRYPTO' | 'MACRO'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'APPROVED' | 'HIGH_CONVICTION'>('ALL');
  const [executingAsset, setExecutingAsset] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchScannerData = async () => {
    try {
      const res = await fetch('/api/scanner/opportunities');
      if (res.ok) {
        const data = await res.json();
        setScannerData(data);
      }
    } catch (err) {
      console.error('Error fetching scanner data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScannerData();
    const interval = setInterval(fetchScannerData, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleScanNow = async () => {
    setIsScanningNow(true);
    try {
      const res = await fetch('/api/scanner/scan-now', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setScannerData(data);
      }
    } catch (err) {
      console.error('Error triggering scan now:', err);
    } finally {
      setIsScanningNow(false);
    }
  };

  const handleExecuteScalp = async (opp: MarketOpportunity) => {
    setExecutingAsset(opp.asset);
    setNotification(null);
    try {
      const res = await fetch('/api/trades/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset: opp.asset,
          direction: opp.direction,
          action: opp.action === 'BUY' ? 'BUY' : 'SELL',
          entry: opp.entry,
          stop_loss: opp.sl,
          take_profit: opp.tp,
          leverage: opp.category === 'CRYPTO' ? 8 : 5,
          risk_percent: 1.5,
          confidence: opp.confidence,
          isManual: false,
        }),
      });

      const data = await res.json();
      if (res.ok && data.approved) {
        setNotification({
          message: `Position opened: ${opp.direction} ${opp.asset} @ $${opp.entry} (Recycled Slot Active)`,
          type: 'success',
        });
        await fetchScannerData();
        if (onTradeExecuted) onTradeExecuted();
      } else {
        setNotification({
          message: `Risk Engine rejected: ${data.reason || 'Safety limit reached'}`,
          type: 'error',
        });
      }
    } catch (err: any) {
      setNotification({
        message: `Execution failed: ${err.message}`,
        type: 'error',
      });
    } finally {
      setExecutingAsset(null);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const opportunities = scannerData?.rankedOpportunities || [];

  const filteredOpportunities = opportunities.filter((opp) => {
    if (categoryFilter === 'CRYPTO' && opp.category !== 'CRYPTO') return false;
    if (categoryFilter === 'MACRO' && opp.category === 'CRYPTO') return false;
    if (statusFilter === 'APPROVED' && opp.riskGateStatus !== 'APPROVED') return false;
    if (statusFilter === 'HIGH_CONVICTION' && opp.rankScore < 80) return false;
    return true;
  });

  const availableSlots = scannerData?.availableSlots ?? 5;
  const activeCount = scannerData?.activePositionsCount ?? 0;

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* 1. Header Banner: Unlimited Scalping & Dynamic Scanner Mandate */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-[#0b101d] via-[#0f172a] to-[#0d1322] border border-cyan-500/25 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
              <h1 className="font-display text-base sm:text-lg font-bold tracking-wider text-cyan-400 flex items-center gap-2">
                <Search className="w-5 h-5 text-cyan-400" />
                DYNAMIC FULL-MARKET OPPORTUNITY SCANNER
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-bold">
                FREQUENT SCALPING MODE
              </span>
            </div>
            <p className="text-xs text-slate-300 font-mono mt-1">
              Continuously scans the entire supported crypto and macro universe. Filters setups by momentum, volume, SMC structures, and multi-timeframe confirmation.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleScanNow}
              disabled={isScanningNow}
              id="btn-scan-universe-now"
              className="px-4 py-2 rounded-lg bg-cyan-500 text-black font-mono font-bold text-xs hover:bg-cyan-400 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-cyan-500/20 disabled:opacity-50"
            >
              <RotateCw className={`w-4 h-4 ${isScanningNow ? 'animate-spin' : ''}`} />
              {isScanningNow ? 'SCANNING UNIVERSE...' : 'SCAN FULL MARKET NOW'}
            </button>
          </div>
        </div>

        {/* Operational Architecture Badges */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          <div className="p-2 rounded bg-black/40 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">HARD POSITION LIMIT:</span>
            <span className="text-cyan-400 font-bold">MAX 5 OPEN</span>
          </div>
          <div className="p-2 rounded bg-black/40 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">DAILY TRADE CAP:</span>
            <span className="text-emerald-400 font-bold">UNLIMITED (0 CAP)</span>
          </div>
          <div className="p-2 rounded bg-black/40 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">POSITION RECYCLING:</span>
            <span className="text-cyan-300 font-bold">ACTIVE (INSTANT)</span>
          </div>
          <div className="p-2 rounded bg-black/40 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">ANTI-OVERTRADING:</span>
            <span className="text-amber-400 font-bold">ANTI-REVENGE ON</span>
          </div>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`p-3 rounded-lg text-xs font-mono flex items-center justify-between border ${
            notification.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* 2. Concurrency & Slot Monitor HUD */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
        <div className="p-3 rounded-lg bg-[#0e1422] border border-slate-800">
          <div className="text-[10px] font-mono text-slate-400">UNIVERSE SCANNED</div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {scannerData?.assetsScannedCount || 36}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">22 Crypto + 14 Macro</div>
        </div>

        <div className="p-3 rounded-lg bg-[#0e1422] border border-slate-800">
          <div className="text-[10px] font-mono text-slate-400">ACTIVE OPEN POSITIONS</div>
          <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
            {activeCount} <span className="text-xs text-slate-400 font-normal">/ 5 MAX</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Strict Hard Ceiling</div>
        </div>

        <div className="p-3 rounded-lg bg-[#0e1422] border border-slate-800">
          <div className="text-[10px] font-mono text-slate-400">AVAILABLE SLOTS</div>
          <div className={`text-xl font-bold font-mono mt-1 ${availableSlots > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {availableSlots} <span className="text-xs text-slate-400 font-normal">SLOTS FREE</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            {availableSlots > 0 ? 'Ready to allocate' : 'Wait for exit to recycle'}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-[#0e1422] border border-slate-800">
          <div className="text-[10px] font-mono text-slate-400">VALID OPPORTUNITIES</div>
          <div className="text-xl font-bold font-mono text-cyan-300 mt-1">
            {scannerData?.validSignalsCount || 0}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Passed Quality Filter</div>
        </div>

        <div className="p-3 rounded-lg bg-[#0e1422] border border-slate-800">
          <div className="text-[10px] font-mono text-slate-400">RISK ENGINE CLEARED</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {scannerData?.riskApprovedCount || 0}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">All 20 Gates Passed</div>
        </div>
      </div>

      {/* 3. Filter Controls & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-[#0c101a] border border-slate-800">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-slate-400">CATEGORY:</span>
          {(['ALL', 'CRYPTO', 'MACRO'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-all cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}

          <span className="text-xs font-mono text-slate-400 ml-2">FILTER:</span>
          {(['ALL', 'APPROVED', 'HIGH_CONVICTION'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
          <span>RANKING MODEL:</span>
          <span className="text-cyan-400 font-bold">MOMENTUM + SMC + MTF + R:R</span>
        </div>
      </div>

      {/* 4. Ranked Opportunity Table */}
      <div className="rounded-xl bg-[#0e1422] border border-slate-800 overflow-hidden">
        <div className="p-3 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="font-display text-xs font-bold text-slate-200 tracking-wider">
              DYNAMICALLY RANKED OPPORTUNITY QUEUE (STRONGEST FIRST)
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Showing {filteredOpportunities.length} of {opportunities.length} candidates
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <RotateCw className="w-6 h-6 text-cyan-400 animate-spin mx-auto mb-2" />
            <div className="text-xs font-mono text-slate-400">Scanning full market universe...</div>
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <Shield className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-sm font-mono text-slate-300 font-bold">NO QUALIFIED SETUPS MEET FILTER</div>
            <div className="text-xs font-mono text-slate-500 max-w-md mx-auto">
              Frequent scalping does NOT mean forced trades. When no high-quality setup exists, MacroVex 2.1 Pro preserves capital and continues scanning.
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredOpportunities.map((opp, idx) => {
              const isLong = opp.direction === 'LONG';
              const isApproved = opp.riskGateStatus === 'APPROVED';
              const isWaitingSlot = opp.riskGateStatus === 'WAITING_SLOT';
              const isCooldown = opp.riskGateStatus === 'COOLDOWN_PROTECTED';

              return (
                <div
                  key={opp.asset}
                  className="p-3.5 hover:bg-slate-900/40 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-3"
                >
                  {/* Left: Asset, Rank, Direction, Score */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-black/50 border border-slate-800 flex items-center justify-center font-mono text-xs font-bold text-cyan-400">
                      #{idx + 1}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm font-bold text-white tracking-wider">
                          {opp.asset}
                        </span>
                        <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                          {opp.name}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            isLong
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {opp.direction}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
                          {opp.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-xs font-mono text-slate-400 flex-wrap">
                        <span>Price: <strong className="text-slate-200">${opp.price.toLocaleString()}</strong></span>
                        <span className={opp.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {opp.change24h >= 0 ? '+' : ''}{opp.change24h}%
                        </span>
                        <span>•</span>
                        <span>MTF: <strong className={opp.mtfAlignment === 'ALIGNED' ? 'text-cyan-400' : 'text-amber-400'}>{opp.mtfAlignment}</strong></span>
                        <span>•</span>
                        <span>R:R: <strong className="text-cyan-300">{opp.rr}:1</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: SMC Structure & Signals */}
                  <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono">
                    <div className="px-2 py-1 rounded bg-black/40 border border-slate-800 text-slate-300">
                      <span className="text-slate-500">STRUCTURE: </span>
                      <span className="text-cyan-400 font-bold">{opp.marketStructure}</span>
                    </div>

                    {opp.bosChoch !== 'NONE' && (
                      <div className="px-2 py-1 rounded bg-black/40 border border-cyan-500/30 text-cyan-300 font-bold">
                        {opp.bosChoch.replace('_', ' ')}
                      </div>
                    )}

                    {opp.orderBlock !== 'NONE' && (
                      <div className="px-2 py-1 rounded bg-black/40 border border-amber-500/30 text-amber-300">
                        {opp.orderBlock.replace('_', ' ')}
                      </div>
                    )}

                    {opp.fvg !== 'NONE' && (
                      <div className="px-2 py-1 rounded bg-black/40 border border-violet-500/30 text-violet-300">
                        {opp.fvg.replace('_', ' ')}
                      </div>
                    )}

                    {opp.liquiditySweep && (
                      <div className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                        SWEEP CONFIRMED
                      </div>
                    )}
                  </div>

                  {/* Right: Score, Risk Status, & Actions */}
                  <div className="flex items-center gap-3 justify-between lg:justify-end">
                    {/* Quality Score Meter */}
                    <div className="text-right">
                      <div className="text-[10px] font-mono text-slate-400">SCALP SCORE</div>
                      <div className="text-sm font-bold font-mono text-cyan-400">
                        {opp.rankScore}<span className="text-[10px] text-slate-500">/100</span>
                      </div>
                    </div>

                    {/* Risk Engine Status Badge */}
                    <div>
                      {isApproved && (
                        <span className="px-2.5 py-1 rounded text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          READY (20 GATES)
                        </span>
                      )}
                      {isWaitingSlot && (
                        <span className="px-2.5 py-1 rounded text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1" title={opp.rejectionReason}>
                          <Clock className="w-3 h-3" />
                          SLOTS FULL (5/5)
                        </span>
                      )}
                      {isCooldown && (
                        <span className="px-2.5 py-1 rounded text-[11px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1" title={opp.rejectionReason}>
                          <Shield className="w-3 h-3" />
                          ANTI-REVENGE
                        </span>
                      )}
                      {!isApproved && !isWaitingSlot && !isCooldown && (
                        <span className="px-2.5 py-1 rounded text-[11px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700" title={opp.rejectionReason}>
                          REJECTED
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5">
                      {onSelectAsset && (
                        <button
                          onClick={() => onSelectAsset(opp.asset)}
                          className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
                          title="Inspect multi-timeframe chart"
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => handleExecuteScalp(opp)}
                        disabled={executingAsset === opp.asset || (!isApproved && !isWaitingSlot)}
                        className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                          isLong
                            ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                            : 'bg-rose-500 text-white hover:bg-rose-400'
                        }`}
                        title="Execute scalp via 20-Gate Risk Engine"
                      >
                        {executingAsset === opp.asset ? (
                          <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Zap className="w-3.5 h-3.5" />
                        )}
                        SCALP NOW
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Scalping Discipline & Position Recycling Doctrine */}
      <div className="p-4 rounded-xl bg-[#0e1422] border border-slate-800 text-xs font-mono space-y-2">
        <div className="font-bold text-slate-300 font-display tracking-wider flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          MACROVEX 2.1 PRO FREQUENT SCALPING & CONTINUOUS RECYCLING DOCTRINE
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-400 mt-2">
          <div className="p-2.5 rounded bg-black/30 border border-slate-800/80">
            <div className="text-cyan-400 font-bold mb-1">1. ZERO DAILY QUOTA</div>
            <div>
              There is NO daily trade limit. MacroVex 2.1 Pro is authorized to execute as many valid scalps as the strategy generates during the session.
            </div>
          </div>
          <div className="p-2.5 rounded bg-black/30 border border-slate-800/80">
            <div className="text-cyan-400 font-bold mb-1">2. MAX 5 CONCURRENT TRADES</div>
            <div>
              The single hard constraint is exactly 5 simultaneous open positions. When a position hits TP or SL, its slot is recycled immediately for the next ranked opportunity.
            </div>
          </div>
          <div className="p-2.5 rounded bg-black/30 border border-slate-800/80">
            <div className="text-cyan-400 font-bold mb-1">3. ANTI-REVENGE DISCIPLINE</div>
            <div>
              Frequent scalping does NOT mean constant trading. If an asset is stopped out, re-entry is blocked until a genuinely new structural shift confirms. Zero forced trades.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
