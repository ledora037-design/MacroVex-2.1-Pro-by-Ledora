import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShieldCheck,
  Layers,
  PieChart,
} from 'lucide-react';
import { PortfolioState } from '../types.js';

interface PortfolioStatsProps {
  portfolio: PortfolioState;
  onSelectPortfolio?: () => void;
  onSelectRisk?: () => void;
}

export const PortfolioStats: React.FC<PortfolioStatsProps> = ({
  portfolio,
  onSelectPortfolio,
  onSelectRisk,
}) => {
  const returnTotal = portfolio.initialCapital > 0
    ? ((portfolio.equity - portfolio.initialCapital) / portfolio.initialCapital) * 100
    : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 p-2 bg-[#080c12] border-t border-b border-slate-800 font-mono select-none">
      {/* 1. Total Portfolio Equity */}
      <div
        onClick={onSelectPortfolio}
        className={`p-2 bg-[#0b0f17] border border-slate-800 flex flex-col justify-between transition-colors ${
          onSelectPortfolio ? 'hover:border-cyan-500/50 cursor-pointer' : ''
        }`}
        title={onSelectPortfolio ? 'Click to view Portfolio details' : undefined}
      >
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          <span>PORTFOLIO EQUITY</span>
          <DollarSign className="w-3 h-3 text-cyan-400" />
        </div>
        <div className="my-0.5">
          <span className="text-base sm:text-lg font-bold text-white">
            ${portfolio.equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="text-[10px] flex items-center justify-between text-slate-400">
          <span>Base $100k</span>
          <span className={`font-bold ${returnTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {returnTotal >= 0 ? '+' : ''}{returnTotal.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* 2. Realized PnL */}
      <div
        onClick={onSelectPortfolio}
        className={`p-2 bg-[#0b0f17] border border-slate-800 flex flex-col justify-between transition-colors ${
          onSelectPortfolio ? 'hover:border-cyan-500/50 cursor-pointer' : ''
        }`}
        title={onSelectPortfolio ? 'Click to view Trade Ledger' : undefined}
      >
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          <span>REALIZED P&amp;L</span>
          {portfolio.realizedPnl >= 0 ? (
            <TrendingUp className="w-3 h-3 text-emerald-400" />
          ) : (
            <TrendingDown className="w-3 h-3 text-rose-400" />
          )}
        </div>
        <div className="my-0.5">
          <span
            className={`text-base sm:text-lg font-bold ${
              portfolio.realizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {portfolio.realizedPnl >= 0 ? '+' : ''}${portfolio.realizedPnl.toFixed(2)}
          </span>
        </div>
        <div className="text-[10px] flex items-center justify-between text-slate-400">
          <span>Settled</span>
          <span className="text-slate-400 font-bold">CLOSED</span>
        </div>
      </div>

      {/* 3. Unrealized PnL */}
      <div className="p-2 bg-[#0b0f17] border border-slate-800 flex flex-col justify-between">
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          <span>UNREALIZED P&amp;L</span>
          <Layers className="w-3 h-3 text-cyan-400" />
        </div>
        <div className="my-0.5">
          <span
            className={`text-base sm:text-lg font-bold ${
              portfolio.unrealizedPnl > 0
                ? 'text-emerald-400'
                : portfolio.unrealizedPnl < 0
                ? 'text-rose-400'
                : 'text-slate-300'
            }`}
          >
            {portfolio.unrealizedPnl >= 0 ? '+' : ''}${portfolio.unrealizedPnl.toFixed(2)}
          </span>
        </div>
        <div className="text-[10px] flex items-center justify-between text-slate-400">
          <span>Mark-to-Market</span>
          <span className="text-cyan-400 font-bold">LIVE</span>
        </div>
      </div>

      {/* 4. Daily PnL */}
      <div className="p-2 bg-[#0b0f17] border border-slate-800 flex flex-col justify-between">
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          <span>DAILY P&amp;L</span>
          <span className="text-[9px] text-slate-400">00:00 UTC</span>
        </div>
        <div className="my-0.5">
          <span
            className={`text-base sm:text-lg font-bold ${
              portfolio.dailyPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {portfolio.dailyPnl >= 0 ? '+' : ''}${portfolio.dailyPnl.toFixed(2)}
          </span>
        </div>
        <div className="text-[10px] flex items-center justify-between text-slate-400">
          <span>Daily Cap</span>
          <span className="text-amber-400 font-bold">4.0% MAX</span>
        </div>
      </div>

      {/* 5. Drawdown */}
      <div
        onClick={onSelectRisk}
        className={`p-2 bg-[#0b0f17] border border-slate-800 flex flex-col justify-between transition-colors ${
          onSelectRisk ? 'hover:border-amber-500/50 cursor-pointer' : ''
        }`}
        title={onSelectRisk ? 'Click to inspect Risk Safeguards' : undefined}
      >
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          <span>DRAWDOWN</span>
          <ShieldCheck className="w-3 h-3 text-amber-400" />
        </div>
        <div className="my-0.5">
          <span className="text-base sm:text-lg font-bold text-amber-400">
            -{portfolio.currentDrawdownPercent.toFixed(2)}%
          </span>
        </div>
        <div className="text-[10px] flex items-center justify-between text-slate-400">
          <span>Peak DD</span>
          <span className="text-slate-300 font-bold">-{portfolio.maxDrawdownPercent.toFixed(2)}% (Max 10%)</span>
        </div>
      </div>

      {/* 6. Margin & Exposure */}
      <div className="p-2 bg-[#0b0f17] border border-slate-800 flex flex-col justify-between">
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          <span>AVAIL MARGIN</span>
          <PieChart className="w-3 h-3 text-cyan-400" />
        </div>
        <div className="my-0.5">
          <span className="text-base sm:text-lg font-bold text-white">
            ${portfolio.availableMargin.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="text-[10px] flex items-center justify-between text-slate-400">
          <span>Used Margin</span>
          <span className="text-slate-300 font-bold">${portfolio.usedMargin.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
        </div>
      </div>

      {/* 7. Open Risk & Positions */}
      <div
        onClick={onSelectRisk}
        className={`p-2 bg-[#0b0f17] border border-slate-800 flex flex-col justify-between col-span-2 sm:col-span-4 lg:col-span-1 transition-colors ${
          onSelectRisk ? 'hover:border-cyan-500/50 cursor-pointer' : ''
        }`}
        title={onSelectRisk ? 'Click to inspect Risk Engine' : undefined}
      >
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          <span>RISK / SLOTS</span>
          <span className="px-1.5 py-0.2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold text-[10px]">
            {portfolio.openPositionsCount} / 5
          </span>
        </div>
        <div className="my-0.5 flex items-baseline gap-1">
          <span className="text-base sm:text-lg font-bold text-white">
            ${portfolio.openRiskAmount.toFixed(0)}
          </span>
          <span className="text-[11px] text-slate-400 font-bold">
            ({portfolio.openRiskPercent.toFixed(1)}%)
          </span>
        </div>
        <div className="text-[10px] flex items-center justify-between text-slate-400">
          <span>Risk Cap</span>
          <span className="text-slate-300 font-bold">2.0% / Trade</span>
        </div>
      </div>
    </div>
  );
};
