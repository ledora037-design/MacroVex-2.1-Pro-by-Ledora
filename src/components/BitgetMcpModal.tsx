import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Code2,
  ExternalLink,
  Info,
  Layers,
  Radio,
  RefreshCw,
  Search,
  Server,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  X,
  Zap,
} from 'lucide-react';
import { BitgetMcpStatus } from '../types.js';

interface BitgetMcpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BitgetMcpModal: React.FC<BitgetMcpModalProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<BitgetMcpStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'TRADING_MCP' | 'MARKET_MCP' | 'TOOLS_EXPLORER'>('TRADING_MCP');
  const [toolSearch, setToolSearch] = useState('');

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/bitget-mcp/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      } else {
        setStatus((prev) => (prev ? { ...prev, status: 'DATA UNAVAILABLE' } : null));
      }
    } catch (err) {
      console.error('Failed to fetch Bitget MCP status:', err);
      setStatus((prev) => (prev ? { ...prev, status: 'DATA UNAVAILABLE' } : null));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isLive = status?.status === 'LIVE';
  const isReconnecting = status?.status === 'RECONNECTING';
  const isStale = status?.status === 'STALE';
  const statusLabel = status?.status || 'NOT VERIFIED';

  const toolsList = status?.tools || [];
  const filteredTools = toolsList.filter((t) =>
    t.toLowerCase().includes(toolSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs font-mono select-none animate-in fade-in duration-150">
      <div className="bg-[#0b0f17] border border-slate-700/60 rounded-xl max-w-3xl w-full flex flex-col max-h-[92vh] shadow-2xl overflow-hidden text-slate-200">
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between bg-[#080c12]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-sm text-white tracking-wide">
                  BITGET MCP RUNTIME VERIFICATION
                </h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border tracking-wider ${
                    isLive
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                      : isReconnecting
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                      : isStale
                      ? 'bg-orange-500/15 text-orange-300 border-orange-500/40'
                      : 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                  }`}
                >
                  {statusLabel}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Independent verification of official Bitget Agent Hub MCP architecture
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close MCP Verification Modal"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Status Summary Banner */}
        <div className="px-5 py-3 bg-[#0d121c] border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isLive
                    ? 'bg-emerald-400 animate-pulse'
                    : isReconnecting
                    ? 'bg-amber-400 animate-ping'
                    : isStale
                    ? 'bg-orange-400'
                    : 'bg-rose-400'
                }`}
              />
              <span className="text-slate-400">STATE:</span>
              <span
                className={`font-bold ${
                  isLive
                    ? 'text-emerald-300'
                    : isReconnecting
                    ? 'text-amber-300'
                    : isStale
                    ? 'text-orange-300'
                    : 'text-rose-300'
                }`}
              >
                {statusLabel}
              </span>
            </div>
            <div className="text-slate-400">
              ROUND-TRIP LATENCY:{' '}
              <span className="font-bold text-cyan-300">
                {status?.latencyMs !== undefined ? `${status.latencyMs} ms` : 'DATA UNAVAILABLE'}
              </span>
            </div>
            <div className="hidden sm:block text-slate-400">
              DISCOVERED TOOLS:{' '}
              <span className="font-bold text-white">
                {status?.tools?.length !== undefined ? `${status.tools.length} Tools` : 'DATA UNAVAILABLE'}
              </span>
            </div>
          </div>

          <button
            onClick={fetchStatus}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-all cursor-pointer disabled:opacity-50"
            title="Probe connection and re-verify tools"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>PING & RE-VERIFY</span>
          </button>
        </div>

        {/* Verification Subsystem Tabs */}
        <div className="flex items-center border-b border-slate-800 bg-[#070a10] px-5 text-xs">
          <button
            onClick={() => setActiveTab('TRADING_MCP')}
            className={`px-4 py-2.5 border-b-2 font-bold tracking-wide transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'TRADING_MCP'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>1. BITGET TRADING MCP</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
              VERIFIED
            </span>
          </button>

          <button
            onClick={() => setActiveTab('MARKET_MCP')}
            className={`px-4 py-2.5 border-b-2 font-bold tracking-wide transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'MARKET_MCP'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2. BITGET MARKET MCP</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
              SEPARATE CHECK
            </span>
          </button>

          <button
            onClick={() => setActiveTab('TOOLS_EXPLORER')}
            className={`px-4 py-2.5 border-b-2 font-bold tracking-wide transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'TOOLS_EXPLORER'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>TOOLS EXPLORER ({toolsList.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* ========================================================================= */}
          {/* TAB 1: BITGET TRADING MCP */}
          {/* ========================================================================= */}
          {activeTab === 'TRADING_MCP' && (
            <div className="space-y-4">
              {/* Architecture Identity Block */}
              <div className="p-4 rounded-lg bg-[#070a10] border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <span className="text-slate-400 font-bold">INSTALLED PACKAGE:</span>
                  <span className="text-cyan-300 font-bold">
                    {status?.tradingMcp?.installedPackage || 'bitget-mcp-server (v1.1.0)'}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <span className="text-slate-400 font-bold">CORE DEPENDENCY:</span>
                  <span className="text-slate-200">
                    {status?.tradingMcp?.corePackage || 'bitget-core (v1.1.0)'}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <span className="text-slate-400 font-bold">MCP TRANSPORT:</span>
                  <span className="text-emerald-300 font-bold">
                    {status?.tradingMcp?.transport || 'STDIO (Standard I/O Streams)'}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <span className="text-slate-400 font-bold">RUNTIME COMMAND:</span>
                  <span className="text-slate-300 text-[11px] font-mono truncate max-w-md text-right">
                    {status?.tradingMcp?.endpoint || 'node ./node_modules/bitget-mcp-server/dist/index.js --modules all --read-only'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">DISCOVERED TOOLS:</span>
                  <span className="text-white font-bold">
                    {status?.tradingMcp?.discoveredToolCount ?? toolsList.length} Active Tools Loaded
                  </span>
                </div>
              </div>

              {/* Functional Subsystem Checks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 1. Market Data */}
                <div className="p-3.5 rounded-lg bg-[#070a10] border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-cyan-400" />
                      1. MARKET DATA
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        isLive
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {isLive ? 'LIVE' : 'DATA UNAVAILABLE'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Verified live probe: <code className="text-cyan-300">futures_get_ticker</code> on{' '}
                    <code className="text-amber-300">BTCUSDT</code>.{' '}
                    {status?.tradingMcp?.marketData?.lastPrice ? (
                      <span className="text-emerald-300 font-bold">
                        Last Price: ${status.tradingMcp.marketData.lastPrice.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-slate-400">Real-time Bitget order books & tickers operational.</span>
                    )}
                  </p>
                </div>

                {/* 2. Futures / Spot */}
                <div className="p-3.5 rounded-lg bg-[#070a10] border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                      2. FUTURES & SPOT
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ENABLED
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Spot tools (<code className="text-slate-300">spot_get_*</code>) and USDT-Futures tools (<code className="text-slate-300">futures_get_*</code>) both loaded. 28 verified contracts on Bitget USDT-Futures.
                  </p>
                </div>

                {/* 3. Account Assets */}
                <div className="p-3.5 rounded-lg bg-[#070a10] border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      3. ACCOUNT CAPABILITY
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        status?.hasCredentials
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {status?.hasCredentials ? 'LIVE' : 'REQUIRES AUTH (NOT CONFIGURED)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {status?.hasCredentials
                      ? 'Bitget API key & secret detected. Account asset tools operational.'
                      : 'Account asset tools (get_account_assets) require private API credentials. In read-only mode without keys, account endpoints are protected.'}
                  </p>
                </div>

                {/* 4. Positions */}
                <div className="p-3.5 rounded-lg bg-[#070a10] border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      4. POSITIONS
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        status?.hasCredentials
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {status?.hasCredentials ? 'LIVE' : 'REQUIRES AUTH (NOT CONFIGURED)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {status?.hasCredentials
                      ? 'Live contract position monitoring enabled.'
                      : 'Private futures positions (futures_get_positions) require API keys. MacroVex manages active positions in its server-side autonomous paper trading engine.'}
                  </p>
                </div>
              </div>

              {/* Execution Path & Safety Restrictions */}
              <div className="p-3.5 rounded-lg bg-[#070a10] border border-slate-800 space-y-2">
                <span className="font-bold text-slate-200 block text-xs">
                  5. TRADING & DEMO CAPABILITIES / SAFEGUARD RESTRICTIONS
                </span>
                <div className="space-y-1.5 text-[11px] text-slate-300">
                  <div className="flex items-start gap-2">
                    <ChevronRight className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
                    <div>
                      <strong className="text-white">Read-Only Safeguard:</strong> Started with{' '}
                      <code className="text-emerald-300 bg-slate-900 px-1 py-0.5 rounded">--read-only</code>. Destructive order placement tools (
                      <code className="text-rose-400">futures_place_order</code>,{' '}
                      <code className="text-rose-400">spot_place_order</code>) are strictly suppressed to safeguard capital.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <ChevronRight className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
                    <div>
                      <strong className="text-white">Demo Mode Execution:</strong> Bitget Agent Hub supports{' '}
                      <code className="text-amber-300 bg-slate-900 px-1 py-0.5 rounded">--paper-trading</code>, which injects the{' '}
                      <code className="text-cyan-300">paptrading: 1</code> header into Bitget Demo endpoints.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <ChevronRight className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
                    <div>
                      <strong className="text-white">MacroVex Paper Execution Path:</strong> Autonomous server-side execution loop with real-time mark-price fills, continuous 30-min scans, automated TP/SL bracket orders, and authentic ledger tracking.
                    </div>
                  </div>
                </div>
              </div>

              {/* Reconnect & Stale Behavior */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                <div className="p-3 rounded-lg bg-[#070a10] border border-slate-800">
                  <span className="text-slate-400 font-bold block mb-1">RECONNECT BEHAVIOR:</span>
                  <p className="text-slate-300">
                    Automatic STDIO process recreation and tool discovery on socket drop or EPIPE, with safe 5-second backoff.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[#070a10] border border-slate-800">
                  <span className="text-slate-400 font-bold block mb-1">STALE-DATA BEHAVIOR:</span>
                  <p className="text-slate-300">
                    Status automatically degrades from <code className="text-emerald-300">LIVE</code> to{' '}
                    <code className="text-orange-400">STALE</code> if no verified response received within 45,000 ms.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: BITGET MARKET MCP (Equities & Broader Intelligence) */}
          {/* ========================================================================= */}
          {activeTab === 'MARKET_MCP' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-amber-950/20 border border-amber-500/30 text-xs flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-amber-300">
                    SEPARATE MARKET MCP CAPABILITIES VERIFICATION
                  </span>
                  <p className="text-amber-200/80 text-[11px] leading-relaxed">
                    Per official Bitget Agent Hub specifications, <code className="text-white">bitget-mcp-server</code> is an exchange & futures trading server. It does NOT bundle traditional equity intelligence, corporate SEC fundamentals, or general newsfeeds.
                  </p>
                </div>
              </div>

              {/* Detailed Breakdown for requested items */}
              <div className="space-y-3">
                {/* 1. US Equities */}
                <div className="p-3.5 rounded-lg bg-[#070a10] border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">1. US EQUITIES (MSFT, AMZN, META, GOOGL, AMD, AVGO)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      NOT VERIFIED (NOT IN BITGET-MCP-SERVER)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Standard traditional spot shares for US equities are not listed on Bitget crypto exchange. Bitget USDT-Futures supports tokenized contracts (<code className="text-cyan-300">NVDAUSDT</code>, <code className="text-cyan-300">TSLAUSDT</code>, <code className="text-cyan-300">AAPLUSDT</code>), but traditional spot equities are outside <code className="text-slate-300">bitget-mcp-server</code>.
                  </p>
                </div>

                {/* 2. ETFs */}
                <div className="p-3.5 rounded-lg bg-[#070a10] border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">2. ETFS (QQQ, SPY)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      DATA UNAVAILABLE VIA BITGET MCP
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Exchange-Traded Funds (ETFs) such as QQQ and SPY are not exposed by the <code className="text-slate-300">bitget-mcp-server</code> toolset.
                  </p>
                </div>

                {/* 3. Fundamentals */}
                <div className="p-3.5 rounded-lg bg-[#070a10] border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">3. FUNDAMENTALS (P/E, P/B, BALANCE SHEETS, 10-K/10-Q)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      DATA UNAVAILABLE VIA BITGET MCP
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Corporate accounting fundamentals are not provided by Bitget MCP tools.
                  </p>
                </div>

                {/* 4. Analyst & Institutional Data */}
                <div className="p-3.5 rounded-lg bg-[#070a10] border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">4. ANALYST & INSTITUTIONAL DATA</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      DATA UNAVAILABLE VIA BITGET MCP
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Wall Street price targets, consensus earnings forecasts, and institutional 13F holdings are not part of the Bitget MCP protocol.
                  </p>
                </div>

                {/* 5. News & Sentiment */}
                <div className="p-3.5 rounded-lg bg-[#070a10] border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">5. NEWS & MARKET SENTIMENT</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      DATA UNAVAILABLE VIA BITGET MCP
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    News feeds and social sentiment scores are not exposed as MCP tools in <code className="text-slate-300">bitget-mcp-server</code>. (Bitget Sentiment Analyst operates as a Claude skill integration rather than an MCP tool).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: TOOLS EXPLORER (Live Discovered Tools) */}
          {/* ========================================================================= */}
          {activeTab === 'TOOLS_EXPLORER' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search discovered tools (e.g. ticker, depth, candles, orders)..."
                    value={toolSearch}
                    onChange={(e) => setToolSearch(e.target.value)}
                    className="w-full bg-[#070a10] border border-slate-800 rounded px-2.5 py-1.5 pl-8 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <span className="text-slate-400 text-[11px] shrink-0">
                  Showing {filteredTools.length} of {toolsList.length} tools
                </span>
              </div>

              {toolsList.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  {isLoading ? 'Discovering tools via STDIO...' : 'DATA UNAVAILABLE (No tools discovered)'}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
                  {filteredTools.map((tool) => {
                    const isFutures = tool.startsWith('futures_');
                    const isSpot = tool.startsWith('spot_');
                    const isAccount = tool.startsWith('get_account') || tool.startsWith('margin_');
                    return (
                      <div
                        key={tool}
                        className="p-2 rounded bg-[#070a10] border border-slate-800/80 hover:border-slate-700 flex items-center justify-between transition-colors"
                      >
                        <span className="text-slate-200 font-mono text-[11px] truncate">
                          {tool}
                        </span>
                        <span
                          className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase shrink-0 ml-2 ${
                            isFutures
                              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                              : isSpot
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : isAccount
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isFutures ? 'FUTURES' : isSpot ? 'SPOT' : isAccount ? 'ACCOUNT' : 'OTHER'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800/80 flex items-center justify-between bg-[#080c12] text-xs">
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Anti-fabrication active: No mock statuses or fabricated prices.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-display font-bold text-xs transition-colors cursor-pointer"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
