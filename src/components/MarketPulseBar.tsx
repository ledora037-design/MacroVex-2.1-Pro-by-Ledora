import React from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CircleDollarSign,
  Coins,
  Droplets,
  Flame,
  Radio,
  Server,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { AssetSummary } from '../types.js';

interface MarketPulseBarProps {
  radar: AssetSummary[];
  mcpStatus?: string;
  onOpenMcpModal: () => void;
  onSelectAsset?: (symbol: string) => void;
}

const BENCHMARKS = [
  { id: 'BTC', name: 'BTC / BITCOIN', icon: Coins, category: 'CRYPTO' },
  { id: 'QQQ', name: 'NASDAQ / QQQ', icon: BarChart3, category: 'EQUITIES' },
  { id: 'XAU', name: 'GOLD (XAU)', icon: Sparkles, category: 'COMMODITIES' },
  { id: 'CL', name: 'CRUDE OIL (CL)', icon: Droplets, category: 'COMMODITIES' },
  { id: 'XAG', name: 'SILVER (XAG)', icon: CircleDollarSign, category: 'COMMODITIES' },
];

export const MarketPulseBar: React.FC<MarketPulseBarProps> = ({
  radar,
  mcpStatus = 'NOT VERIFIED',
  onOpenMcpModal,
  onSelectAsset,
}) => {
  const radarMap = new Map<string, AssetSummary>(radar.map((r) => [r.symbol, r]));
  const isLive = mcpStatus === 'LIVE';
  const isReconnecting = mcpStatus === 'RECONNECTING';
  const isStale = mcpStatus === 'STALE';

  return (
    <div className="w-full bg-[#080c12] border-b border-slate-800 px-3 py-1 flex flex-wrap items-center justify-between gap-1.5 text-xs font-mono select-none">
      {/* Left: Benchmarks in compact bold rectangular boxes */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        <div className="px-2 py-1 bg-[#0b0f17] border border-slate-800 text-[10px] uppercase font-bold text-cyan-400 tracking-wider flex items-center gap-1.5 shrink-0">
          <Activity className="w-3 h-3 text-cyan-400" />
          <span>MARKET PULSE</span>
        </div>

        {BENCHMARKS.map((b) => {
          const item = radarMap.get(b.id as any);
          const price = item?.price;
          const change = item?.change24h;
          const isUp = change !== undefined && change >= 0;

          return (
            <button
              key={b.id}
              onClick={() => onSelectAsset && onSelectAsset(b.id)}
              className="flex items-center gap-2 px-2.5 py-1 bg-[#0b0f17] border border-slate-800 hover:border-cyan-500/50 transition-colors cursor-pointer shrink-0"
              title={`View ${b.name} (${b.category}) chart and analysis`}
            >
              <span className="font-extrabold text-white text-xs">{b.id}</span>
              {price && price > 0 ? (
                <>
                  <span className="text-white font-extrabold text-xs">
                    ${price < 100 ? price.toFixed(2) : price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span
                    className={`font-bold text-[11px] ${
                      isUp ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isUp ? '+' : ''}{change?.toFixed(2)}%
                  </span>
                </>
              ) : (
                <span className="text-[10px] text-slate-500 font-bold">UNAVAILABLE</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Right: Authoritative Bitget MCP Live Trigger Badge */}
      <button
        onClick={onOpenMcpModal}
        id="btn-bitget-mcp-status"
        className={`flex items-center gap-2 px-2.5 py-1 border font-mono text-xs transition-colors cursor-pointer shrink-0 ${
          isLive
            ? 'bg-[#0b0f17] border-emerald-500/40 text-emerald-300 hover:border-emerald-400'
            : isReconnecting
            ? 'bg-[#0b0f17] border-amber-500/40 text-amber-300 hover:border-amber-400'
            : isStale
            ? 'bg-[#0b0f17] border-orange-500/40 text-orange-300 hover:border-orange-400'
            : 'bg-[#0b0f17] border-rose-500/40 text-rose-300 hover:border-rose-400'
        }`}
        title="View Bitget Model Context Protocol (MCP) Connection Status"
      >
        <span
          className={`w-2 h-2 rounded-full ${
            isLive
              ? 'bg-emerald-400 animate-pulse'
              : isReconnecting
              ? 'bg-amber-400 animate-ping'
              : isStale
              ? 'bg-orange-400'
              : 'bg-rose-400'
          }`}
        />
        <span className="text-[11px] font-bold tracking-wide">
          BITGET MCP {mcpStatus.toUpperCase()}
        </span>
        <span
          className={`text-[10px] font-bold border-l pl-2 ${
            isLive
              ? 'text-emerald-400 border-emerald-500/30'
              : isReconnecting
              ? 'text-amber-400 border-amber-500/30'
              : isStale
              ? 'text-orange-400 border-orange-500/30'
              : 'text-rose-400 border-rose-500/30'
          }`}
        >
          {isLive ? 'LIVE' : 'VERIFYING'}
        </span>
      </button>
    </div>
  );
};
