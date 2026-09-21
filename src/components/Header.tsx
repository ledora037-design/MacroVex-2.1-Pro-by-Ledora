import React from 'react';
import {
  Activity,
  Cpu,
  Crosshair,
  Flame,
  Globe,
  Moon,
  Play,
  Pause,
  Radio,
  RotateCw,
  Settings as SettingsIcon,
  Shield,
  Sun,
  Zap,
} from 'lucide-react';
import { AppSettings, BitgetMcpStatus, MarketRegime } from '../types.js';

interface HeaderProps {
  settings: AppSettings;
  agentState: {
    state: string;
    currentAsset: string | null;
    lastCycleAt: number;
    conviction: number;
  };
  regime: MarketRegime;
  todayTradesCount: number;
  maxDailyTrades: number;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onTriggerCycle: () => void;
  onToggleAutonomous: () => void;
  onOpenSettings: () => void;
  onOpenHealth: () => void;
  isTriggering: boolean;
  theme?: 'dark' | 'light';
  onToggleTheme?: (theme?: 'dark' | 'light') => void;
  onOpenMcpModal?: () => void;
  mcpStatus?: BitgetMcpStatus | null;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  agentState,
  regime,
  todayTradesCount,
  maxDailyTrades,
  activeTab,
  setActiveTab,
  onTriggerCycle,
  onToggleAutonomous,
  onOpenSettings,
  onOpenHealth,
  isTriggering,
  theme = 'dark',
  onToggleTheme,
  onOpenMcpModal,
  mcpStatus,
}) => {
  const getRegimeBadge = () => {
    switch (regime) {
      case 'RISK-ON':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'RISK-OFF':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'TRANSITION':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const getAgentStateColor = () => {
    switch (agentState.state) {
      case 'EXECUTING':
        return 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40';
      case 'RISK CHECK':
        return 'text-amber-400 border-amber-500/40 bg-amber-950/40';
      case 'ANALYZING EVENT':
      case 'CROSS-CHECKING':
        return 'text-cyan-400 border-cyan-500/40 bg-cyan-950/40';
      case 'SCANNING':
        return 'text-blue-400 border-blue-500/40 bg-blue-950/40';
      case 'MONITORING':
        return 'text-violet-400 border-violet-500/40 bg-violet-950/40';
      default:
        return 'text-slate-400 border-slate-800 bg-slate-900/60';
    }
  };

  const navItems = [
    { id: 'cockpit', label: 'PRO COCKPIT', icon: Activity },
    { id: 'scanner', label: 'DYNAMIC SCANNER', icon: Crosshair },
    { id: 'operations', label: 'OPERATIONS CENTER', icon: Cpu },
    { id: 'macro', label: 'MACRO TRANSMISSION', icon: Globe },
    { id: 'ledger', label: 'AUDIT LEDGER', icon: Shield },
    { id: 'backtest', label: 'STRATEGY & RISK LAB', icon: Zap },
  ];

  return (
    <header className="border-b border-slate-800/80 bg-[#0d121c]/95 backdrop-blur-md sticky top-0 z-40">
      {/* Top Banner: Operational Mode & Guardrails */}
      <div className="px-4 py-1.5 bg-[#090d14] border-b border-slate-900 flex flex-wrap items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-semibold border border-cyan-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
            MODE: {settings.tradingMode}
          </span>
          <span className="hidden sm:inline text-slate-400">
            Real market prices & news • Deterministic 20-rule risk gate • Zero real capital risk
          </span>
        </div>

        <div className="flex items-center gap-4 text-slate-400">
          <button
            onClick={onOpenHealth}
            id="btn-network-status"
            className="hover:text-cyan-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="System & API Health Diagnostics"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-[11px]">DATA PIPELINES: HEALTHY</span>
          </button>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-slate-400">SLOTS:</span>
            <span className="text-cyan-400 font-bold font-mono">MAX 5 OPEN</span>
            <span className="text-slate-700">•</span>
            <span className="text-slate-400">TODAY:</span>
            <span className="text-emerald-400 font-bold font-mono">
              {todayTradesCount}
            </span>
            <span className="text-emerald-400/80 font-mono text-[10px]">(UNLIMITED)</span>
          </div>
        </div>
      </div>

      {/* Main Bar */}
      <div className="px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand & State */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 via-blue-600 to-violet-600 p-[1px] shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-[#0b0e14] rounded-lg flex items-center justify-center">
                <Flame className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-xl font-bold tracking-wider text-white">
                  MACROVEX
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                  2.1 PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-tight">
                AUTONOMOUS MACRO TRADING DESK
              </p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-800">
            {/* Live Agent State Indicator */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-mono font-semibold ${getAgentStateColor()}`}
            >
              <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
              <span>AGENT: {agentState.state}</span>
              {agentState.currentAsset && (
                <span className="text-white bg-black/40 px-1.5 py-0.5 rounded text-[11px]">
                  [{agentState.currentAsset}]
                </span>
              )}
            </div>

            {/* Regime Badge */}
            <div
              className={`px-2.5 py-1.5 rounded border text-xs font-mono font-semibold ${getRegimeBadge()}`}
            >
              REGIME: {regime}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={onToggleAutonomous}
            id="btn-toggle-agent"
            className={`px-3 py-1.5 rounded text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              settings.isAutonomousActive
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
            }`}
          >
            {settings.isAutonomousActive ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                AUTONOMOUS: ACTIVE
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                AUTONOMOUS: PAUSED
              </>
            )}
          </button>

          <button
            onClick={onTriggerCycle}
            id="btn-trigger-cycle"
            disabled={isTriggering}
            className="px-3 py-1.5 rounded text-xs font-mono font-semibold bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-600/30 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Force immediate macro scan & analysis cycle"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isTriggering ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">RUN CYCLE NOW</span>
          </button>

          {/* Bitget MCP Live Badge */}
          {onOpenMcpModal && (
            <button
              onClick={onOpenMcpModal}
              id="btn-bitget-mcp-status"
              className={`px-2.5 py-1.5 rounded text-xs font-mono font-semibold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                mcpStatus?.status === 'LIVE'
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/50'
                  : mcpStatus?.status === 'RECONNECTING'
                  ? 'bg-amber-950/40 text-amber-300 border-amber-500/40 hover:bg-amber-900/50'
                  : mcpStatus?.status === 'STALE'
                  ? 'bg-orange-950/40 text-orange-300 border-orange-500/40 hover:bg-orange-900/50'
                  : 'bg-rose-950/40 text-rose-300 border-rose-500/40 hover:bg-rose-900/50'
              }`}
              title="Bitget MCP Market Data Provider (Authoritative Live Feed)"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  mcpStatus?.status === 'LIVE'
                    ? 'bg-emerald-400 animate-pulse'
                    : mcpStatus?.status === 'RECONNECTING'
                    ? 'bg-amber-400 animate-ping'
                    : mcpStatus?.status === 'STALE'
                    ? 'bg-orange-400'
                    : 'bg-rose-400'
                }`}
              />
              <span className="hidden xl:inline">BITGET MCP:</span>
              <span className="font-bold">
                {mcpStatus?.status || 'NOT VERIFIED'}
              </span>
            </button>
          )}

          {/* Segmented Global Theme Toggle (DARK | LIGHT) */}
          {onToggleTheme && (
            <div
              id="header-theme-toggle"
              className={`flex items-center p-0.5 rounded-lg border text-xs font-mono transition-colors ${
                theme === 'dark'
                  ? 'border-slate-800 bg-[#0b0f17]'
                  : 'border-[#E2E8F0] bg-[#F1F5F9]'
              }`}
              title="Global Terminal Visual Theme"
            >
              <button
                type="button"
                onClick={() => onToggleTheme('dark')}
                id="btn-theme-dark"
                aria-pressed={theme === 'dark'}
                aria-label="Switch to Dark Mode"
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-semibold transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-slate-800 text-cyan-300 shadow-xs border border-slate-700/80 font-bold'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>DARK</span>
              </button>
              <button
                type="button"
                onClick={() => onToggleTheme('light')}
                id="btn-theme-light"
                aria-pressed={theme === 'light'}
                aria-label="Switch to Light Mode"
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-semibold transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-white text-slate-900 shadow-xs font-bold border border-[#CBD5E1]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>LIGHT</span>
              </button>
            </div>
          )}

          <button
            onClick={onOpenSettings}
            id="btn-settings"
            className={`p-2 rounded border transition-colors cursor-pointer ${
              theme === 'dark'
                ? 'text-slate-400 hover:text-white bg-slate-900 border-slate-800 hover:border-slate-700'
                : 'text-slate-600 hover:text-slate-900 bg-white border-slate-200 hover:border-slate-300 shadow-xs'
            }`}
            title="Trading Mode & Risk Settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Workspace Navigation Tabs */}
      <div className="px-4 flex items-center gap-1 overflow-x-auto border-t border-slate-800/60 no-scrollbar">
        {navItems.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 text-xs font-display font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'text-cyan-400 border-cyan-400 bg-cyan-500/5'
                  : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
