import React, { useEffect, useState, useCallback } from 'react';
import { Header } from './components/Header.js';
import { PortfolioStats } from './components/PortfolioStats.js';
import { UnifiedTradingDesk } from './components/UnifiedTradingDesk.js';
import { OperationsCenter } from './components/OperationsCenter.js';
import { AssetIntelligenceDesk } from './components/AssetIntelligenceDesk.js';
import { MacroEventsHub } from './components/MacroEventsHub.js';
import { TradeLedger } from './components/TradeLedger.js';
import { BacktestLab } from './components/BacktestLab.js';
import { TradeJournalModal } from './components/TradeJournalModal.js';
import { SettingsModal } from './components/SettingsModal.js';
import { SystemHealthModal } from './components/SystemHealthModal.js';
import { OpeningCover } from './components/OpeningCover.js';
import { BitgetMcpModal } from './components/BitgetMcpModal.js';
import { OpportunityScannerDeck } from './components/OpportunityScannerDeck.js';
import { AutonomousEngineBanner } from './components/AutonomousEngineBanner.js';
import {
  AIDecision,
  AIActivityItem,
  AppSettings,
  AssetSummary,
  AutonomousEngineStatus,
  BitgetMcpStatus,
  ClosedTrade,
  MarketRegime,
  PortfolioState,
  Position,
} from './types.js';

const INITIAL_SETTINGS: AppSettings = {
  tradingMode: 'PAPER',
  liveModeConfirmed: false,
  maxDailyTrades: 5,
  maxRiskPerTradePercent: 2.0,
  maxPortfolioExposurePercent: 250,
  dailyLossLimitPercent: 4.0,
  maxDrawdownLimitPercent: 10.0,
  minRiskReward: 1.5,
  preferredRiskReward: 2.1,
  autonomousCycleSeconds: 20,
  isAutonomousActive: true,
  bitgetMode: 'demo',
  hasBitgetCreds: false,
  hasCmcCreds: false,
  hasNewsCreds: false,
  hasGeminiKey: false,
};

const INITIAL_PORTFOLIO: PortfolioState = {
  equity: 100000,
  initialCapital: 100000,
  cash: 100000,
  availableMargin: 100000,
  usedMargin: 0,
  unrealizedPnl: 0,
  realizedPnl: 0,
  dailyPnl: 0,
  weeklyPnl: 0,
  peakEquity: 100000,
  maxDrawdownPercent: 0,
  currentDrawdownPercent: 0,
  exposureNotional: 0,
  exposurePercent: 0,
  openRiskAmount: 0,
  openRiskPercent: 0,
  openPositionsCount: 0,
  todayTradesCount: 0,
  maxDailyTrades: 5,
  equityHistory: [],
  drawdownHistory: [],
  dailyPnlHistory: [],
};

export default function App() {
  const [hasEnteredApp, setHasEnteredApp] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        const saved = window.localStorage.getItem('macromind_theme') || window.localStorage.getItem('macrovex_theme');
        return saved === 'light' ? 'light' : 'dark';
      }
    } catch {}
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        window.localStorage.setItem('macromind_theme', theme);
      }
    } catch {}
  }, [theme]);

  const handleToggleTheme = (newTheme?: 'dark' | 'light') => {
    const next = newTheme ? newTheme : theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  const [isMcpModalOpen, setIsMcpModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('cockpit');
  const [selectedAsset, setSelectedAsset] = useState<string>('BTC');
  const [selectedJournalId, setSelectedJournalId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHealthOpen, setIsHealthOpen] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);

  // App State from server
  const [portfolio, setPortfolio] = useState<PortfolioState>(INITIAL_PORTFOLIO);
  const [agentState, setAgentState] = useState<{
    state: string;
    currentAsset: string | null;
    lastCycleAt: number;
    conviction: number;
  }>({
    state: 'SCANNING',
    currentAsset: 'BTC',
    lastCycleAt: Date.now(),
    conviction: 84,
  });
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  const [openPositions, setOpenPositions] = useState<Position[]>([]);
  const [closedTrades, setClosedTrades] = useState<ClosedTrade[]>([]);
  const [aiDecisions, setAiDecisions] = useState<AIDecision[]>([]);
  const [activities, setActivities] = useState<AIActivityItem[]>([]);
  const [radar, setRadar] = useState<AssetSummary[]>([]);
  const [regime, setRegime] = useState<MarketRegime>('RISK-ON');
  const [mcpStatus, setMcpStatus] = useState<BitgetMcpStatus | null>(null);
  const [engineStatus, setEngineStatus] = useState<AutonomousEngineStatus | null>(null);

  // Fetch core state
  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = await res.json();
        setPortfolio(data.portfolio);
        setAgentState(data.agentState);
        setSettings(data.settings);
        setOpenPositions(data.openPositions || []);
        setClosedTrades(data.closedTrades || []);
        // Guarantee deduplicated items by ID to prevent any React key collision
        const seenDec = new Set<string>();
        const uniqueDecisions = (data.aiDecisions || []).filter((d: any) => {
          if (!d?.id || seenDec.has(d.id)) return false;
          seenDec.add(d.id);
          return true;
        });
        setAiDecisions(uniqueDecisions);
        const seenAct = new Set<string>();
        const uniqueActivities = (data.activities || []).filter((a: any) => {
          if (!a?.id || seenAct.has(a.id)) return false;
          seenAct.add(a.id);
          return true;
        });
        setActivities(uniqueActivities);
      }
    } catch (err) {
      console.error('Error fetching state snapshot:', err);
    }
  }, []);

  // Fetch Autonomous Engine Status
  const fetchEngineStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/agent/status');
      if (res.ok) {
        const data = await res.json();
        setEngineStatus(data);
      }
    } catch (err) {
      console.error('Error fetching engine status:', err);
    }
  }, []);

  // Fetch Bitget MCP status
  const fetchMcpStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/bitget-mcp/status');
      if (res.ok) {
        const data = await res.json();
        setMcpStatus(data);
      }
    } catch (err) {
      console.error('Error fetching MCP status:', err);
    }
  }, []);

  // Fetch opportunity radar
  const fetchRadar = useCallback(async () => {
    try {
      const res = await fetch('/api/market/radar');
      if (res.ok) {
        const data = await res.json();
        setRadar(data);
      }
    } catch (err) {
      console.error('Error fetching radar:', err);
    }
  }, []);

  // Fetch regime
  const fetchRegime = useCallback(async () => {
    try {
      const res = await fetch('/api/macro/regime');
      if (res.ok) {
        const data = await res.json();
        if (data.regime) {
          setRegime(data.regime);
        }
      }
    } catch (err) {
      console.error('Error fetching regime:', err);
    }
  }, []);

  useEffect(() => {
    fetchState();
    fetchEngineStatus();
    fetchMcpStatus();
    fetchRadar();
    fetchRegime();

    // Regular polling for real-time responsiveness
    const stateInterval = setInterval(fetchState, 3500);
    const engineInterval = setInterval(fetchEngineStatus, 3500);
    const mcpInterval = setInterval(fetchMcpStatus, 6000);
    const radarInterval = setInterval(fetchRadar, 8000);
    const regimeInterval = setInterval(fetchRegime, 25000);

    return () => {
      clearInterval(stateInterval);
      clearInterval(engineInterval);
      clearInterval(mcpInterval);
      clearInterval(radarInterval);
      clearInterval(regimeInterval);
    };
  }, [fetchState, fetchEngineStatus, fetchMcpStatus, fetchRadar, fetchRegime]);

  const handleScanNow = async () => {
    setIsTriggering(true);
    try {
      const res = await fetch('/api/agent/scan-now', { method: 'POST' });
      if (res.ok) {
        await fetchState();
        await fetchEngineStatus();
        await fetchRadar();
      }
    } catch (err) {
      console.error('Error executing manual 30-min scan:', err);
    } finally {
      setIsTriggering(false);
    }
  };

  const handleTriggerCycle = async () => {
    setIsTriggering(true);
    try {
      const res = await fetch('/api/agent/trigger-cycle', { method: 'POST' });
      if (res.ok) {
        await fetchState();
        await fetchEngineStatus();
        await fetchRadar();
      }
    } catch (err) {
      console.error('Error triggering autonomous cycle:', err);
    } finally {
      setIsTriggering(false);
    }
  };

  const handleToggleAutonomous = async () => {
    try {
      const res = await fetch('/api/agent/toggle', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setSettings((prev) => ({ ...prev, isAutonomousActive: data.isAutonomousActive }));
        await fetchState();
        await fetchEngineStatus();
      }
    } catch (err) {
      console.error('Error toggling autonomous loop:', err);
    }
  };

  const handleClosePosition = async (id: string) => {
    try {
      // Optimistic removal from client state immediately
      setOpenPositions((prev) => prev.filter((p) => p.id !== id && p.tradeId !== id && `pos-${p.tradeId}` !== id));
      const res = await fetch(`/api/trades/close/${id}`, { method: 'POST' });
      if (res.ok) {
        await fetchState();
      } else {
        await fetchState();
      }
    } catch (err) {
      console.error('Error closing position:', err);
      await fetchState();
    }
  };

  const handleUpdateSettings = async (newSettings: Partial<AppSettings>) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      if (res.ok) {
        const updated = await res.json();
        setSettings(updated);
      }
    } catch (err) {
      console.error('Error updating settings:', err);
    }
  };

  const handleResetPortfolio = async () => {
    try {
      const res = await fetch('/api/settings/reset-portfolio', { method: 'POST' });
      if (res.ok) {
        await fetchState();
        setIsSettingsOpen(false);
      }
    } catch (err) {
      console.error('Error resetting portfolio:', err);
    }
  };

  const handleSelectAsset = (asset: string) => {
    setSelectedAsset(asset);
    setActiveTab('intelligence');
  };

  if (!hasEnteredApp) {
    return (
      <OpeningCover
        onEnter={() => setHasEnteredApp(true)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        mcpStatus={mcpStatus ? {
          status: mcpStatus.status,
          endpoint: mcpStatus.endpoint,
          latencyMs: mcpStatus.latencyMs,
        } : undefined}
      />
    );
  }

  return (
    <div className={`min-h-screen flex flex-col selection:bg-cyan-500 selection:text-black transition-colors duration-200 theme-app-container ${theme === 'dark' ? 'bg-[#080b11] text-[#f1f5f9]' : 'bg-[#f4f6f8] text-[#0f172a]'}`}>
      {/* Header */}
      <Header
        settings={settings}
        agentState={agentState}
        regime={regime}
        todayTradesCount={portfolio.todayTradesCount}
        maxDailyTrades={settings.maxDailyTrades}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onTriggerCycle={handleTriggerCycle}
        onToggleAutonomous={handleToggleAutonomous}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHealth={() => setIsHealthOpen(true)}
        isTriggering={isTriggering}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenMcpModal={() => setIsMcpModalOpen(true)}
        mcpStatus={mcpStatus}
      />

      {/* Autonomous Paper Trading Engine Status Banner (Level 1) */}
      <AutonomousEngineBanner
        status={engineStatus}
        onToggleAutonomous={handleToggleAutonomous}
        onRefreshScan={handleScanNow}
        onOpenMcpModal={() => setIsMcpModalOpen(true)}
        isTriggering={isTriggering}
      />

      {/* For secondary tabs (e.g. scanner, operations, ledger), render top portfolio summary */}
      {activeTab !== 'cockpit' && (
        <PortfolioStats
          portfolio={portfolio}
          onSelectPortfolio={() => setActiveTab('operations')}
          onSelectRisk={() => setActiveTab('cockpit')}
        />
      )}

      {/* Main Workspace Tabs */}
      <main className="flex-1 flex flex-col min-h-0">
        {activeTab === 'cockpit' && (
          <UnifiedTradingDesk
            agentState={agentState}
            radar={radar}
            openPositions={openPositions}
            closedTrades={closedTrades}
            aiDecisions={aiDecisions}
            activities={activities}
            regime={regime}
            portfolio={portfolio}
            onSelectTab={setActiveTab}
            onOpenJournal={(id) => setSelectedJournalId(id)}
            onClosePosition={handleClosePosition}
            onTriggerCycle={handleTriggerCycle}
            isTriggering={isTriggering}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenHealth={() => setIsHealthOpen(true)}
            mcpStatus={mcpStatus}
          />
        )}

        {activeTab === 'scanner' && (
          <OpportunityScannerDeck
            onSelectAsset={handleSelectAsset}
            onTradeExecuted={fetchState}
          />
        )}

        {activeTab === 'operations' && (
          <OperationsCenter
            agentState={agentState}
            radar={radar}
            openPositions={openPositions}
            aiDecisions={aiDecisions}
            activities={activities}
            dailyPnlHistory={portfolio.dailyPnlHistory}
            onSelectAsset={(asset) => {
              setSelectedAsset(asset);
              setActiveTab('intelligence');
            }}
            onOpenJournal={(id) => setSelectedJournalId(id)}
            onClosePosition={handleClosePosition}
            onTriggerCycle={handleTriggerCycle}
            isTriggering={isTriggering}
          />
        )}

        {activeTab === 'intelligence' && (
          <AssetIntelligenceDesk
            initialAsset={selectedAsset}
            onTradeSubmitted={() => {
              fetchState();
              setActiveTab('cockpit');
            }}
          />
        )}

        {activeTab === 'macro' && <MacroEventsHub />}

        {activeTab === 'ledger' && (
          <TradeLedger
            closedTrades={closedTrades}
            openPositions={openPositions}
            onOpenJournal={(id) => setSelectedJournalId(id)}
          />
        )}

        {activeTab === 'backtest' && <BacktestLab />}
      </main>

      {/* Trade Journal Modal */}
      <TradeJournalModal
        tradeId={selectedJournalId}
        onClose={() => setSelectedJournalId(null)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onResetPortfolio={handleResetPortfolio}
      />

      {/* System Health Modal */}
      <SystemHealthModal
        isOpen={isHealthOpen}
        onClose={() => setIsHealthOpen(false)}
      />

      {/* Bitget MCP Status Modal */}
      <BitgetMcpModal
        isOpen={isMcpModalOpen}
        onClose={() => setIsMcpModalOpen(false)}
      />
    </div>
  );
}
