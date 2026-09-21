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
  Globe,
  Layers,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { AssetSummary, MarketRegime } from '../types.js';

interface CrossAssetConfirmationPanelProps {
  radar: AssetSummary[];
  regime: MarketRegime;
  onSelectAsset?: (symbol: string) => void;
}

const CROSS_ASSETS = [
  { symbol: 'BTC', name: 'Bitcoin', role: 'Crypto Liquidity Proxy', icon: Coins },
  { symbol: 'QQQ', name: 'Nasdaq 100', role: 'Tech & Growth Beta', icon: BarChart3 },
  { symbol: 'XAU', name: 'Gold', role: 'Monetary & Safe Haven', icon: Sparkles },
  { symbol: 'XAG', name: 'Silver', role: 'Industrial Beta Metal', icon: CircleDollarSign },
  { symbol: 'CL', name: 'Crude Oil', role: 'Energy & Inflation Shock', icon: Droplets },
];

export const CrossAssetConfirmationPanel: React.FC<CrossAssetConfirmationPanelProps> = ({
  radar,
  regime,
  onSelectAsset,
}) => {
  const radarMap = new Map<string, AssetSummary>(radar.map((r) => [r.symbol, r]));

  // Calculate regime state
  const btcItem = radarMap.get('BTC' as any);
  const qqqItem = radarMap.get('QQQ' as any);
  const goldItem = radarMap.get('XAU' as any);

  const btcUp = (btcItem?.change24h || 0) >= 0;
  const qqqUp = (qqqItem?.change24h || 0) >= 0;
  const goldUp = (goldItem?.change24h || 0) >= 0;

  const isConfirmedRiskOn = btcUp && qqqUp;
  const isConfirmedRiskOff = !btcUp && !qqqUp && goldUp;
  const crossState = isConfirmedRiskOn
    ? 'CONFIRMED: RISK-ON'
    : isConfirmedRiskOff
    ? 'CONFIRMED: RISK-OFF'
    : 'MIXED / TRANSITION';

  return (
    <div className="bg-[#0b0f17] border border-[#161f2e] rounded-xl p-4 font-mono text-xs space-y-3 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-white text-xs tracking-wider">
            CROSS-ASSET CONFIRMATION DESK
          </span>
        </div>
        <div
          className={`px-2 py-0.5 rounded font-bold text-[10px] border ${
            isConfirmedRiskOn
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : isConfirmedRiskOff
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }`}
        >
          {crossState}
        </div>
      </div>

      {/* Asset Benchmark Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
        {CROSS_ASSETS.map((asset) => {
          const item = radarMap.get(asset.symbol as any);
          const Icon = asset.icon;
          const price = item?.price;
          const change = item?.change24h;
          const isUp = (change || 0) >= 0;

          return (
            <div
              key={asset.symbol}
              onClick={() => onSelectAsset && onSelectAsset(asset.symbol)}
              className="p-2.5 rounded-lg bg-[#080c12] border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer flex flex-col justify-between space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                    <Icon className="w-2.5 h-2.5" />
                  </div>
                  <span className="font-bold text-white text-xs">{asset.symbol}</span>
                </div>
                <span className="text-[9px] text-slate-500 font-mono">{item?.category || 'BENCHMARK'}</span>
              </div>

              <div>
                <span className="font-bold font-mono text-slate-100 text-xs block">
                  {price && price > 0
                    ? `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : 'DATA UNAVAILABLE'}
                </span>
                <span
                  className={`flex items-center text-[10px] font-mono font-bold ${
                    isUp ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {isUp ? '+' : ''}
                  {change ? change.toFixed(2) : '0.00'}%
                </span>
              </div>

              <span className="text-[9px] text-slate-400 truncate">{asset.role}</span>
            </div>
          );
        })}
      </div>

      {/* Transmission Flow Note */}
      <div className="p-2.5 rounded-lg bg-[#080c12] border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span>
          GLOBAL MACRO REGIME: <strong className="text-cyan-400">{regime}</strong>
        </span>
        <span className="text-[10px] text-slate-500">
          Source: Bitget MCP Live Benchmark Index
        </span>
      </div>
    </div>
  );
};
