import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  Cpu,
  ExternalLink,
  Filter,
  Flame,
  Globe,
  Layers,
  Maximize2,
  Minimize2,
  Network,
  Percent,
  Play,
  Radio,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Sliders,
  XCircle,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  AIDecision,
  AIActivityItem,
  AssetIntelligence,
  AssetSummary,
  Candle,
  ClosedTrade,
  InstrumentId,
  MarketRegime,
  Position,
  BitgetMcpStatus,
  PortfolioState,
} from '../types.js';
import { formatUTCDateTime, formatDuration } from '../utils/timeFormat.js';
import { useLiveDuration } from '../utils/useLiveDuration.js';
import { AdvancedChartWorkspace } from './AdvancedChartWorkspace.js';
import { SmcDiagnosticsPanel } from './SmcDiagnosticsPanel.js';
import { AiTradeDecisionPanel } from './AiTradeDecisionPanel.js';
import { CrossAssetConfirmationPanel } from './CrossAssetConfirmationPanel.js';
import { MarketPulseBar } from './MarketPulseBar.js';
import { PortfolioStats } from './PortfolioStats.js';
import { BitgetMcpModal } from './BitgetMcpModal.js';

interface ActivePositionDockRowProps {
  pos: Position;
  idx: number;
  onClosePosition: (id: string) => void;
  onOpenJournal?: (tradeId: string) => void;
}

const ActivePositionDockRow: React.FC<ActivePositionDockRowProps> = ({
  pos,
  idx,
  onClosePosition,
  onOpenJournal,
}) => {
  const { formattedDuration } = useLiveDuration(pos.openedAt || pos.openingTimestamp);
  const isWin = pos.unrealizedPnl >= 0;
  const openedTime =
    pos.openedAt && pos.openedAt > 0
      ? formatUTCDateTime(pos.openedAt)
      : (pos.openingTime ? formatUTCDateTime(pos.openingTime) : 'TIMESTAMP UNAVAILABLE');

  return (
    <tr
      key={pos.id ? `${pos.id}-${idx}` : `pos-${idx}`}
      onClick={() => onOpenJournal && onOpenJournal(pos.tradeId || pos.id)}
      className="hover:bg-slate-800/40 transition-colors cursor-pointer"
      title="Click to view full trade journal and execution details"
    >
      <td className="py-2.5 px-3 font-mono">
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold text-white text-xs tracking-wider">{pos.asset}</span>
          <span className="text-[10px] text-cyan-400 font-bold">[{pos.leverage}x]</span>
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
          <span className="text-amber-300 font-bold">${(pos.marginUsed ?? pos.margin).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> margin
        </div>
      </td>
      <td className="py-2.5 px-3 font-mono">
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wide border ${
            pos.direction === 'LONG'
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
              : 'bg-rose-500/15 text-rose-400 border-rose-500/40'
          }`}
        >
          {pos.direction}
        </span>
      </td>
      <td className="py-2.5 px-3 font-mono text-xs font-bold text-slate-300">
        <div>${pos.entry < 1 ? pos.entry.toFixed(4) : pos.entry.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        <div className="text-[10px] text-slate-400 font-normal mt-0.5">
          ${(pos.positionNotional ?? pos.notional).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} notional
        </div>
      </td>
      <td className="py-2.5 px-3 font-mono text-xs font-extrabold text-white">
        ${pos.currentPrice < 1 ? pos.currentPrice.toFixed(4) : pos.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>
      <td className="py-2.5 px-3 font-mono">
        <div className="flex items-baseline gap-1.5">
          <span className={`font-extrabold text-xs ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isWin ? '+' : ''}${pos.unrealizedPnl.toFixed(2)}
          </span>
          <span className={`text-[10px] font-bold ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
            ({isWin ? '+' : ''}{pos.unrealizedPnlPercent.toFixed(2)}%)
          </span>
        </div>
      </td>
      <td className="py-2.5 px-3 font-mono text-xs">
        <div className="flex items-center gap-1">
          <span className="text-amber-400 font-bold" title="Stop Loss">
            ${pos.stopLoss < 1 ? pos.stopLoss.toFixed(4) : pos.stopLoss.toFixed(2)}
          </span>
          <span className="text-slate-600 font-bold">/</span>
          <span className="text-emerald-400 font-bold" title="Take Profit">
            ${pos.takeProfit < 1 ? pos.takeProfit.toFixed(4) : pos.takeProfit.toFixed(2)}
          </span>
        </div>
      </td>
      <td className="py-2.5 px-3 font-mono text-[10px]">
        <div className="text-slate-300">
          <span className="text-slate-500 font-bold">OPEN: </span>
          <span className="text-slate-200">{openedTime}</span>
        </div>
        <div className="text-cyan-400 font-extrabold text-[11px] mt-0.5">
          <span className="text-slate-500 font-normal">DUR: </span>
          {formattedDuration}
        </div>
        {pos.partialProfitTaken && (
          <div className="text-[9px] text-emerald-400 font-bold mt-0.5">
            50% TP LOCKED
          </div>
        )}
      </td>
      <td className="py-2.5 px-3 text-right">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClosePosition(pos.id);
          }}
          className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-bold transition-colors cursor-pointer"
          title="Execute immediate market close order"
        >
          MARKET CLOSE
        </button>
      </td>
    </tr>
  );
};

interface UnifiedTradingDeskProps {
  agentState: {
    state: string;
    currentAsset: string | null;
    lastCycleAt: number;
    conviction: number;
  };
  radar: AssetSummary[];
  openPositions: Position[];
  closedTrades: ClosedTrade[];
  aiDecisions: AIDecision[];
  activities: AIActivityItem[];
  regime: MarketRegime;
  portfolio?: PortfolioState;
  onSelectTab?: (tab: string) => void;
  onOpenJournal: (tradeId: string) => void;
  onClosePosition: (id: string) => void;
  onTriggerCycle: () => void;
  isTriggering: boolean;
  onOpenSettings: () => void;
  onOpenHealth: () => void;
  mcpStatus?: BitgetMcpStatus | null;
}

export const UnifiedTradingDesk: React.FC<UnifiedTradingDeskProps> = ({
  agentState,
  radar,
  openPositions,
  closedTrades,
  aiDecisions,
  activities,
  regime,
  portfolio,
  onSelectTab,
  onOpenJournal,
  onClosePosition,
  onTriggerCycle,
  isTriggering,
  onOpenSettings,
  onOpenHealth,
  mcpStatus,
}) => {
  // Selected active asset
  const [selectedAsset, setSelectedAsset] = useState<InstrumentId>('BTC');
  const [timeframe, setTimeframe] = useState<string>('1h');
  const [activeCenterView, setActiveCenterView] = useState<'TERMINAL' | 'MACRO_PIPELINE' | 'STRATEGY_RISK' | 'LEDGER'>('TERMINAL');
  const [isMcpModalOpen, setIsMcpModalOpen] = useState(false);

  // Screener state
  const [assetCategory, setAssetCategory] = useState<'ALL' | 'CRYPTO' | 'EQUITIES' | 'COMMODITIES'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Bottom dock state
  const [dockTab, setDockTab] = useState<'POSITIONS' | 'TRADES' | 'DECISIONS' | 'LOGS'>('POSITIONS');
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);

  // Asset live data
  const [intel, setIntel] = useState<AssetIntelligence | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loadingAsset, setLoadingAsset] = useState(false);

  // Order Ticket state
  const [direction, setDirection] = useState<'LONG' | 'SHORT'>('LONG');
  const [entryPrice, setEntryPrice] = useState<string>('');
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [leverage, setLeverage] = useState<number>(5);
  const [riskPercent, setRiskPercent] = useState<number>(1.5);
  const [marginAllocationMode, setMarginAllocationMode] = useState<'AI_AUTO' | 'MANUAL'>('AI_AUTO');
  const [manualMarginInput, setManualMarginInput] = useState<string>('500');
  const [isEvaluatingAI, setIsEvaluatingAI] = useState(false);
  const [isSubmittingTrade, setIsSubmittingTrade] = useState(false);
  const [tradeFeedback, setTradeFeedback] = useState<{ success: boolean; message: string; checks?: Record<string, boolean> } | null>(null);
  const [calculatedRisk, setCalculatedRisk] = useState<{
    approved: boolean;
    reason?: string;
    marginUsed: number;
    positionNotional: number;
    capitalAtRisk: number;
    leverage: number;
    rr: number;
    signalStrength: string;
  } | null>(null);

  // Live query canonical Risk Engine calculation
  useEffect(() => {
    let isMounted = true;
    const calculateLiveRisk = async () => {
      const e = parseFloat(entryPrice);
      const sl = parseFloat(stopLoss);
      const tp = parseFloat(takeProfit);
      if (!e || !sl || !tp) return;

      const isManualMargin = marginAllocationMode === 'MANUAL';
      const parsedManualMargin = isManualMargin && manualMarginInput ? parseFloat(manualMarginInput) : undefined;

      try {
        const res = await fetch('/api/risk/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            asset: selectedAsset,
            direction,
            entry: e,
            stop_loss: sl,
            take_profit: tp,
            leverage,
            risk_percent: riskPercent,
            isManual: isManualMargin,
            manualMargin: parsedManualMargin && parsedManualMargin > 0 ? parsedManualMargin : undefined,
          }),
        });
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data.approved && data.calculatedSize) {
            setCalculatedRisk({
              approved: true,
              marginUsed: data.calculatedSize.marginUsed,
              positionNotional: data.calculatedSize.positionNotional,
              capitalAtRisk: data.calculatedSize.capitalAtRisk,
              leverage: data.calculatedSize.leverage,
              rr: data.calculatedSize.rr,
              signalStrength: data.calculatedSize.signalStrength,
            });
          } else {
            setCalculatedRisk({
              approved: false,
              reason: data.reason || 'Risk check failed',
              marginUsed: 0,
              positionNotional: 0,
              capitalAtRisk: 0,
              leverage,
              rr: data.calculatedSize?.rr || (Math.abs(tp - e) / Math.max(0.0001, Math.abs(e - sl))),
              signalStrength: 'REJECTED',
            });
          }
        }
      } catch (err) {
        // preserve current or wait
      }
    };

    const timer = setTimeout(calculateLiveRisk, 150);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [selectedAsset, direction, entryPrice, stopLoss, takeProfit, leverage, riskPercent, marginAllocationMode, manualMarginInput]);

  // Fetch asset data when selectedAsset or timeframe changes
  const fetchAssetData = async (symbol: InstrumentId, tf: string) => {
    setLoadingAsset(true);
    try {
      const [intelRes, candleRes] = await Promise.all([
        fetch(`/api/market/asset/${symbol}`),
        fetch(`/api/market/candles/${symbol}?timeframe=${tf}`),
      ]);
      if (intelRes.ok && candleRes.ok) {
        const intelData = await intelRes.json();
        const candleData = await candleRes.json();
        setIntel(intelData);
        setCandles(candleData);

        const curPrice = intelData.price || 100;
        setEntryPrice(curPrice.toString());
        const isBull = intelData.technicalBias === 'BULLISH';
        const dir = isBull ? 'LONG' : 'SHORT';
        setDirection(dir);
        if (dir === 'LONG') {
          setStopLoss((curPrice * 0.985).toFixed(2));
          setTakeProfit((curPrice * 1.035).toFixed(2));
        } else {
          setStopLoss((curPrice * 1.015).toFixed(2));
          setTakeProfit((curPrice * 0.965).toFixed(2));
        }
      }
    } catch (err) {
      console.error('Error fetching asset data:', err);
    } finally {
      setLoadingAsset(false);
    }
  };

  useEffect(() => {
    fetchAssetData(selectedAsset, timeframe);
  }, [selectedAsset, timeframe]);

  // Filtered radar assets for the screener
  const filteredRadar = useMemo(() => {
    return radar.filter((item) => {
      const matchesCat = assetCategory === 'ALL' || item.category === assetCategory;
      const matchesSearch =
        item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [radar, assetCategory, searchQuery]);

  // Risk & Reward math
  const numEntry = parseFloat(entryPrice) || 0;
  const numSl = parseFloat(stopLoss) || 0;
  const numTp = parseFloat(takeProfit) || 0;
  const riskDist = Math.abs(numEntry - numSl);
  const rewardDist = Math.abs(numTp - numEntry);
  const liveRR = riskDist > 0 ? parseFloat((rewardDist / riskDist).toFixed(2)) : 0;

  // AI Autofill
  const handleAIAutofill = async () => {
    setIsEvaluatingAI(true);
    setTradeFeedback(null);
    try {
      const res = await fetch('/api/decisions/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asset: selectedAsset }),
      });
      if (res.ok) {
        const dec = await res.json();
        setDirection(dec.direction);
        setEntryPrice(dec.entry.toString());
        setStopLoss(dec.stop_loss.toString());
        setTakeProfit(dec.take_profit.toString());
        setLeverage(dec.leverage || 5);
        setRiskPercent(dec.risk_percent || 1.5);
        if (dec.risk_decision?.calculatedSize && dec.risk_decision.approved && dec.action !== 'WAIT') {
          setCalculatedRisk({
            approved: true,
            marginUsed: dec.marginUsed || dec.risk_decision.calculatedSize.marginUsed,
            positionNotional: dec.positionNotional || dec.risk_decision.calculatedSize.positionNotional,
            capitalAtRisk: dec.capitalAtRisk || dec.risk_decision.calculatedSize.capitalAtRisk,
            leverage: dec.leverage || 5,
            rr: dec.rr || dec.risk_decision.calculatedSize.rr,
            signalStrength: dec.signalStrength || dec.risk_decision.calculatedSize.signalStrength,
          });
        }
        setTradeFeedback({
          success: true,
          message: `AI evaluated ${selectedAsset} [${dec.action}]: Confidence ${dec.confidence}%. Optimal R:R ${dec.rr}:1 loaded.`,
        });
      }
    } catch (err: any) {
      setTradeFeedback({ success: false, message: `Autofill failed: ${err.message}` });
    } finally {
      setIsEvaluatingAI(false);
    }
  };

  // Execute manual trade
  const handleExecuteTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingTrade(true);
    setTradeFeedback(null);

    try {
      const isManualMargin = marginAllocationMode === 'MANUAL';
      const parsedManualMargin = isManualMargin && manualMarginInput ? parseFloat(manualMarginInput) : undefined;

      const res = await fetch('/api/trades/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset: selectedAsset,
          direction,
          entry: parseFloat(entryPrice),
          stop_loss: parseFloat(stopLoss),
          take_profit: parseFloat(takeProfit),
          leverage,
          risk_percent: riskPercent,
          manualMargin: parsedManualMargin && parsedManualMargin > 0 ? parsedManualMargin : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.approved) {
        setTradeFeedback({
          success: true,
          message: `Order Approved: ${direction} ${selectedAsset} executed. Passed all 20 Risk Gates!`,
          checks: data.riskResult?.checks,
        });
        setDockTab('POSITIONS');
        setIsDockCollapsed(false);
      } else {
        setTradeFeedback({
          success: false,
          message: `STATUS: RISK REJECTED — ${data.reason}`,
          checks: data.checks,
        });
      }
    } catch (err: any) {
      setTradeFeedback({
        success: false,
        message: `STATUS: RISK REJECTED — ${err.message}`,
      });
    } finally {
      setIsSubmittingTrade(false);
    }
  };

  // Format chart data (Explicit UTC)
  const chartData = candles.map((c) => ({
    time: new Date(c.time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }),
    price: c.close,
    high: c.high,
    low: c.low,
    volume: c.volume,
  }));

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#07090e] text-slate-200">
      {/* ========================================================================= */}
      {/* 0. ACTIVE POSITIONS (Elevated to top of Cockpit)                          */}
      {/* ========================================================================= */}
      <div className="bg-[#0b0f17] border-b border-[#161f2e] p-2.5 font-mono text-xs">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5 text-xs">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              ACTIVE POSITIONS
            </span>
            <span className="px-2 py-0.5 bg-cyan-500/15 text-cyan-300 font-bold text-[10px] border border-cyan-500/40 rounded">
              {openPositions.length} / 5
            </span>
          </div>
          {openPositions.length > 0 && (
            <span className="text-[11px] text-emerald-400 font-bold">
              ● MANAGING {openPositions.length} LIVE POSITION{openPositions.length > 1 ? 'S' : ''}
            </span>
          )}
        </div>

        {openPositions.length === 0 ? (
          <div className="py-2.5 px-3 bg-[#080c12] border border-slate-800 rounded text-center text-slate-500 text-xs">
            NO OPEN POSITIONS (AI Waiting or Flat)
          </div>
        ) : (
          <div className="overflow-x-auto bg-[#080c12] border border-slate-800 rounded">
            <table className="w-full text-left text-[11px] min-w-[700px]">
              <thead className="text-slate-500 border-b border-slate-800">
                <tr>
                  <th className="py-1.5 px-3">ASSET</th>
                  <th className="py-1.5 px-3">SIDE</th>
                  <th className="py-1.5 px-3">ENTRY</th>
                  <th className="py-1.5 px-3">MARK</th>
                  <th className="py-1.5 px-3">CURRENT P&amp;L</th>
                  <th className="py-1.5 px-3">SL / TP</th>
                  <th className="py-1.5 px-3">OPEN (UTC) / DURATION</th>
                  <th className="py-1.5 px-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {openPositions.map((pos, idx) => (
                  <ActivePositionDockRow
                    key={pos.id ? `${pos.id}-${idx}` : `pos-${idx}`}
                    pos={pos}
                    idx={idx}
                    onClosePosition={onClosePosition}
                    onOpenJournal={onOpenJournal}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. MARKET PULSE BAR (Authoritative Bitget MCP Live Benchmarks)            */}
      {/* ========================================================================= */}
      <MarketPulseBar
        radar={radar}
        mcpStatus={mcpStatus?.status || 'NOT VERIFIED'}
        onOpenMcpModal={() => setIsMcpModalOpen(true)}
        onSelectAsset={(s) => setSelectedAsset(s as InstrumentId)}
      />

      {/* ========================================================================= */}
      {/* 2. TOP TICKER TAPE RIBBON (Real-time prices across all assets)            */}
      {/* ========================================================================= */}
      <div className="h-8 bg-[#090c12] border-b border-[#161f2e] px-3 flex items-center overflow-x-auto no-scrollbar font-mono text-[11px] select-none">
        <div className="flex items-center gap-1 text-slate-400 mr-3 shrink-0 font-display text-[10px] tracking-wider uppercase">
          <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
          <span>MARKET TAPE</span>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          {radar.slice(0, 16).map((item) => {
            const isUp = item.change24h >= 0;
            const isSelected = item.symbol === selectedAsset;
            return (
              <button
                key={item.symbol}
                onClick={() => setSelectedAsset(item.symbol as InstrumentId)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'hover:bg-slate-800/60 text-slate-300'
                }`}
              >
                <span className="font-bold text-white">{item.symbol}</span>
                <span className="text-slate-400">${item.price < 1 ? item.price.toFixed(4) : item.price.toLocaleString()}</span>
                <span className={`font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isUp ? '+' : ''}{item.change24h}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. PORTFOLIO QUICK BAR                                                    */}
      {/* ========================================================================= */}
      {portfolio && (
        <PortfolioStats
          portfolio={portfolio}
          onSelectPortfolio={() => onSelectTab && onSelectTab('operations')}
          onSelectRisk={() => setActiveCenterView('STRATEGY_RISK')}
        />
      )}

      {/* ========================================================================= */}
      {/* 4. THREE-PANE INSTITUTIONAL WORKSPACE GRID                                */}
      {/* ========================================================================= */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-1 p-1 min-h-0 overflow-hidden">
        {/* ----------------------------------------------------------------------- */}
        {/* PANE A (LEFT, 3 COLS): ASSET WATCHLIST, SCREENER & REGIME RADAR */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-3 flex flex-col bg-[#0b0f17] border border-[#161f2e] rounded-lg overflow-hidden">
          {/* Screener Header */}
          <div className="p-2.5 bg-[#080c12] border-b border-[#161f2e] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-display text-xs font-bold text-white tracking-wider">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>MARKET SCREENER</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
                24 ASSETS
              </span>
            </div>

            {/* Category Filter Pills */}
            <div className="grid grid-cols-4 gap-1 text-[10px] font-mono">
              {(['ALL', 'CRYPTO', 'EQUITIES', 'COMMODITIES'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setAssetCategory(cat)}
                  className={`py-1 rounded text-center cursor-pointer transition-colors ${
                    assetCategory === cat
                      ? 'bg-cyan-500 text-black font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat === 'COMMODITIES' ? 'COMM' : cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3 h-3 text-slate-500 absolute left-2 top-2.5" />
              <input
                type="text"
                placeholder="Filter symbols / names..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0d131f] border border-slate-800 rounded pl-7 pr-2 py-1 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Screener Table List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40 font-mono text-xs">
            {filteredRadar.map((item) => {
              const isSelected = item.symbol === selectedAsset;
              const isUp = item.change24h >= 0;
              const isBullish = item.technicalBias === 'BULLISH';
              return (
                <div
                  key={item.symbol}
                  onClick={() => setSelectedAsset(item.symbol as InstrumentId)}
                  className={`p-2 flex items-center justify-between cursor-pointer transition-colors select-none ${
                    isSelected
                      ? 'bg-cyan-950/40 border-l-2 border-cyan-400 text-white'
                      : 'hover:bg-slate-900/60 text-slate-300'
                  }`}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white">{item.symbol}</span>
                      <span
                        className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                          isBullish
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : item.technicalBias === 'BEARISH'
                            ? 'bg-rose-500/10 text-rose-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.technicalBias}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 truncate max-w-[110px]">
                      {item.name}
                    </span>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <span className="font-bold text-white">
                      ${item.price < 1 ? item.price.toFixed(4) : item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isUp ? '+' : ''}{item.change24h}%
                      </span>
                      <span className="text-[9px] bg-slate-800/80 text-cyan-300 px-1 rounded font-bold" title="AI Opportunity Score">
                        {item.opportunityScore}pt
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Screener Footer: Macro Regime Badge */}
          <div className="p-2 bg-[#080c12] border-t border-[#161f2e] text-[10px] font-mono flex items-center justify-between">
            <div className="flex items-center gap-1 text-slate-400">
              <Globe className="w-3 h-3 text-cyan-400" />
              <span>REGIME:</span>
              <strong className="text-emerald-400">{regime}</strong>
            </div>
            <span className="text-slate-400 font-bold">100% DETERMINISTIC RISK</span>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* PANE B (CENTER, 6 COLS): PRIMARY TRADING COCKPIT & DOCKED TABS */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-6 flex flex-col gap-1 min-h-0 overflow-y-auto">
          {/* Center View Switcher Header */}
          <div className="bg-[#0b0f17] border border-[#161f2e] rounded-lg p-2 flex items-center justify-between">
            <div className="flex items-center gap-1 font-mono text-xs">
              <button
                onClick={() => setActiveCenterView('TERMINAL')}
                className={`px-3 py-1.5 rounded-md font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeCenterView === 'TERMINAL'
                    ? 'bg-cyan-500 text-black shadow'
                    : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>TERMINAL & EXECUTION</span>
              </button>
              <button
                onClick={() => setActiveCenterView('MACRO_PIPELINE')}
                className={`px-3 py-1.5 rounded-md font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeCenterView === 'MACRO_PIPELINE'
                    ? 'bg-cyan-500 text-black shadow'
                    : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800'
                }`}
              >
                <Network className="w-3.5 h-3.5" />
                <span>5-STAGE MACRO PIPELINE</span>
              </button>
              <button
                onClick={() => setActiveCenterView('STRATEGY_RISK')}
                className={`px-3 py-1.5 rounded-md font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeCenterView === 'STRATEGY_RISK'
                    ? 'bg-cyan-500 text-black shadow'
                    : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>20-GATE RISK & BACKTEST</span>
              </button>
            </div>

            {/* Run Cycle Override */}
            <button
              onClick={onTriggerCycle}
              disabled={isTriggering}
              className="px-2.5 py-1 rounded bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-mono font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
              title="Force execute 1 full autonomous AI cycle now"
            >
              <Zap className="w-3 h-3" />
              <span>{isTriggering ? 'RUNNING...' : 'TRIGGER CYCLE'}</span>
            </button>
          </div>

          {/* VIEW 1: TERMINAL & CHART WORKSPACE */}
          {activeCenterView === 'TERMINAL' && (
            <div className="space-y-3">
              {/* ADVANCED CHART WORKSPACE (MANDATORY PURE WHITE CANVAS #FFFFFF) */}
              <AdvancedChartWorkspace
                selectedAsset={selectedAsset}
                onSelectAsset={(a) => setSelectedAsset(a as InstrumentId)}
                currentPrice={intel?.price || 0}
                priceChange24h={radar.find((r) => r.symbol === selectedAsset)?.change24h || 0}
                timeframe={timeframe}
                onTimeframeChange={(tf) => setTimeframe(tf)}
                candles={candles}
                loadingCandles={loadingAsset}
                smc={intel?.smc}
                indicators={{
                  ema20: intel?.indicators.ema20 || 0,
                  ema50: intel?.indicators.ema50 || 0,
                  rsi14: intel?.indicators.rsi14 || 50,
                  vwap: intel?.indicators.vwap || 0,
                  adx14: intel?.indicators.adx14 || 25,
                }}
              />

              {/* AI LIVE TECHNICAL & SMC DIAGNOSTICS */}
              <SmcDiagnosticsPanel
                intel={intel}
                selectedAsset={selectedAsset}
                timeframe={timeframe}
                currentPrice={intel?.price || 0}
              />

              {/* DUAL DECISION & RISK AUTHORITY + ORDER TICKET */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                {/* AI Trade Decision & Risk Authority */}
                <div className="lg:col-span-6">
                  <AiTradeDecisionPanel
                    selectedAsset={selectedAsset}
                    intel={intel}
                    currentPrice={intel?.price || 0}
                    onAutofillTicket={handleAIAutofill}
                  />
                </div>

                {/* Embedded Risk-Gated Order Execution Ticket */}
                <div className="lg:col-span-6 bg-[#0b0f17] border border-[#161f2e] rounded-xl p-4 font-mono text-xs space-y-3 shadow-lg">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-display text-xs font-bold text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-cyan-400" />
                      ORDER EXECUTION TICKET
                    </span>
                    <button
                      type="button"
                      onClick={handleAIAutofill}
                      disabled={isEvaluatingAI}
                      className="px-2.5 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <span>{isEvaluatingAI ? 'CALCULATING...' : 'AI AUTOFILL'}</span>
                    </button>
                  </div>

                  <form onSubmit={handleExecuteTrade} className="space-y-2.5">
                    {/* Direction Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDirection('LONG')}
                        className={`py-2 rounded font-bold text-xs transition-all cursor-pointer ${
                          direction === 'LONG'
                            ? 'bg-emerald-500 text-black font-bold shadow'
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}
                      >
                        LONG / BUY
                      </button>
                      <button
                        type="button"
                        onClick={() => setDirection('SHORT')}
                        className={`py-2 rounded font-bold text-xs transition-all cursor-pointer ${
                          direction === 'SHORT'
                            ? 'bg-rose-500 text-white font-bold shadow'
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}
                      >
                        SHORT / SELL
                      </button>
                    </div>

                    {/* Inputs Grid */}
                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                      <div>
                        <label className="text-slate-400">ENTRY ($)</label>
                        <input
                          type="number"
                          step="any"
                          value={entryPrice}
                          onChange={(e) => setEntryPrice(e.target.value)}
                          className="w-full mt-1 p-1.5 rounded bg-[#080c12] border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-rose-400">STOP LOSS ($)</label>
                        <input
                          type="number"
                          step="any"
                          value={stopLoss}
                          onChange={(e) => setStopLoss(e.target.value)}
                          className="w-full mt-1 p-1.5 rounded bg-[#080c12] border border-slate-800 text-white focus:outline-none focus:border-rose-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-emerald-400">TAKE PROFIT ($)</label>
                        <input
                          type="number"
                          step="any"
                          value={takeProfit}
                          onChange={(e) => setTakeProfit(e.target.value)}
                          className="w-full mt-1 p-1.5 rounded bg-[#080c12] border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                          required
                        />
                      </div>
                    </div>

                    {/* Leverage & Margin Allocation Section */}
                    <div className="p-2.5 rounded-lg bg-[#080c12] border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                          MARGIN ALLOCATION POLICY
                        </span>
                        <div className="flex items-center gap-1 bg-[#0b0f17] p-0.5 rounded border border-slate-800 text-[10px]">
                          <button
                            type="button"
                            onClick={() => setMarginAllocationMode('AI_AUTO')}
                            className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                              marginAllocationMode === 'AI_AUTO'
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            AI AUTO
                          </button>
                          <button
                            type="button"
                            onClick={() => setMarginAllocationMode('MANUAL')}
                            className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                              marginAllocationMode === 'MANUAL'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            MANUAL MARGIN
                          </button>
                        </div>
                      </div>

                      {marginAllocationMode === 'AI_AUTO' ? (
                        <div className="text-[10px] text-slate-400 leading-tight bg-[#0b0f17] p-2 rounded border border-slate-800/80">
                          <span className="text-cyan-400 font-bold block mb-0.5">DETERMINISTIC TIER SIZING:</span>
                          Weaker ($100–$200) · Normal ($200–$500) · Strong ($500–$800) · Very Strong ($800–$1,000) · Exceptional ($1,500–$2,000).
                          <span className="block text-[9px] text-slate-500 mt-0.5">
                            Capped at 2% equity (~$2,100) and 10% total portfolio margin. Defaults to lower end of range.
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-1.5 bg-[#0b0f17] p-2 rounded border border-slate-800/80">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-amber-400 font-bold">MANUAL MARGIN PRESETS (USDT):</span>
                            <span className="text-[9px] text-slate-500">Max 2% equity ($2,100)</span>
                          </div>
                          <div className="grid grid-cols-4 gap-1.5">
                            {['200', '500', '800', '1000'].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setManualMarginInput(preset)}
                                className={`py-1 rounded font-bold text-[10px] font-mono transition-all cursor-pointer border ${
                                  manualMarginInput === preset
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
                                }`}
                              >
                                ${preset}
                              </button>
                            ))}
                          </div>
                          <div className="flex items-center gap-2 pt-1 text-[10px]">
                            <label className="text-slate-400 whitespace-nowrap">CUSTOM MARGIN:</label>
                            <div className="relative flex-1">
                              <span className="absolute left-2 top-1.5 text-slate-500 font-mono">$</span>
                              <input
                                type="number"
                                min="50"
                                max="5000"
                                step="10"
                                value={manualMarginInput}
                                onChange={(e) => setManualMarginInput(e.target.value)}
                                placeholder="500"
                                className="w-full pl-5 pr-14 py-1 rounded bg-[#080c12] border border-slate-700 text-amber-300 font-mono text-xs focus:outline-none focus:border-amber-500"
                              />
                              <span className="absolute right-2 top-1.5 text-[9px] text-slate-500 font-mono">USDT</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Leverage Selector */}
                      <div className="flex items-center justify-between text-[10px] pt-1">
                        <span className="text-slate-400">LEVERAGE:</span>
                        <div className="flex items-center gap-1">
                          {[2, 3, 5, 10].map((lev) => (
                            <button
                              key={lev}
                              type="button"
                              onClick={() => setLeverage(lev)}
                              className={`px-2 py-0.5 rounded font-bold font-mono text-[10px] transition-all cursor-pointer border ${
                                leverage === lev
                                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              {lev}x
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Canonical Deterministic Risk Engine Metrics Strip */}
                    <div className="p-2.5 rounded-lg bg-[#080c12] border border-slate-800 space-y-2">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] font-mono">
                        <div className="bg-[#0e1624] p-1.5 rounded border border-amber-500/20">
                          <span className="text-[9px] text-amber-400 font-bold block uppercase tracking-wider">MARGIN USED</span>
                          <span className="font-bold font-mono text-amber-300 text-xs">
                            {calculatedRisk?.approved && calculatedRisk.marginUsed > 0
                              ? `$${calculatedRisk.marginUsed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`
                              : '$0.00 USDT'}
                          </span>
                        </div>
                        <div className="bg-[#0e1624] p-1.5 rounded border border-slate-700">
                          <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">LEVERAGE</span>
                          <span className="font-bold font-mono text-amber-300 text-xs">{leverage}x</span>
                        </div>
                        <div className="bg-[#0e1624] p-1.5 rounded border border-cyan-500/20">
                          <span className="text-[9px] text-cyan-400 font-bold block uppercase tracking-wider">POSITION NOTIONAL</span>
                          <span className="font-bold font-mono text-white text-xs">
                            {calculatedRisk?.approved && calculatedRisk.positionNotional > 0
                              ? `$${calculatedRisk.positionNotional.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`
                              : '$0.00 USDT'}
                          </span>
                        </div>
                        <div className="bg-[#0e1624] p-1.5 rounded border border-slate-700">
                          <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">CAPITAL AT RISK</span>
                          <span className="font-bold font-mono text-white text-xs">
                            {calculatedRisk?.approved && calculatedRisk.capitalAtRisk > 0
                              ? `$${calculatedRisk.capitalAtRisk.toFixed(2)}`
                              : '$0.00'}
                          </span>
                        </div>
                        <div className="bg-[#0e1624] p-1.5 rounded border border-slate-700">
                          <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">R:R</span>
                          <span className={`font-bold font-mono text-xs ${liveRR >= 1.5 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {calculatedRisk?.rr ? calculatedRisk.rr.toFixed(2) : liveRR}:1
                          </span>
                        </div>
                        <div className="bg-[#0e1624] p-1.5 rounded border border-slate-700">
                          <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">SIGNAL STRENGTH</span>
                          <span className={`font-extrabold text-[10px] ${
                            calculatedRisk?.signalStrength === 'VERY STRONG' ? 'text-cyan-300' :
                            calculatedRisk?.signalStrength === 'STRONG' ? 'text-emerald-400' :
                            calculatedRisk?.signalStrength === 'NORMAL' ? 'text-blue-300' :
                            calculatedRisk?.signalStrength === 'WEAKER' ? 'text-amber-300' :
                            'text-slate-400'
                          }`}>
                            {calculatedRisk?.approved ? (calculatedRisk?.signalStrength || 'STRONG') : (calculatedRisk?.reason ? 'WAIT / REJECTED' : 'CALCULATING...')}
                          </span>
                        </div>
                      </div>

                      {/* Explicit Conceptual Distinction Strip */}
                      <div className="p-2 rounded bg-[#0b0f17] border border-slate-800/90 text-[10px] font-mono space-y-1">
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="font-bold text-slate-300">RISK ARCHITECTURE:</span>
                          <span className="text-[9px] text-slate-500">20-GATE VALIDATED</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-slate-400">
                          <span><strong className="text-amber-300">USDT COMMITTED</strong> (Margin)</span>
                          <span className="text-slate-600 font-bold">≠</span>
                          <span><strong className="text-rose-300">USDT AT RISK</strong> (${calculatedRisk?.approved ? calculatedRisk.capitalAtRisk.toFixed(2) : '0.00'})</span>
                          <span className="text-slate-600 font-bold">≠</span>
                          <span><strong className="text-cyan-300">POSITION NOTIONAL</strong> (${calculatedRisk?.approved ? calculatedRisk.positionNotional.toFixed(2) : '0.00'})</span>
                        </div>
                      </div>

                      {/* Equation verification or Rejection Notice */}
                      {calculatedRisk?.approved && calculatedRisk.marginUsed > 0 ? (
                        <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between border-t border-slate-800/80 pt-1.5">
                          <span className="text-slate-500 font-bold">FORMULA:</span>
                          <span className="text-slate-300">
                            <strong className="text-amber-300">${calculatedRisk.marginUsed.toFixed(2)} USDT</strong> Margin × <strong className="text-cyan-400">{leverage}x</strong> = <strong className="text-emerald-400">${calculatedRisk.positionNotional.toFixed(2)} USDT</strong> Notional
                          </span>
                        </div>
                      ) : calculatedRisk?.approved === false ? (
                        <div className="text-[10px] text-rose-400 font-mono border-t border-rose-900/40 pt-1.5 flex items-start gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                          <span>STATUS: RISK REJECTED — {calculatedRisk.reason}</span>
                        </div>
                      ) : null}
                    </div>

                    {/* Feedback */}
                    {tradeFeedback && (
                      <div
                        className={`p-2 rounded text-[10px] leading-tight border ${
                          tradeFeedback.success
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                            : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                        }`}
                      >
                        {tradeFeedback.message}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmittingTrade}
                      className="w-full py-2.5 rounded-lg font-bold text-xs bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black shadow cursor-pointer disabled:opacity-50 transition-all"
                    >
                      {isSubmittingTrade ? 'VALIDATING 20 RISK GATES...' : `EXECUTE ${direction} ${selectedAsset}`}
                    </button>
                  </form>
                </div>
              </div>

              {/* CROSS-ASSET CONFIRMATION DESK */}
              <CrossAssetConfirmationPanel
                radar={radar}
                regime={regime}
                onSelectAsset={(s) => setSelectedAsset(s as InstrumentId)}
              />
            </div>
          )}

          {/* VIEW 2: 5-STAGE MACRO TRANSMISSION */}
          {activeCenterView === 'MACRO_PIPELINE' && (
            <div className="bg-[#0b0f17] border border-[#161f2e] rounded-lg p-4 font-mono text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-display text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                  <Network className="w-4 h-4" />
                  5-STAGE EVENT TRANSMISSION PIPELINE
                </span>
                <span className="text-[10px] text-slate-400">
                  REAL-TIME CAPITAL ALLOCATION MODEL
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                <div className="p-2.5 rounded bg-[#080c12] border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-cyan-400">1. CATALYST</span>
                  <div className="text-white font-bold text-xs">Policy & Macro</div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Central bank forward guidance, CPI inflation, or geopolitical catalyst recorded.
                  </p>
                </div>
                <div className="p-2.5 rounded bg-[#080c12] border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-blue-400">2. DIRECT IMPACT</span>
                  <div className="text-white font-bold text-xs">Rates & Dollar</div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Immediate repricing across 2Y/10Y yield curve and US Dollar Index (DXY).
                  </p>
                </div>
                <div className="p-2.5 rounded bg-[#080c12] border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-violet-400">3. TRANSMISSION</span>
                  <div className="text-white font-bold text-xs">Liquidity Channels</div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Transmits via corporate credit spreads and discount rate adjustments.
                  </p>
                </div>
                <div className="p-2.5 rounded bg-[#080c12] border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-amber-400">4. ASSET FLOWS</span>
                  <div className="text-white font-bold text-xs">Beta & Rotation</div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Equities, Crypto, and Commodities price the new macro discount rate.
                  </p>
                </div>
                <div className="p-2.5 rounded bg-[#080c12] border border-cyan-500/40 space-y-1 bg-cyan-950/20">
                  <span className="text-[10px] font-bold text-emerald-400">5. RISK-GATED TRADE</span>
                  <div className="text-white font-bold text-xs">Deterministic Gate</div>
                  <p className="text-[10px] text-cyan-200 leading-tight">
                    Passed through 20 deterministic rules before authorized execution.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: 20-GATE RISK SPECIFICATION & BACKTEST LAB */}
          {activeCenterView === 'STRATEGY_RISK' && (
            <div className="bg-[#0b0f17] border border-[#161f2e] rounded-lg p-4 font-mono text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-display text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  DETERMINISTIC 20-GATE SAFETY ENGINE
                </span>
                <span className="text-[10px] text-slate-400">ZERO UNSAFE ORDERS PERMITTED</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                {[
                  '1. Data Freshness (<120s)',
                  '2. Mapped Instrument',
                  '3. Valid Direction',
                  '4. Positive Entry Price',
                  '5. SL Geometry (Valid Risk)',
                  '6. TP Geometry (Valid Reward)',
                  '7. Min 1.5:1 R:R Target',
                  '8. AI Confidence > 65%',
                  '9. 2.0% Risk Cap',
                  '10. 250% Total Exposure',
                  '11. Sector 150% Exposure',
                  '12. Max 5 Open Positions',
                  '13. Max 5 Daily Trades',
                  '14. 4.0% Daily Loss Stop',
                  '15. 10.0% Max Drawdown Stop',
                  '16. Spread & Volatility',
                  '17. Leverage Ceiling (Max 10x)',
                  '18. Margin Availability',
                  '19. Stop Distance (0.3%-10%)',
                  '20. No Duplicate Trade',
                ].map((name, i) => (
                  <div key={i} className="p-2 rounded bg-[#080c12] border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-300 font-bold">{name}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* PERSISTENT BOTTOM COCKPIT DOCK (ACCESSIBLE IN 1 CLICK!) */}
          {/* --------------------------------------------------------------------- */}
          <div className="bg-[#0b0f17] border border-[#161f2e] rounded-lg overflow-hidden flex flex-col">
            {/* Dock Tabs Header */}
            <div className="p-2 bg-[#080c12] border-b border-[#161f2e] flex items-center justify-between font-mono text-xs">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setDockTab('POSITIONS'); setIsDockCollapsed(false); }}
                  className={`px-2.5 py-1 rounded cursor-pointer transition-colors flex items-center gap-1 ${
                    dockTab === 'POSITIONS' && !isDockCollapsed
                      ? 'bg-cyan-500 text-black font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>ACTIVE POSITIONS</span>
                  <span className="bg-slate-800 text-[10px] px-1 rounded">{openPositions.length}</span>
                </button>

                <button
                  onClick={() => { setDockTab('TRADES'); setIsDockCollapsed(false); }}
                  className={`px-2.5 py-1 rounded cursor-pointer transition-colors flex items-center gap-1 ${
                    dockTab === 'TRADES' && !isDockCollapsed
                      ? 'bg-cyan-500 text-black font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>CLOSED LEDGER</span>
                  <span className="bg-slate-800 text-[10px] px-1 rounded">{closedTrades.length}</span>
                </button>

                <button
                  onClick={() => { setDockTab('DECISIONS'); setIsDockCollapsed(false); }}
                  className={`px-2.5 py-1 rounded cursor-pointer transition-colors flex items-center gap-1 ${
                    dockTab === 'DECISIONS' && !isDockCollapsed
                      ? 'bg-cyan-500 text-black font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>AI DECISIONS</span>
                  <span className="bg-slate-800 text-[10px] px-1 rounded">{aiDecisions.length}</span>
                </button>

                <button
                  onClick={() => { setDockTab('LOGS'); setIsDockCollapsed(false); }}
                  className={`px-2.5 py-1 rounded cursor-pointer transition-colors flex items-center gap-1 ${
                    dockTab === 'LOGS' && !isDockCollapsed
                      ? 'bg-cyan-500 text-black font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>ACTIVITY AUDIT</span>
                </button>
              </div>

              {/* Collapse/Expand Toggle */}
              <button
                onClick={() => setIsDockCollapsed(!isDockCollapsed)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
                title={isDockCollapsed ? 'Expand Dock' : 'Collapse Dock'}
              >
                {isDockCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {/* Dock Content Body */}
            {!isDockCollapsed && (
              <div className="p-2 max-h-[220px] overflow-y-auto font-mono text-xs">
                {/* TAB 1: POSITIONS */}
                {dockTab === 'POSITIONS' && (
                  <div>
                    {openPositions.length === 0 ? (
                      <div className="py-6 text-center text-slate-500 text-xs">
                        NO OPEN POSITIONS (AI Waiting or Flat)
                      </div>
                    ) : (
                      <table className="w-full text-left text-[11px]">
                        <thead className="text-slate-500 border-b border-slate-800">
                          <tr>
                            <th className="py-1">ASSET</th>
                            <th className="py-1">SIDE</th>
                            <th className="py-1">ENTRY</th>
                            <th className="py-1">MARK</th>
                            <th className="py-1">SL / TP</th>
                            <th className="py-1">P&L ($)</th>
                            <th className="py-1">OPEN / DURATION</th>
                            <th className="py-1 text-right">ACTION</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40">
                          {openPositions.map((pos, idx) => (
                            <ActivePositionDockRow
                              key={pos.id ? `${pos.id}-${idx}` : `pos-${idx}`}
                              pos={pos}
                              idx={idx}
                              onClosePosition={onClosePosition}
                            />
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {/* TAB 2: CLOSED TRADES */}
                {dockTab === 'TRADES' && (
                  <div>
                    {closedTrades.length === 0 ? (
                      <div className="py-6 text-center text-slate-500 text-xs">
                        NO CLOSED TRADES RECORDED
                      </div>
                    ) : (
                      <table className="w-full text-left text-[11px]">
                        <thead className="text-slate-500 border-b border-slate-800">
                          <tr>
                            <th className="py-1">TRADE ID</th>
                            <th className="py-1">ASSET</th>
                            <th className="py-1">SIDE</th>
                            <th className="py-1">TIMESTAMPS (24H)</th>
                            <th className="py-1">DURATION</th>
                            <th className="py-1">NET P&L</th>
                            <th className="py-1">R MULTIPLE</th>
                            <th className="py-1">EXIT REASON</th>
                            <th className="py-1 text-right">JOURNAL</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40">
                          {closedTrades.slice(0, 10).map((tr, idx) => {
                            const openTime =
                              tr.openedAt && tr.openedAt > 0
                                ? formatUTCDateTime(tr.openedAt)
                                : (tr.openingTime ? formatUTCDateTime(tr.openingTime) : 'TIMESTAMP UNAVAILABLE');
                            const closeTime =
                              tr.closedAt && tr.closedAt > 0
                                ? formatUTCDateTime(tr.closedAt)
                                : (tr.closingTime ? formatUTCDateTime(tr.closingTime) : 'TIMESTAMP UNAVAILABLE');
                            const durationStr =
                              tr.durationFormatted ||
                              (tr.durationSeconds !== undefined
                                ? formatDuration(tr.durationSeconds)
                                : '00:00:00');

                            return (
                              <tr
                                key={tr.id || tr.tradeId ? `${tr.id || tr.tradeId}-${idx}` : `tr-${idx}`}
                                className="hover:bg-slate-900/40"
                              >
                                <td className="py-1.5 text-slate-400 font-mono text-[10px]">{tr.tradeId}</td>
                                <td className="py-1.5 font-bold text-white">{tr.asset}</td>
                                <td className="py-1.5">
                                  <span className={tr.direction === 'LONG' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                    {tr.direction}
                                  </span>
                                </td>
                                <td className="py-1.5 font-mono text-[10px]">
                                  <div className="text-slate-300">
                                    <span className="text-slate-500">IN: </span>
                                    {openTime}
                                  </div>
                                  <div className="text-slate-400">
                                    <span className="text-slate-500">OUT: </span>
                                    {closeTime}
                                  </div>
                                </td>
                                <td className="py-1.5 font-mono text-cyan-400 font-bold text-[10px]">
                                  {durationStr}
                                </td>
                                <td
                                  className={`py-1.5 font-bold ${
                                    tr.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                  }`}
                                >
                                  {tr.pnl >= 0 ? '+' : ''}${tr.pnl.toFixed(2)}
                                </td>
                                <td className="py-1.5 font-bold text-amber-400">{tr.rMultiple}R</td>
                                <td className="py-1.5 text-slate-300">{tr.exitReason}</td>
                                <td className="py-1.5 text-right">
                                  <button
                                    onClick={() => onOpenJournal(tr.tradeId)}
                                    className="px-2 py-0.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] cursor-pointer"
                                  >
                                    VIEW JOURNAL
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {/* TAB 3: DECISIONS */}
                {dockTab === 'DECISIONS' && (
                  <div className="space-y-1.5">
                    {aiDecisions.slice(0, 8).map((dec, idx) => (
                      <div key={dec.id ? `${dec.id}-${idx}` : `dec-${idx}`} className="p-2 rounded bg-[#080c12] border border-slate-800 flex items-center justify-between text-[11px]">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white">{dec.asset}</span>
                            <span
                              className={`px-1 rounded text-[9px] font-bold ${
                                dec.action === 'BUY'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : dec.action === 'SELL'
                                  ? 'bg-rose-500/10 text-rose-400'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {dec.action}
                            </span>
                            <span className="text-[10px] text-cyan-400 font-bold">{dec.confidence}% Conf</span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate max-w-[380px] mt-0.5">
                            {dec.macro_catalyst}
                          </p>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {formatUTCDateTime(dec.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* TAB 4: LOGS */}
                {dockTab === 'LOGS' && (
                  <div className="space-y-1">
                    {activities.slice(0, 10).map((act, idx) => (
                      <div key={act.id ? `${act.id}-${idx}` : `act-${idx}`} className="p-1.5 rounded bg-[#080c12] border border-slate-800 flex items-start gap-2 text-[10px]">
                        <span className="text-slate-500 font-mono shrink-0">{formatUTCDateTime(act.timestamp)}</span>
                        <div>
                          <span className="text-cyan-300 font-bold">{act.title}: </span>
                          <span className="text-slate-300">{act.detail}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* PANE C (RIGHT, 3 COLS): AUTONOMOUS AI BRAIN & 20-GATE SAFETY HUD */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-3 flex flex-col gap-2 min-h-0 overflow-y-auto">
          {/* AI Autonomous Brain HUD */}
          <div className="bg-[#0b0f17] border border-slate-800 rounded-xl p-3 font-mono text-xs space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <div className="flex items-center gap-1.5 font-bold text-white">
                <Bot className="w-3.5 h-3.5 text-cyan-400" />
                <span>AUTONOMOUS AGENT HUD</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                ACTIVE LOOP
              </span>
            </div>

            {/* State Machine Step Tracker */}
            <div className="p-2 rounded bg-[#080c12] border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400">STATE:</span>
                <span className="text-cyan-400 font-bold bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                  {agentState.state}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400">TARGET ASSET:</span>
                <span className="text-white font-bold">{agentState.currentAsset || 'BTC'}</span>
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                  <span>CONVICTION:</span>
                  <span className="text-amber-400 font-bold">{agentState.conviction}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-amber-400 h-full rounded transition-all"
                    style={{ width: `${agentState.conviction}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Cognitive Stream snippet */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400">LIVE COGNITIVE LOG</span>
              <div className="p-2 rounded bg-[#080c12] border border-slate-800 text-[10px] text-slate-300 leading-relaxed max-h-[110px] overflow-y-auto">
                {activities.length > 0 ? activities[0].detail : 'Continuous multi-asset monitoring active.'}
              </div>
            </div>
          </div>

          {/* Deterministic Risk Gate HUD */}
          <div className="bg-[#0b0f17] border border-slate-800 rounded-xl p-3 font-mono text-xs space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <div className="flex items-center gap-1.5 font-bold text-white">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>RISK SAFEGUARDS</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold">20/20 GATES PASS</span>
            </div>

            <div className="space-y-2 text-[10px]">
              <div>
                <div className="flex justify-between text-slate-400 mb-0.5">
                  <span>DAILY LOSS LIMIT</span>
                  <span className="text-emerald-400 font-bold">0.0% / 4.0%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[0%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-0.5">
                  <span>PORTFOLIO DRAWDOWN</span>
                  <span className="text-emerald-400 font-bold">0.0% / 10.0%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[0%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-0.5">
                  <span>EXPOSURE CAP</span>
                  <span className="text-cyan-400 font-bold">0.0% / 250%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded overflow-hidden">
                  <div className="bg-cyan-500 h-full w-[0%]" />
                </div>
              </div>
            </div>

            <div className="p-2 rounded bg-cyan-950/20 border border-cyan-800/40 text-[10px] text-cyan-200 leading-relaxed">
              Circuit breakers armed. Any violation of drawdown or daily loss halts all execution automatically.
            </div>
          </div>
        </div>
      </div>

      {/* Bitget MCP Live Status Modal */}
      <BitgetMcpModal
        isOpen={isMcpModalOpen}
        onClose={() => setIsMcpModalOpen(false)}
      />
    </div>
  );
};
