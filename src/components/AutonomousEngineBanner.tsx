import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Play,
  Pause,
  RefreshCw,
  Server,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Zap,
} from 'lucide-react';
import { AutonomousEngineStatus } from '../types.js';
import { formatUTCDateTime } from '../utils/timeFormat.js';

interface AutonomousEngineBannerProps {
  status: AutonomousEngineStatus | null;
  onToggleAutonomous: () => void;
  onRefreshScan: () => Promise<void>;
  onOpenMcpModal?: () => void;
  isTriggering?: boolean;
}

export const AutonomousEngineBanner: React.FC<AutonomousEngineBannerProps> = ({
  status,
  onToggleAutonomous,
  onRefreshScan,
  onOpenMcpModal,
  isTriggering = false,
}) => {
  const [countdownStr, setCountdownStr] = useState<string>('--:--');
  const [isManualScanning, setIsManualScanning] = useState(false);

  // Client-side countdown display purely for visual user feedback.
  // Note: The backend scheduler is the sole authority; this is a display helper.
  useEffect(() => {
    if (!status?.nextScanTimestamp) {
      setCountdownStr('--:--');
      return;
    }

    const updateCountdown = () => {
      const remainingMs = status.nextScanTimestamp - Date.now();
      if (remainingMs <= 0) {
        setCountdownStr('Scan due (Backend executing...)');
        return;
      }
      const totalSec = Math.floor(remainingMs / 1000);
      const minutes = Math.floor(totalSec / 60);
      const seconds = totalSec % 60;
      setCountdownStr(`${minutes}m ${seconds.toString().padStart(2, '0')}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [status?.nextScanTimestamp]);

  const formatUptime = (seconds?: number) => {
    if (!seconds || seconds <= 0) return '0m';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m ${secs}s`;
  };

  const formatTimeAgo = (timestamp?: number) => {
    if (!timestamp) return 'Just started';
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    return formatUTCDateTime(timestamp);
  };

  const handleManualScan = async () => {
    if (isManualScanning || isTriggering) return;
    setIsManualScanning(true);
    try {
      await onRefreshScan();
    } finally {
      setIsManualScanning(false);
    }
  };

  const isRunning = status?.isRunning ?? true;
  const isStale = status?.isStaleOrDisconnected ?? false;

  return (
    <div className="bg-[#080c12] border-b-2 border-slate-800 px-3.5 py-2 select-none">
      <div className="max-w-7xl mx-auto flex flex-col xl:flex-row xl:items-center justify-between gap-2.5">
        {/* Left: Engine Status Title & Priority */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 bg-[#0b0f17] border border-slate-700/80 px-2.5 py-1.5 rounded-none">
            <span className="text-xs font-mono font-extrabold text-white tracking-wider uppercase">
              AUTONOMOUS PAPER ENGINE
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono font-bold border ${
                isRunning
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/40'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              {isRunning ? 'RUNNING' : 'PAUSED'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-slate-300 bg-[#0b0f17] px-2.5 py-1.5 border border-slate-700/80">
            <Server className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Priority:</span>
            <span className="text-cyan-300 font-bold">Stocks &gt; Crypto &gt; Commodities</span>
          </div>

          {isStale && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/20 text-rose-300 text-[10px] font-mono font-bold border border-rose-500/50 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>BITGET DATA STALE / PAUSED ENTRIES</span>
            </div>
          )}
        </div>

        {/* Middle & Right: Key Engine Metrics Grid */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-xs font-mono">
          {/* 1. Last Scan */}
          <div className="px-2.5 py-1 bg-[#0b0f17] border border-slate-800 flex flex-col justify-center min-w-[76px]">
            <span className="text-[9px] font-bold text-slate-500 tracking-wider">LAST SCAN</span>
            <span className="text-slate-200 font-bold text-xs">
              {formatTimeAgo(status?.lastScanTimestamp)}
            </span>
          </div>

          {/* 2. Next Scan (Backend-Authoritative Countdown) */}
          <div className="px-2.5 py-1 bg-[#0b0f17] border border-slate-800 flex flex-col justify-center min-w-[86px]">
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-bold text-cyan-400 tracking-wider">NEXT SCAN</span>
              <Clock className="w-2.5 h-2.5 text-cyan-400" />
            </div>
            <span className="text-cyan-300 font-bold tracking-tight text-xs">{countdownStr}</span>
          </div>

          {/* 3. Open Positions */}
          <div className="px-2.5 py-1 bg-[#0b0f17] border border-slate-800 flex flex-col justify-center min-w-[80px]">
            <span className="text-[9px] font-bold text-slate-500 tracking-wider">OPEN POSITIONS</span>
            <div className="flex items-center gap-1">
              <span className="text-white font-extrabold text-xs">{status?.openPositionsCount ?? 0}</span>
              <span className="text-slate-400 text-[10px] font-bold">/ 5 MAX</span>
            </div>
          </div>

          {/* 4. Realized P&L */}
          <div className="px-2.5 py-1 bg-[#0b0f17] border border-slate-800 flex flex-col justify-center min-w-[80px]">
            <span className="text-[9px] font-bold text-slate-500 tracking-wider">REALIZED P&amp;L</span>
            <span
              className={`font-bold text-xs ${
                (status?.realizedPnl ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {(status?.realizedPnl ?? 0) >= 0 ? '+' : ''}${(status?.realizedPnl ?? 0).toFixed(2)}
            </span>
          </div>

          {/* 5. Unrealized P&L */}
          <div className="px-2.5 py-1 bg-[#0b0f17] border border-slate-800 flex flex-col justify-center min-w-[80px]">
            <span className="text-[9px] font-bold text-slate-500 tracking-wider">UNREALIZED P&amp;L</span>
            <span
              className={`font-bold text-xs ${
                (status?.unrealizedPnl ?? 0) > 0
                  ? 'text-emerald-400'
                  : (status?.unrealizedPnl ?? 0) < 0
                  ? 'text-rose-400'
                  : 'text-slate-300'
              }`}
            >
              {(status?.unrealizedPnl ?? 0) >= 0 ? '+' : ''}${(status?.unrealizedPnl ?? 0).toFixed(2)}
            </span>
          </div>

          {/* 6. Engine Uptime */}
          <div className="hidden md:flex px-2.5 py-1 bg-[#0b0f17] border border-slate-800 flex-col justify-center min-w-[70px]">
            <span className="text-[9px] font-bold text-slate-500 tracking-wider">UPTIME</span>
            <span className="text-slate-300 font-bold text-xs">
              {formatUptime(status?.engineUptimeSeconds)}
            </span>
          </div>

          {/* 7. Bitget MCP Status */}
          <div className="px-2.5 py-1 bg-[#0b0f17] border border-slate-800 flex flex-col justify-center min-w-[90px]">
            <span className="text-[9px] font-bold text-slate-500 tracking-wider">BITGET MCP</span>
            <button
              onClick={onOpenMcpModal}
              id="btn-banner-mcp-status"
              className="flex items-center gap-1.5 hover:text-cyan-300 text-left transition-colors cursor-pointer"
              title="Click to view Bitget Agent Hub MCP parameters"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  status?.mcpStatus === 'LIVE'
                    ? 'bg-emerald-400 animate-pulse'
                    : status?.mcpStatus === 'RECONNECTING'
                    ? 'bg-amber-400 animate-ping'
                    : status?.mcpStatus === 'STALE' || isStale
                    ? 'bg-orange-400'
                    : 'bg-rose-400'
                }`}
              />
              <span className={`font-extrabold text-xs ${
                status?.mcpStatus === 'LIVE'
                  ? 'text-emerald-400'
                  : status?.mcpStatus === 'RECONNECTING'
                  ? 'text-amber-300'
                  : status?.mcpStatus === 'STALE' || isStale
                  ? 'text-orange-300'
                  : 'text-rose-300'
              }`}>
                {status?.mcpStatus || 'NOT VERIFIED'}
              </span>
            </button>
          </div>

          {/* Primary Action: RUN CYCLE NOW / SCAN NOW */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-700/80">
            <button
              onClick={handleManualScan}
              disabled={isManualScanning || isTriggering}
              id="btn-scan-now"
              className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-black text-xs font-mono font-extrabold flex items-center gap-1.5 transition-all shadow-md disabled:opacity-50 cursor-pointer"
              title="Execute immediate autonomous market scan cycle across all 24 instruments"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isManualScanning || isTriggering ? 'animate-spin' : ''}`}
              />
              <span>SCAN NOW</span>
            </button>

            <button
              onClick={onToggleAutonomous}
              id="btn-banner-toggle-engine"
              className={`p-1.5 text-xs border transition-colors cursor-pointer ${
                isRunning
                  ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
                  : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30'
              }`}
              title={isRunning ? 'Pause Autonomous Engine' : 'Resume Autonomous Engine'}
            >
              {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
