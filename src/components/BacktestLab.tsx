import React, { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Database,
  Download,
  Filter,
  Layers,
  RefreshCw,
  Scale,
  Search,
  ShieldCheck,
  TrendingUp,
  Zap,
} from 'lucide-react';
import {
  BacktestRecord,
  HistoricalRoundTripTrade,
  HistoricalValidationRun,
  InstrumentId,
} from '../types.js';
import { formatUTCDateTime } from '../utils/timeFormat.js';

interface ComparisonItem {
  metric: string;
  historicalBacktest: string;
  currentPaper: string;
  targetExpectation: string;
  category: 'OBSERVED' | 'ESTIMATED' | 'TARGET';
}

export const BacktestLab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'VALIDATION' | 'OVERVIEW'>('VALIDATION');
  const [validationRun, setValidationRun] = useState<HistoricalValidationRun | null>(null);
  const [backtest, setBacktest] = useState<BacktestRecord | null>(null);
  const [comparison, setComparison] = useState<ComparisonItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [runningValidation, setRunningValidation] = useState(false);

  // Table filters & pagination
  const [selectedAsset, setSelectedAsset] = useState<string>('ALL');
  const [selectedDirection, setSelectedDirection] = useState<'ALL' | 'LONG' | 'SHORT'>('ALL');
  const [selectedOutcome, setSelectedOutcome] = useState<'ALL' | 'WIN' | 'LOSS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'ID' | 'DATE' | 'PNL' | 'RETURN' | 'DURATION'>('ID');
  const [sortAsc, setSortAsc] = useState(true);
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [backtestRes, valRes] = await Promise.all([
        fetch('/api/backtest'),
        fetch('/api/backtest/historical-validation'),
      ]);

      if (backtestRes.ok) {
        const bData = await backtestRes.json();
        setBacktest(bData.records?.[0] || null);
        setComparison(bData.comparison || []);
      }

      if (valRes.ok) {
        const vData: HistoricalValidationRun = await valRes.json();
        setValidationRun(vData);
      }
    } catch (err) {
      console.error('Failed to load backtest data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunFreshValidation = async () => {
    setRunningValidation(true);
    try {
      const res = await fetch('/api/backtest/run-validation', { method: 'POST' });
      if (res.ok) {
        const vData: HistoricalValidationRun = await res.json();
        setValidationRun(vData);
        // Also refresh comparison
        const bRes = await fetch('/api/backtest');
        if (bRes.ok) {
          const bData = await bRes.json();
          setBacktest(bData.records?.[0] || null);
          setComparison(bData.comparison || []);
        }
      }
    } catch (err) {
      console.error('Failed to run validation:', err);
    } finally {
      setRunningValidation(false);
    }
  };

  const riskRules = [
    { id: 1, name: 'Data Freshness Gate', desc: 'Quote timestamps must be < 120s old and status AVAILABLE.' },
    { id: 2, name: 'Instrument Verification', desc: 'Asset must be mapped in active 24-instrument universe.' },
    { id: 3, name: 'Direction Validity', desc: 'Only LONG or SHORT signals authorized.' },
    { id: 4, name: 'Entry Price Sanity', desc: 'Positive, finite entry price matching mark price.' },
    { id: 5, name: 'Stop Loss Geometry', desc: 'LONG: SL < Entry. SHORT: SL > Entry. No inverted geometry.' },
    { id: 6, name: 'Take Profit Geometry', desc: 'LONG: TP > Entry. SHORT: TP < Entry.' },
    { id: 7, name: 'Minimum R:R Threshold', desc: 'Mandatory minimum 1.5:1 R:R, target 2.15:1.' },
    { id: 8, name: 'AI Confidence Filter', desc: 'Minimum 65% confidence required for autonomous orders.' },
    { id: 9, name: 'Per-Trade Risk Cap', desc: 'Risk amount capped at 2.0% of portfolio equity.' },
    { id: 10, name: 'Portfolio Total Exposure', desc: 'Total notional exposure capped at 250% of equity.' },
    { id: 11, name: 'Correlated Sector Cap', desc: 'Max 150% notional exposure in any single sector.' },
    { id: 12, name: 'Max Open Positions', desc: 'Maximum 5 concurrent open positions strictly enforced.' },
    { id: 13, name: 'Position Recycling & Anti-Overtrade', desc: 'Strict max 5 concurrent open positions. Unlimited daily valid trades. Dynamic slot recycling with intelligent anti-revenge.' },
    { id: 14, name: 'Daily Loss Circuit Breaker', desc: 'Halt all trading if daily loss reaches 4.0%.' },
    { id: 15, name: 'Max Drawdown Circuit Breaker', desc: 'Halt all trading if total portfolio drawdown reaches 10.0%.' },
    { id: 16, name: 'Volatility & Spread Safety', desc: 'Validates spread within safety threshold.' },
    { id: 17, name: 'Instrument Leverage Ceiling', desc: 'Caps leverage to asset maximum (max 10x).' },
    { id: 18, name: 'Margin Availability Check', desc: 'Required margin must not exceed available margin.' },
    { id: 19, name: 'Stop Distance Validation', desc: 'Stop loss distance must be between 0.3% and 10%.' },
    { id: 20, name: 'Duplicate Position Prevention', desc: 'Rejects duplicate positions in same asset and direction.' },
  ];

  // Trade filtering & sorting
  const trades = validationRun?.trades || [];
  const uniqueAssets = Array.from(new Set(trades.map((t) => t.asset))).sort();

  const filteredTrades = trades.filter((t) => {
    if (selectedAsset !== 'ALL' && t.asset !== selectedAsset) return false;
    if (selectedDirection !== 'ALL' && t.direction !== selectedDirection) return false;
    if (selectedOutcome === 'WIN' && t.realizedPnl <= 0) return false;
    if (selectedOutcome === 'LOSS' && t.realizedPnl > 0) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.tradeId.toLowerCase().includes(q) ||
        t.asset.toLowerCase().includes(q) ||
        t.technicalRationale.toLowerCase().includes(q) ||
        t.macroContext.toLowerCase().includes(q) ||
        t.exitReason.toLowerCase().includes(q)
      );
    }
    return true;
  });

  filteredTrades.sort((a, b) => {
    let diff = 0;
    if (sortBy === 'ID') diff = a.tradeId.localeCompare(b.tradeId);
    else if (sortBy === 'DATE') diff = a.entryTimestamp - b.entryTimestamp;
    else if (sortBy === 'PNL') diff = a.realizedPnl - b.realizedPnl;
    else if (sortBy === 'RETURN') diff = a.returnPercent - b.returnPercent;
    else if (sortBy === 'DURATION') diff = a.durationSeconds - b.durationSeconds;
    return sortAsc ? diff : -diff;
  });

  const totalPages = Math.ceil(filteredTrades.length / pageSize) || 1;
  const paginatedTrades = filteredTrades.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSort = (col: 'ID' | 'DATE' | 'PNL' | 'RETURN' | 'DURATION') => {
    if (sortBy === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(col);
      setSortAsc(false);
    }
    setCurrentPage(1);
  };

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* 1. Header Banner & Tab Navigation */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-[#0d1424] via-[#10182b] to-[#0c121e] border border-cyan-500/20 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-cyan-400" />
              <h1 className="font-display text-sm font-bold tracking-wider text-cyan-400">
                MACROVEX 2.1 PRO — STRATEGY VALIDATION & BACKTEST LAB
              </h1>
            </div>
            <p className="text-xs text-slate-300 font-mono mt-1">
              Rigorous walk-forward execution of exact MacroVex 2.1 Pro strategy on real historical market data (Bitget & Yahoo Real-Time Finance).
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('VALIDATION')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all ${
                activeTab === 'VALIDATION'
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              HISTORICAL VALIDATION ({validationRun?.totalRoundTrips || '50+'} ROUND TRIPS)
            </button>
            <button
              onClick={() => setActiveTab('OVERVIEW')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all ${
                activeTab === 'OVERVIEW'
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              LIVE DRIFT & 20-GATE RISK ENGINE
            </button>
            <button
              onClick={handleRunFreshValidation}
              disabled={runningValidation}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5 hover:bg-emerald-500/20 cursor-pointer disabled:opacity-50"
              title="Re-run simulation against live real candles"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${runningValidation ? 'animate-spin' : ''}`} />
              {runningValidation ? 'SIMULATING...' : 'RE-RUN VALIDATION'}
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'VALIDATION' ? (
        <>
          {/* Historical Validation Summary Strip */}
          {validationRun && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-4 rounded-xl bg-[#0e1422] border border-cyan-500/30 font-mono text-xs shadow-lg">
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Total Round Trips</div>
                <div className="text-lg font-bold text-cyan-400 mt-0.5">
                  {validationRun.totalRoundTrips}
                </div>
                <div className="text-[10px] text-emerald-400 font-semibold">
                  {validationRun.winningTrades}W / {validationRun.losingTrades}L
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Win Rate %</div>
                <div className="text-lg font-bold text-emerald-400 mt-0.5">
                  {validationRun.winRate}%
                </div>
                <div className="text-[10px] text-slate-500">Verified Trades</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Profit Factor</div>
                <div className="text-lg font-bold text-white mt-0.5">
                  {validationRun.profitFactor}
                </div>
                <div className="text-[10px] text-slate-500">Gross Win / Loss</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Total Net P&L</div>
                <div className={`text-lg font-bold mt-0.5 ${validationRun.totalNetPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ${validationRun.totalNetPnl.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500">Fees: ${validationRun.totalFeesPaid.toLocaleString()}</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Max Drawdown %</div>
                <div className="text-lg font-bold text-amber-400 mt-0.5">
                  -{validationRun.maxDrawdownPercent}%
                </div>
                <div className="text-[10px] text-slate-500">Peak-to-Trough</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Sharpe Ratio</div>
                <div className="text-lg font-bold text-cyan-300 mt-0.5">
                  {validationRun.sharpeRatio}
                </div>
                <div className="text-[10px] text-slate-500">Rf = 4.0% p.a.</div>
              </div>
            </div>
          )}

          {/* Secondary Metrics Bar */}
          {validationRun && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-[#090d16] border border-slate-800 text-xs font-mono">
              <div className="flex items-center justify-between px-2">
                <span className="text-slate-400 text-[11px]">Avg Win vs Avg Loss:</span>
                <span className="text-white font-bold">
                  <span className="text-emerald-400">+${validationRun.avgWinDollar}</span> / <span className="text-rose-400">-${validationRun.avgLossDollar}</span>
                </span>
              </div>
              <div className="flex items-center justify-between px-2">
                <span className="text-slate-400 text-[11px]">Largest Win / Loss:</span>
                <span className="text-white font-bold">
                  <span className="text-emerald-400">+${validationRun.largestWinningTrade}</span> / <span className="text-rose-400">${validationRun.largestLosingTrade}</span>
                </span>
              </div>
              <div className="flex items-center justify-between px-2">
                <span className="text-slate-400 text-[11px]">Average Duration:</span>
                <span className="text-cyan-300 font-bold">{validationRun.averageDurationFormatted}</span>
              </div>
              <div className="flex items-center justify-between px-2">
                <span className="text-slate-400 text-[11px]">Average Risk-Reward:</span>
                <span className="text-white font-bold">{validationRun.averageRR}R (Target 2.15:1)</span>
              </div>
            </div>
          )}

          {/* Charts Row: Cumulative P&L Equity Curve + Return Distribution */}
          {validationRun && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Equity Curve (8 Cols) */}
              <div className="lg:col-span-8 p-4 rounded-xl bg-[#0e1422] border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <h2 className="font-display text-sm font-bold text-white tracking-wide">
                      CUMULATIVE P&L EQUITY CURVE ({validationRun.totalRoundTrips} REAL ROUND TRIPS)
                    </h2>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-bold">
                    Final Equity: ${validationRun.finalEquity.toLocaleString()}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-slate-400">
                  Exact mark-to-market performance from historical simulated execution starting at $100,000 capital.
                </p>

                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={validationRun.equityCurve}
                      margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="tradeIndex"
                        stroke="#64748b"
                        fontSize={10}
                        tickLine={false}
                        tickFormatter={(v) => `#${v}`}
                      />
                      <YAxis
                        stroke="#64748b"
                        fontSize={10}
                        tickLine={false}
                        domain={['auto', 'auto']}
                        tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#090d16',
                          borderColor: '#334155',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontFamily: 'monospace',
                        }}
                        formatter={(val: any, name: any) => [
                          `$${Number(val).toLocaleString()}`,
                          name === 'equity' ? 'Portfolio Equity' : 'Cumulative P&L',
                        ]}
                        labelFormatter={(label: any) => `Trade #${label}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="equity"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#equityGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Return Distribution Histogram (4 Cols) */}
              <div className="lg:col-span-4 p-4 rounded-xl bg-[#0e1422] border border-slate-800/80 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-cyan-400" />
                    <h2 className="font-display text-sm font-bold text-white tracking-wide">
                      RETURN DISTRIBUTION
                    </h2>
                  </div>
                  <p className="text-[11px] font-mono text-slate-400 mt-1">
                    Frequency count of closed round-trip returns by percentage bucket.
                  </p>
                </div>

                <div className="h-44 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={validationRun.returnDistribution}
                      margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                    >
                      <XAxis dataKey="bin" stroke="#64748b" fontSize={9} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={9} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#090d16',
                          borderColor: '#334155',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontFamily: 'monospace',
                        }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {validationRun.returnDistribution.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.isWin ? '#10b981' : '#f43f5e'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400">
                  <div>
                    Strategy R:R: <span className="text-white font-bold">2.15:1 Target</span>
                  </div>
                  <div>
                    Stop Distance: <span className="text-white font-bold">1.60% Strict</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Trade Log Table with Sorting, Filters, Search, and Expandable Rows */}
          <div className="p-4 rounded-xl bg-[#0e1422] border border-slate-800/80 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-sm font-bold text-white tracking-wide flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  VERIFIED HISTORICAL TRADE LOG ({filteredTrades.length} TRADES MATCHED)
                </h2>
                <p className="text-xs font-mono text-slate-400 mt-0.5">
                  Click any row to inspect the complete Technical Rationale, Macro Context, and 20-Gate Risk Engine verification.
                </p>
              </div>

              {/* Filters & Search */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search asset, rationale..."
                    className="pl-8 pr-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Asset Filter */}
                <select
                  value={selectedAsset}
                  onChange={(e) => {
                    setSelectedAsset(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">ALL ASSETS ({uniqueAssets.length})</option>
                  {uniqueAssets.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>

                {/* Direction Filter */}
                <select
                  value={selectedDirection}
                  onChange={(e) => {
                    setSelectedDirection(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-white focus:outline-none cursor-pointer"
                >
                  <option value="ALL">ALL DIRECTIONS</option>
                  <option value="LONG">LONG ONLY</option>
                  <option value="SHORT">SHORT ONLY</option>
                </select>

                {/* Outcome Filter */}
                <select
                  value={selectedOutcome}
                  onChange={(e) => {
                    setSelectedOutcome(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-white focus:outline-none cursor-pointer"
                >
                  <option value="ALL">ALL OUTCOMES</option>
                  <option value="WIN">WINNING TRADES ONLY</option>
                  <option value="LOSS">LOSING TRADES ONLY</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-[#090d14] text-slate-400 text-[11px] border-b border-slate-800 select-none">
                  <tr>
                    <th className="py-2.5 px-3 w-8"></th>
                    <th
                      onClick={() => toggleSort('ID')}
                      className="py-2.5 px-3 cursor-pointer hover:text-cyan-400"
                    >
                      TRADE ID {sortBy === 'ID' && (sortAsc ? '▲' : '▼')}
                    </th>
                    <th className="py-2.5 px-3">ASSET</th>
                    <th className="py-2.5 px-3">DIRECTION</th>
                    <th
                      onClick={() => toggleSort('DATE')}
                      className="py-2.5 px-3 cursor-pointer hover:text-cyan-400"
                    >
                      ENTRY DATE {sortBy === 'DATE' && (sortAsc ? '▲' : '▼')}
                    </th>
                    <th className="py-2.5 px-3">ENTRY / EXIT PRICE</th>
                    <th
                      onClick={() => toggleSort('RETURN')}
                      className="py-2.5 px-3 cursor-pointer hover:text-cyan-400"
                    >
                      RETURN % {sortBy === 'RETURN' && (sortAsc ? '▲' : '▼')}
                    </th>
                    <th
                      onClick={() => toggleSort('PNL')}
                      className="py-2.5 px-3 cursor-pointer hover:text-cyan-400 text-right"
                    >
                      NET P&L ($) {sortBy === 'PNL' && (sortAsc ? '▲' : '▼')}
                    </th>
                    <th className="py-2.5 px-3">EXIT REASON</th>
                    <th
                      onClick={() => toggleSort('DURATION')}
                      className="py-2.5 px-3 cursor-pointer hover:text-cyan-400 text-right"
                    >
                      DURATION {sortBy === 'DURATION' && (sortAsc ? '▲' : '▼')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {paginatedTrades.map((t) => {
                    const isExpanded = expandedTradeId === t.tradeId;
                    const isWin = t.realizedPnl > 0;
                    return (
                      <React.Fragment key={t.tradeId}>
                        <tr
                          onClick={() => setExpandedTradeId(isExpanded ? null : t.tradeId)}
                          className={`hover:bg-slate-800/40 transition-colors cursor-pointer ${
                            isExpanded ? 'bg-slate-800/30' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 text-slate-500">
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1">
                            <span className="text-cyan-400">{t.tradeId}</span>
                          </td>
                          <td className="py-2.5 px-3 font-bold text-white">{t.asset}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                t.direction === 'LONG'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              }`}
                            >
                              {t.direction}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                            {formatUTCDateTime(t.entryTimestamp)}
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">
                            ${t.entryPrice.toLocaleString()} → ${t.exitPrice.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 font-bold">
                            <span className={isWin ? 'text-emerald-400' : 'text-rose-400'}>
                              {isWin ? '+' : ''}{t.returnPercent}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-bold text-right">
                            <span className={isWin ? 'text-emerald-400' : 'text-rose-400'}>
                              {isWin ? '+' : ''}${t.realizedPnl.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                t.exitReason === 'TAKE_PROFIT'
                                  ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                                  : t.exitReason === 'STOP_LOSS'
                                  ? 'bg-rose-950/40 text-rose-300 border border-rose-500/30'
                                  : 'bg-amber-950/40 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {t.exitReason.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 text-right">
                            {t.durationFormatted}
                          </td>
                        </tr>

                        {/* Expandable Row Details */}
                        {isExpanded && (
                          <tr className="bg-[#090d16] border-b border-cyan-500/20">
                            <td colSpan={10} className="p-4 space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {/* Technical Rationale */}
                                <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
                                  <div className="text-[10px] text-cyan-400 font-bold uppercase flex items-center gap-1">
                                    <Zap className="w-3 h-3" /> Technical Rationale
                                  </div>
                                  <p className="text-xs text-slate-200 leading-relaxed">
                                    {t.technicalRationale}
                                  </p>
                                </div>

                                {/* Macro Context */}
                                <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
                                  <div className="text-[10px] text-blue-400 font-bold uppercase flex items-center gap-1">
                                    <Layers className="w-3 h-3" /> Macro Context At Entry
                                  </div>
                                  <p className="text-xs text-slate-200 leading-relaxed">
                                    {t.macroContext}
                                  </p>
                                </div>

                                {/* Risk Engine Status */}
                                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 space-y-1">
                                  <div className="text-[10px] text-emerald-400 font-bold uppercase flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3" /> Risk Engine Status
                                  </div>
                                  <div className="text-xs text-emerald-300 font-bold">
                                    PASSED 20/20 DETERMINISTIC RULES
                                  </div>
                                  <p className="text-[11px] text-slate-400 leading-tight">
                                    {t.riskEngineDetails.summary}
                                  </p>
                                </div>
                              </div>

                              {/* Geometry & Sizing Specs */}
                              <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-[11px] text-slate-300">
                                <div>
                                  <span className="text-slate-500 text-[10px] block">Position Size:</span>
                                  <span className="font-bold text-white">{t.positionSize} units</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 text-[10px] block">Notional Value:</span>
                                  <span className="font-bold text-white">${t.notionalValue.toLocaleString()}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 text-[10px] block">Stop Loss (SL):</span>
                                  <span className="font-bold text-rose-400">${t.entrySl.toLocaleString()}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 text-[10px] block">Take Profit (TP):</span>
                                  <span className="font-bold text-emerald-400">${t.entryTp.toLocaleString()}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 text-[10px] block">Risk-Reward:</span>
                                  <span className="font-bold text-cyan-300">{t.rr}:1</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 text-[10px] block">Leverage:</span>
                                  <span className="font-bold text-white">{t.leverage}x</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 text-[10px] block">Fees Paid:</span>
                                  <span className="font-bold text-amber-400">${t.feesPaid}</span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs font-mono text-slate-400">
              <div>
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, filteredTrades.length)} of {filteredTrades.length} trades
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:text-white disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </button>
                <span className="text-white">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:text-white disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* TAB 2: OVERVIEW & 20-GATE RISK ENGINE */}
          {/* 2. Walk-Forward Backtest Metrics Strip */}
          {backtest && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 p-4 rounded-xl bg-[#0e1422] border border-slate-800/80 font-mono text-xs">
              <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 text-[10px]">NET RETURN</span>
                <div className="text-base font-bold text-emerald-400 mt-0.5">+{backtest.netReturn}%</div>
                <div className="text-[10px] text-slate-500">365-Day Window</div>
              </div>

              <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 text-[10px]">WIN RATE</span>
                <div className="text-base font-bold text-cyan-400 mt-0.5">{backtest.winRate}%</div>
                <div className="text-[10px] text-slate-500">{backtest.totalTrades} Total Trades</div>
              </div>

              <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 text-[10px]">PROFIT FACTOR</span>
                <div className="text-base font-bold text-white mt-0.5">{backtest.profitFactor}</div>
                <div className="text-[10px] text-slate-500">Gross Win / Gross Loss</div>
              </div>

              <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 text-[10px]">MAX DRAWDOWN</span>
                <div className="text-base font-bold text-amber-400 mt-0.5">-{backtest.maxDrawdown}%</div>
                <div className="text-[10px] text-slate-500">Cap: -10.0%</div>
              </div>

              <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 text-[10px]">SHARPE / SORTINO</span>
                <div className="text-base font-bold text-white mt-0.5">
                  {backtest.sharpe} / {backtest.sortino}
                </div>
                <div className="text-[10px] text-slate-500">Rf = 4.0%</div>
              </div>

              <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 text-[10px]">AVG R:R & HOLD</span>
                <div className="text-base font-bold text-cyan-300 mt-0.5">
                  {backtest.averageRR}R • {backtest.averageHoldingTime}
                </div>
                <div className="text-[10px] text-slate-500">Avg Duration</div>
              </div>
            </div>
          )}

          {/* 3. Live Paper vs Historical Backtest Comparison Table */}
          <div className="p-4 rounded-xl bg-[#0e1422] border border-slate-800/80">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-cyan-400" />
                <h2 className="font-display text-sm font-bold text-white tracking-wide">
                  LIVE PAPER VS HISTORICAL BACKTEST PERFORMANCE
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Audit of Strategy Calibration & Drift
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-[#090d14] text-slate-400 text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">METRIC</th>
                    <th className="py-2.5 px-3">HISTORICAL BACKTEST</th>
                    <th className="py-2.5 px-3">CURRENT LIVE PAPER</th>
                    <th className="py-2.5 px-3">TARGET EXPECTATION</th>
                    <th className="py-2.5 px-3 text-right">TAG</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {comparison.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-white">{row.metric}</td>
                      <td className="py-2.5 px-3 text-cyan-300">{row.historicalBacktest}</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-bold">{row.currentPaper}</td>
                      <td className="py-2.5 px-3 text-slate-400">{row.targetExpectation}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            row.category === 'OBSERVED'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : row.category === 'ESTIMATED'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {row.category}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. The 20 Deterministic Risk Engine Gates */}
          <div className="p-4 rounded-xl bg-[#0e1422] border border-slate-800/80">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h2 className="font-display text-sm font-bold text-white tracking-wide">
                  DETERMINISTIC 20-RULE RISK ENGINE SPECIFICATION
                </h2>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                ALL 20 GATES ENFORCED BEFORE ANY EXECUTION
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5 font-mono text-xs">
              {riskRules.map((rule) => (
                <div
                  key={rule.id}
                  className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-[11px] flex items-center gap-1">
                      <span className="text-cyan-400">#{rule.id}</span> {rule.name}
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">{rule.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
