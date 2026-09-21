import React from 'react';
import {
  ArrowRight,
  ChevronRight,
  Moon,
  Sun,
  Radio,
  Shield,
  Activity,
  Layers,
} from 'lucide-react';
import { AppTheme } from '../types.js';

interface OpeningCoverProps {
  onEnter: () => void;
  theme: AppTheme;
  onToggleTheme: (theme: AppTheme) => void;
  mcpStatus?: {
    status: string;
    endpoint: string;
    latencyMs: number;
  };
}

export const OpeningCover: React.FC<OpeningCoverProps> = ({
  onEnter,
  theme,
  onToggleTheme,
  mcpStatus,
}) => {
  const isDark = theme === 'dark';

  return (
    <div
      className={`min-h-screen w-full flex flex-col justify-between transition-colors duration-300 relative select-none overflow-hidden ${
        isDark ? 'bg-[#080b11] text-[#f1f5f9]' : 'bg-[#f8fafc] text-[#0f172a]'
      }`}
    >
      {/* Refined Institutional Coordinate & Flow Grid — Subtle & Restrained */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Architectural Subtle Grid */}
        <div
          className={`absolute inset-0 opacity-[0.035] ${
            isDark
              ? 'bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)]'
              : 'bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)]'
          } [background-size:64px_64px]` }
        />

        {/* Subtle Macro Flow Curve (Minimalist Market Wave SVG) */}
        <svg
          className={`absolute bottom-0 left-0 right-0 w-full h-80 opacity-[0.07] ${
            isDark ? 'text-cyan-400' : 'text-cyan-700'
          }`}
          viewBox="0 0 1440 320"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            d="M0,192L60,176C120,160,240,128,360,138.7C480,149,600,203,720,208C840,213,960,171,1080,144C1200,117,1320,107,1380,101.3L1440,96L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
            fill="currentColor"
          />
          <path
            d="M0,192L60,176C120,160,240,128,360,138.7C480,149,600,203,720,208C840,213,960,171,1080,144C1200,117,1320,107,1380,101.3L1440,96"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>

        {/* Soft Radial Ambient Lighting */}
        <div
          className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full blur-[140px] pointer-events-none ${
            isDark ? 'bg-cyan-950/15' : 'bg-cyan-100/40'
          }`}
        />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 px-6 lg:px-12 py-6 flex items-center justify-between max-w-7xl mx-auto w-full">
        {/* Terminal Wordmark */}
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-md flex items-center justify-center font-display font-bold text-xs tracking-wider transition-colors ${
              isDark
                ? 'bg-[#0e1420] border border-cyan-500/30 text-cyan-400 shadow-sm'
                : 'bg-white border border-slate-200 text-cyan-700 shadow-xs'
            }`}
          >
            MV
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`font-display tracking-widest text-sm font-extrabold uppercase ${
                isDark ? 'text-slate-100' : 'text-slate-900'
              }`}
            >
              MACROVEX
            </span>
            <span
              className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                isDark
                  ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                  : 'bg-cyan-50 text-cyan-700 border-cyan-200'
              }`}
            >
              2.1 PRO
            </span>
          </div>
        </div>

        {/* Right Header Controls: Feed Status & Segmented Theme Switcher */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Live Bitget Status Tag */}
          <div
            className={`hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono border transition-colors ${
              isDark
                ? 'border-slate-800 bg-[#0d121c] text-slate-300'
                : 'border-slate-200 bg-white text-slate-700 shadow-xs'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                mcpStatus?.status === 'LIVE'
                  ? 'bg-emerald-500 animate-pulse'
                  : mcpStatus?.status === 'RECONNECTING'
                  ? 'bg-amber-500 animate-ping'
                  : mcpStatus?.status === 'STALE'
                  ? 'bg-orange-500'
                  : 'bg-rose-500'
              }`}
            />
            <span className="font-semibold">BITGET MCP</span>
            <span className="opacity-40">•</span>
            <span
              className={`font-bold ${
                mcpStatus?.status === 'LIVE'
                  ? 'text-emerald-500'
                  : mcpStatus?.status === 'RECONNECTING'
                  ? 'text-amber-500'
                  : mcpStatus?.status === 'STALE'
                  ? 'text-orange-500'
                  : 'text-rose-500'
              }`}
            >
              {mcpStatus?.status === 'LIVE'
                ? `LIVE • ${mcpStatus.latencyMs}ms`
                : mcpStatus?.status || 'NOT VERIFIED'}
            </span>
          </div>

          {/* Theme Switcher Segmented Control */}
          <div
            className={`flex items-center p-1 rounded-lg border transition-colors ${
              isDark
                ? 'border-slate-800 bg-[#0d121c]'
                : 'border-slate-200 bg-white shadow-xs'
            }`}
          >
            <button
              onClick={() => onToggleTheme('dark')}
              id="btn-cover-theme-dark"
              aria-label="Switch to Dark Mode"
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-semibold transition-all cursor-pointer ${
                isDark
                  ? 'bg-slate-800 text-cyan-300 shadow-xs'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>DARK</span>
            </button>
            <button
              onClick={() => onToggleTheme('light')}
              id="btn-cover-theme-light"
              aria-label="Switch to Light Mode"
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-semibold transition-all cursor-pointer ${
                !isDark
                  ? 'bg-slate-100 text-slate-900 shadow-xs font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>LIGHT</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero: Minimal, Confident, Serious Financial Terminal */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-4xl mx-auto w-full text-center">
        {/* Subtle Categorical Eyebrow */}
        <div
          className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono tracking-wider uppercase mb-6 transition-colors border ${
            isDark
              ? 'border-slate-800 bg-[#0d121c] text-cyan-400'
              : 'border-slate-200 bg-white text-cyan-700 shadow-xs'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>CROSS-ASSET TRADING INTELLIGENCE</span>
          <span className="opacity-40">•</span>
          <span className="font-semibold text-emerald-500">MCP ACTIVE</span>
        </div>

        {/* Master Branding Headline */}
        <h1
          className={`text-5xl sm:text-7xl md:text-8xl font-display font-black tracking-tight uppercase leading-none mb-4 transition-colors ${
            isDark
              ? 'text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]'
              : 'text-slate-950'
          }`}
        >
          MACROVEX{' '}
          <span className={isDark ? 'text-cyan-400' : 'text-cyan-700'}>2.1 PRO</span>
        </h1>

        {/* Short, Sharp Professional Subtitle */}
        <h2
          className={`text-lg sm:text-xl md:text-2xl font-mono font-semibold tracking-wide mb-5 transition-colors ${
            isDark ? 'text-slate-200' : 'text-slate-800'
          }`}
        >
          AI-Powered Cross-Asset Trading Desk
        </h2>

        {/* One Strong Short Supporting Line */}
        <p
          className={`max-w-xl text-sm sm:text-base leading-relaxed mb-10 font-normal transition-colors ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}
        >
          Synthesizing global macro flow transmissions, cross-market correlations, and
          deterministic risk management across equities, crypto, and commodities.
        </p>

        {/* Primary Action Button */}
        <div className="flex flex-col items-center gap-4">
          <button
            id="btn-enter-macromind"
            onClick={onEnter}
            className={`group px-9 py-4 rounded-xl font-display text-sm sm:text-base font-bold tracking-wider uppercase flex items-center gap-3 cursor-pointer transition-all duration-200 active:scale-[0.98] ${
              isDark
                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-400/35'
                : 'bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 hover:shadow-slate-900/30'
            }`}
          >
            <span>ENTER MACROVEX 2.1 PRO</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </button>

          {/* Clean Telemetry Tag Under Button */}
          <div
            className={`flex items-center gap-2 text-[11px] font-mono tracking-tight transition-colors ${
              isDark ? 'text-slate-500' : 'text-slate-400'
            }`}
          >
            <span>Bitget Agent Hub MCP</span>
            <span>•</span>
            <span>20-Rule Deterministic Risk Gate</span>
            <span>•</span>
            <span>Zero Capital Risk</span>
          </div>
        </div>
      </main>

      {/* Minimal Clean Footer */}
      <footer className="relative z-10 px-6 lg:px-12 py-5 max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono transition-colors gap-2 border-t border-transparent">
        <div className={isDark ? 'text-slate-500' : 'text-slate-400'}>
          MACROVEX 2.1 PRO • INSTITUTIONAL PAPER TRADING TERMINAL
        </div>
        <div className={isDark ? 'text-slate-500' : 'text-slate-400'}>
          OFFICIAL BITGET MCP AGENT HUB TELEMETRY
        </div>
      </footer>
    </div>
  );
};
