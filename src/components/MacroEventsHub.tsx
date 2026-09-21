import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowRight,
  Calendar,
  Clock,
  ExternalLink,
  Filter,
  Flame,
  Globe,
  Layers,
  Network,
  Newspaper,
  Radio,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { CrossAssetRelationship, MacroEvent, MarketRegime, LiveNewsItem } from '../types.js';
import { formatUTCDateTime } from '../utils/timeFormat.js';

export const MacroEventsHub: React.FC = () => {
  // Navigation Tabs: MACRO EVENTS vs. LIVE NEWS
  const [activeTab, setActiveTab] = useState<'MACRO_EVENTS' | 'LIVE_NEWS'>('MACRO_EVENTS');

  // Macro Calendar Events State
  const [events, setEvents] = useState<MacroEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Live News State
  const [liveNews, setLiveNews] = useState<LiveNewsItem[]>([]);
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);

  // Cross-Asset & Market Regime State
  const [regime, setRegime] = useState<{ regime: MarketRegime; confidence: number; drivers: string[]; invalidation: string } | null>(null);
  const [crossAsset, setCrossAsset] = useState<{
    regime: MarketRegime;
    relationships: CrossAssetRelationship[];
    divergences: string[];
    macroTheme: string;
    dollarYieldPressure: string;
  } | null>(null);

  // Loading & Auto-Refresh State
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingNews, setLoadingNews] = useState(false);
  const [countdown, setCountdown] = useState<number>(20);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  // Filters & Search
  const [macroFilterCat, setMacroFilterCat] = useState<string>('ALL');
  const [macroSearchQuery, setMacroSearchQuery] = useState('');
  const [newsFilterAsset, setNewsFilterAsset] = useState<string>('ALL');
  const [newsSearchQuery, setNewsSearchQuery] = useState('');

  // Initial Data Fetch
  useEffect(() => {
    fetchMacroData();
    fetchNewsData(false);
  }, []);

  // 20-Second Auto-Refresh Timer for Live News
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchNewsData(true);
          return 20;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchMacroData = async () => {
    setLoadingEvents(true);
    try {
      const [eventsRes, regimeRes, crossRes] = await Promise.all([
        fetch('/api/macro/events'),
        fetch('/api/macro/regime'),
        fetch('/api/macro/cross-asset'),
      ]);
      if (eventsRes.ok && regimeRes.ok && crossRes.ok) {
        const evData: MacroEvent[] = await eventsRes.json();
        const regData = await regimeRes.json();
        const crData = await crossRes.json();
        setEvents(evData);
        setRegime(regData);
        setCrossAsset(crData);
        if (evData.length > 0 && !selectedEventId) {
          setSelectedEventId(evData[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching macro events:', err);
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchNewsData = async (forceRefresh = false) => {
    setLoadingNews(true);
    try {
      const endpoint = forceRefresh ? '/api/macro/live-news?refresh=true' : '/api/macro/live-news';
      const res = await fetch(endpoint);
      if (res.ok) {
        const newsItems: LiveNewsItem[] = await res.json();
        setLiveNews(newsItems);
        setLastSyncTime(new Date());
        if (newsItems.length > 0 && !selectedNewsId) {
          setSelectedNewsId(newsItems[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching live news:', err);
    } finally {
      setLoadingNews(false);
    }
  };

  const handleManualNewsRefresh = () => {
    setCountdown(20);
    fetchNewsData(true);
  };

  // Selected Macro Event
  const selectedEvent = events.find((e) => e.id === selectedEventId) || events[0];

  // Selected Live News Item
  const selectedNews = liveNews.find((n) => n.id === selectedNewsId) || liveNews[0];

  // Active Catalyst feeding the top 5-Stage Interactive Transmission Pathway
  const activeCatalyst = useMemo(() => {
    if (activeTab === 'LIVE_NEWS' && selectedNews) {
      return {
        id: selectedNews.id,
        headline: selectedNews.headline,
        source: selectedNews.source,
        timestamp: selectedNews.timestamp,
        category: selectedNews.primaryAsset,
        importance: selectedNews.importance,
        status: 'LIVE' as const,
        affectedAssets: selectedNews.impactAssets,
        summary: selectedNews.summary,
        url: selectedNews.url,
        directImpact: selectedNews.directImpact || `Immediate volatility repricing across ${selectedNews.impactAssets.join(' & ')}.`,
        macroTransmission: selectedNews.macroTransmission || `Catalyst transmits through: ${selectedNews.transmissionText}`,
        assetResponse: `Active capital rotation across ${selectedNews.impactAssets.join(' • ')} matching risk-budget alignment.`,
        crossAssetConfirmation: `Inter-market pathway: ${selectedNews.transmissionText}`,
        tradingImplication: `Requires technical price-action confirmation and 20-Gate clearance before trade execution.`,
        assetBiases: selectedNews.assetBiases || [
          { symbol: selectedNews.impactAssets[0] || 'ASSET', bias: 'BULLISH' as const, reason: 'Headline momentum impulse.' }
        ],
        primaryAsset: selectedNews.primaryAsset,
        transmissionChain: selectedNews.transmissionChain,
        publishedAt: selectedNews.publishedAt,
        timeAgo: selectedNews.timeAgo,
      };
    }
    return selectedEvent;
  }, [activeTab, selectedNews, selectedEvent]);

  // Filtered Macro Calendar Events
  const filteredMacroEvents = events.filter((e) => {
    if (macroFilterCat !== 'ALL' && e.category !== macroFilterCat) return false;
    if (macroSearchQuery.trim()) {
      const q = macroSearchQuery.toLowerCase();
      const matchTitle = e.headline.toLowerCase().includes(q);
      const matchSummary = e.summary.toLowerCase().includes(q);
      const matchAssets = e.affectedAssets.some((a) => a.toLowerCase().includes(q));
      const matchSource = e.source.toLowerCase().includes(q);
      return matchTitle || matchSummary || matchAssets || matchSource;
    }
    return true;
  });

  // Filtered Live News Items
  const filteredLiveNews = liveNews.filter((n) => {
    if (newsFilterAsset !== 'ALL' && n.primaryAsset !== newsFilterAsset) return false;
    if (newsSearchQuery.trim()) {
      const q = newsSearchQuery.toLowerCase();
      const matchTitle = n.headline.toLowerCase().includes(q);
      const matchSummary = n.summary.toLowerCase().includes(q);
      const matchImpact = n.impactAssets.some((a) => a.toLowerCase().includes(q));
      const matchSource = n.source.toLowerCase().includes(q);
      const matchAsset = n.primaryAsset.toLowerCase().includes(q);
      return matchTitle || matchSummary || matchImpact || matchSource || matchAsset;
    }
    return true;
  });

  const macroCategories = [
    'ALL',
    'CENTRAL_BANK',
    'INFLATION',
    'COMMODITIES',
    'CRYPTO',
    'EARNINGS',
    'EMPLOYMENT',
  ];

  const newsAssetCategories = [
    'ALL',
    'GOLD',
    'OIL',
    'FED / RATES',
    'TECH / NASDAQ',
    'BTC / CRYPTO',
    'INFLATION',
    'EQUITIES',
  ];

  const getAssetBadgeStyle = (asset: string) => {
    switch (asset) {
      case 'GOLD':
        return 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10';
      case 'OIL':
        return 'bg-orange-500/15 text-orange-300 border border-orange-500/40 shadow-sm shadow-orange-500/10';
      case 'FED / RATES':
        return 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10';
      case 'INFLATION':
        return 'bg-rose-500/15 text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-500/10';
      case 'BTC / CRYPTO':
      case 'CRYPTO':
        return 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10';
      case 'TECH / NASDAQ':
        return 'bg-purple-500/15 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-500/10';
      case 'LABOR / JOBS':
        return 'bg-blue-500/15 text-blue-300 border border-blue-500/40 shadow-sm shadow-blue-500/10';
      default:
        return 'bg-slate-800 text-slate-300 border border-slate-700';
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* 1. Global Macro Environment & Daily Transmission Header */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-[#0d1424] via-[#10182b] to-[#0c121e] border border-cyan-500/20 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <h1 className="font-display text-sm font-bold tracking-wider text-cyan-400">
                GLOBAL MACRO ENVIRONMENT & DAILY NEWS TRANSMISSION
              </h1>
            </div>
            <p className="text-xs text-slate-300 font-mono mt-1">
              Live verified financial news wire (Yahoo Finance, Reuters, CNBC, Federal Reserve, BLS) with institutional transmission mapping.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-3 py-1.5 rounded-lg bg-black/40 border border-slate-800 text-xs font-mono">
              <span className="text-slate-400">CURRENT REGIME: </span>
              <span className="text-emerald-400 font-bold">{regime?.regime || 'RISK-ON'}</span>
              <span className="text-slate-500 text-[10px] ml-1">({regime?.confidence || 85}% conf)</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-black/40 border border-slate-800 text-xs font-mono">
              <span className="text-slate-400">DOLLAR / YIELDS: </span>
              <span className="text-cyan-400 font-bold">{crossAsset?.dollarYieldPressure || 'EASING'}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-black/40 border border-slate-800 text-xs font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-300">SYNC:</span>
              <span className="text-cyan-400 font-bold">{countdown}s</span>
            </div>
          </div>
        </div>

        {/* Strict Strategy & Risk Guardrail Notice */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono">
          <div className="flex items-center gap-2 text-amber-400">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>
              <strong>STRICT MANDATE:</strong> NEWS ALONE NEVER TRIGGERS A TRADE. All signals must satisfy Technical Price-Action Confirmation & 20-Gate Risk Engine.
            </span>
          </div>
          {regime && (
            <div className="text-slate-400 text-[10px]">
              <strong className="text-slate-300">Regime Invalidation:</strong> {regime.invalidation}
            </div>
          )}
        </div>
      </div>

      {/* 2. Visual Macro Transmission Pathway for Active News Catalyst */}
      {activeCatalyst && (
        <div className="p-4 rounded-xl bg-[#0e1422] border border-cyan-500/30 shadow-lg space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <h2 className="font-display text-sm font-bold text-white tracking-wide">
                TRANSMISSION PATHWAY:{' '}
                <span className="text-cyan-300">
                  {activeCatalyst.headline}
                </span>
              </h2>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-slate-400">{activeCatalyst.source}</span>
              <a
                href={activeCatalyst.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold underline cursor-pointer"
              >
                <span>[↗ Open Original Article]</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* 5-Stage Interactive Transmission Flow */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
            {/* Stage 1: Catalyst */}
            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 font-bold flex items-center gap-1">
                  <span>STAGE 1: CATALYST</span>
                </span>
                <div className="font-display text-xs font-bold text-white mt-1">
                  {activeCatalyst.category.replace('_', ' ')}
                </div>
                <p className="text-[11px] text-slate-300 font-mono mt-1 leading-relaxed">
                  {activeCatalyst.headline}
                </p>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-800/60 text-[10px] text-slate-500 font-mono flex items-center justify-between">
                <span>Status: {activeCatalyst.status}</span>
                <span className="text-cyan-400 font-semibold">{activeCatalyst.source}</span>
              </div>
            </div>

            {/* Stage 2: Immediate Impact */}
            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-blue-400 font-bold">
                  STAGE 2: IMMEDIATE IMPACT
                </span>
                <div className="font-display text-xs font-bold text-white mt-1">Rates, Spreads & FX</div>
                <p className="text-[11px] text-slate-300 font-mono mt-1 leading-relaxed">
                  {activeCatalyst.directImpact || 'Initial price shock absorption across front-end yields and foreign exchange.'}
                </p>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-800/60 text-[10px] text-blue-400 font-mono">
                Prompt Duration Horizon
              </div>
            </div>

            {/* Stage 3: Transmission Channel */}
            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-violet-400 font-bold">
                  STAGE 3: TRANSMISSION CHANNELS
                </span>
                <div className="font-display text-xs font-bold text-white mt-1">Systemic Liquidity</div>
                <p className="text-[11px] text-slate-300 font-mono mt-1 leading-relaxed">
                  {activeCatalyst.macroTransmission || 'Transmits through policy discount rates, dollar liquidity, and corporate cost of capital.'}
                </p>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-800/60 text-[10px] text-violet-400 font-mono">
                Cross-Asset Propagation
              </div>
            </div>

            {/* Stage 4: Asset Response */}
            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-amber-400 font-bold">
                  STAGE 4: ASSET RESPONSE
                </span>
                <div className="font-display text-xs font-bold text-white mt-1">Capital Repositioning</div>
                <p className="text-[11px] text-slate-300 font-mono mt-1 leading-relaxed">
                  {activeCatalyst.assetResponse || 'Capital flows into structural market leaders while testing defensive floors.'}
                </p>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-800/60 text-[10px] text-slate-400 font-mono">
                Assets: {activeCatalyst.affectedAssets.join(', ')}
              </div>
            </div>

            {/* Stage 5: Trading Implication & Edge */}
            <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-500/40 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                  <span>STAGE 5: ACTIONABLE EDGE</span>
                </span>
                <div className="font-display text-xs font-bold text-white mt-1">Execution Rule</div>
                <p className="text-[11px] text-cyan-200 font-mono mt-1 leading-relaxed font-semibold">
                  {activeCatalyst.tradingImplication || 'Requires technical price-action confirmation and 20-Gate Risk Engine clearance.'}
                </p>
              </div>
              <div className="mt-2 pt-2 border-t border-cyan-500/20 text-[10px] text-emerald-400 font-mono">
                Risk Engine Pre-Cleared
              </div>
            </div>
          </div>

          {/* Directional Asset Biases Pill Row */}
          {activeCatalyst.assetBiases && activeCatalyst.assetBiases.length > 0 && (
            <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase block">
                  Directional Bias Across Portfolio Universe:
                </span>
                {activeCatalyst.transmissionChain && (
                  <div className="hidden sm:flex items-center gap-1 font-mono text-[10px] text-slate-400">
                    <span className="text-slate-500">Transmission:</span>
                    <span className="text-cyan-400">{activeCatalyst.transmissionChain.join(' → ')}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {activeCatalyst.assetBiases.map((b, idx) => (
                  <div
                    key={idx}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold border flex items-center gap-1.5 ${
                      b.bias === 'BULLISH'
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : b.bias === 'BEARISH'
                        ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700'
                    }`}
                    title={b.reason}
                  >
                    <span>{b.symbol}:</span>
                    <span className="uppercase">{b.bias}</span>
                    {b.bias === 'BULLISH' && <TrendingUp className="w-3 h-3 text-emerald-400" />}
                    {b.bias === 'BEARISH' && <TrendingDown className="w-3 h-3 text-rose-400" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. SIDE-BY-SIDE TABS: [ MACRO EVENTS ] | [ LIVE NEWS ] */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3 flex-wrap">
        <div className="flex items-center gap-2">
          {/* TAB 1: MACRO EVENTS */}
          <button
            onClick={() => setActiveTab('MACRO_EVENTS')}
            className={`px-4 py-2 rounded-lg font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'MACRO_EVENTS'
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20 font-black'
                : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>[ MACRO EVENTS ]</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'MACRO_EVENTS' ? 'bg-black/20 text-black' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {events.length}
            </span>
          </button>

          {/* TAB 2: LIVE NEWS */}
          <button
            onClick={() => setActiveTab('LIVE_NEWS')}
            className={`px-4 py-2 rounded-lg font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'LIVE_NEWS'
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20 font-black'
                : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>[ LIVE NEWS ]</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'LIVE_NEWS' ? 'bg-black/20 text-black' : 'bg-emerald-500/20 text-emerald-300'
              }`}
            >
              {liveNews.length} LIVE
            </span>
          </button>
        </div>

        {/* Live Status Indicators */}
        <div className="flex items-center gap-2 text-xs font-mono">
          {activeTab === 'LIVE_NEWS' && (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-slate-400 text-[11px]">
                Auto-syncing every 20s
              </span>
              <button
                onClick={handleManualNewsRefresh}
                disabled={loadingNews}
                className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-white text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-all"
                title="Force refresh live news feed from Yahoo Finance, Reuters, CNBC"
              >
                <RefreshCw className={`w-3 h-3 text-cyan-400 ${loadingNews ? 'animate-spin' : ''}`} />
                <span>REFRESH FEED</span>
              </button>
            </div>
          )}
          {activeTab === 'MACRO_EVENTS' && (
            <button
              onClick={fetchMacroData}
              disabled={loadingEvents}
              className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-white text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <RefreshCw className={`w-3 h-3 text-cyan-400 ${loadingEvents ? 'animate-spin' : ''}`} />
              <span>REFRESH MACRO</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. CONTENT VIEW A: [ MACRO EVENTS ] TAB */}
      {activeTab === 'MACRO_EVENTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Macro Events List (7 Cols) */}
          <div className="lg:col-span-7 p-4 rounded-xl bg-[#0e1422] border border-slate-800/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <h2 className="font-display text-sm font-bold text-white tracking-wide">
                  MACRO EVENTS: FED, CPI, JOBS, RATES & INFLATION ({filteredMacroEvents.length})
                </h2>
              </div>

              {/* Keyword Search */}
              <div className="relative">
                <Search className="w-3 h-3 absolute left-2.5 top-2.5 text-slate-500" />
                <input
                  type="text"
                  value={macroSearchQuery}
                  onChange={(e) => setMacroSearchQuery(e.target.value)}
                  placeholder="Filter macro event..."
                  className="pl-7 pr-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1 font-mono text-[10px] overflow-x-auto no-scrollbar pb-1">
              {macroCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setMacroFilterCat(cat)}
                  className={`px-2.5 py-1 rounded cursor-pointer whitespace-nowrap transition-colors font-bold ${
                    macroFilterCat === cat
                      ? 'bg-cyan-500 text-black shadow-sm'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Macro Events Stream */}
            <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
              {filteredMacroEvents.map((ev) => {
                const isSelected = ev.id === selectedEventId;
                const isHigh = ev.importance === 'HIGH';

                return (
                  <div
                    key={ev.id}
                    onClick={() => setSelectedEventId(ev.id)}
                    className={`p-3.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/30 border-cyan-500 text-white shadow-md shadow-cyan-500/10'
                        : 'bg-slate-900/50 border-slate-800/80 text-slate-300 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isHigh
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {ev.importance}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-semibold">
                          {ev.category.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-cyan-400 font-bold">{ev.source}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatUTCDateTime(ev.timestamp)}
                        </span>
                        <a
                          href={ev.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-slate-400 hover:text-cyan-400 p-0.5"
                          title="Open authenticated source"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    <h3 className="font-display text-sm font-bold text-white leading-snug">
                      {ev.headline}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {ev.summary}
                    </p>

                    {/* Direct Impact */}
                    {ev.directImpact && (
                      <div className="mt-2 p-2 rounded bg-black/40 border border-slate-800/60 text-[11px] text-slate-300">
                        <span className="text-cyan-400 font-bold">Direct Impact: </span>
                        {ev.directImpact}
                      </div>
                    )}

                    {/* Affected Assets */}
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 flex-wrap gap-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-slate-500">Assets:</span>
                        {ev.assetBiases && ev.assetBiases.length > 0 ? (
                          ev.assetBiases.map((b, idx) => (
                            <span
                              key={idx}
                              className={`px-1.5 py-0.2 rounded font-bold ${
                                b.bias === 'BULLISH'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : b.bias === 'BEARISH'
                                  ? 'bg-rose-500/20 text-rose-400'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {b.symbol} {b.bias === 'BULLISH' ? '▲' : b.bias === 'BEARISH' ? '▼' : '●'}
                            </span>
                          ))
                        ) : (
                          ev.affectedAssets.map((a) => (
                            <span key={a} className="text-cyan-400 font-bold">
                              {a}
                            </span>
                          ))
                        )}
                      </div>
                      {isSelected && (
                        <span className="text-cyan-400 font-bold">● Active Pathway Selected</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Cross-Asset Relationship Matrix (5 Cols) */}
          <div className="lg:col-span-5 p-4 rounded-xl bg-[#0e1422] border border-slate-800/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Network className="w-4 h-4 text-cyan-400" />
                  <h2 className="font-display text-sm font-bold text-white tracking-wide">
                    CROSS-ASSET TRANSMISSION MATRIX
                  </h2>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 font-bold">
                  Theme: {crossAsset?.macroTheme || 'Expansion'}
                </span>
              </div>

              <p className="text-xs font-mono text-slate-400 mb-3">
                Correlation and transmission channels linking sovereign yields, currencies, commodities, and equities.
              </p>

              <div className="space-y-2 font-mono text-xs">
                {crossAsset?.relationships.map((rel, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-[11px]">
                        {rel.source} ↔ {rel.target}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                          rel.relationship === 'POSITIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : rel.relationship === 'INVERSE'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {rel.relationship} ({rel.correlation})
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">{rel.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Notable Divergences Alert */}
            {crossAsset && crossAsset.divergences.length > 0 && (
              <div className="mt-3 p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 text-xs font-mono">
                <div className="font-bold text-amber-300 text-[11px] mb-1 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  NOTABLE CROSS-ASSET DIVERGENCES
                </div>
                <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-0.5">
                  {crossAsset.divergences.map((d, idx) => (
                    <li key={idx}>{d}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. CONTENT VIEW B: [ LIVE NEWS ] TAB */}
      {activeTab === 'LIVE_NEWS' && (
        <div className="space-y-3">
          {/* Controls Bar: Asset Filters & Search */}
          <div className="p-3.5 rounded-xl bg-[#0e1422] border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Quick Asset Filters */}
            <div className="flex items-center gap-1.5 font-mono text-xs overflow-x-auto no-scrollbar py-0.5">
              <span className="text-slate-500 text-[11px] mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3 text-cyan-400" />
                ASSET:
              </span>
              {newsAssetCategories.map((asset) => (
                <button
                  key={asset}
                  onClick={() => setNewsFilterAsset(asset)}
                  className={`px-2.5 py-1 rounded cursor-pointer whitespace-nowrap transition-all font-bold text-[11px] ${
                    newsFilterAsset === asset
                      ? 'bg-cyan-500 text-black shadow-sm'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {asset}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={newsSearchQuery}
                onChange={(e) => setNewsSearchQuery(e.target.value)}
                placeholder="Search headlines, sources, impacts..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Live News Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredLiveNews.map((news) => {
              const isSelected = selectedNewsId === news.id;

              return (
                <div
                  key={news.id}
                  className={`p-4 rounded-xl border text-xs font-mono transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#0f1729] border-cyan-500/80 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                      : 'bg-[#0e1422] border-slate-800 hover:border-slate-700 hover:bg-[#11192a]'
                  }`}
                >
                  <div>
                    {/* Card Header: Primary Asset Badge, Source, Published Timestamp */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Primary Asset Pill (GOLD, OIL, etc.) */}
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider ${getAssetBadgeStyle(
                            news.primaryAsset
                          )}`}
                        >
                          {news.primaryAsset}
                        </span>
                        {/* Source Name (Yahoo Finance, Reuters, CNBC, etc.) */}
                        <span className="text-xs font-mono font-bold text-slate-200">
                          {news.source}
                        </span>
                      </div>

                      {/* Published Timestamp */}
                      <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>Published: {news.publishedAt}</span>
                      </div>
                    </div>

                    {/* Headline: Clicking opens actual Yahoo Finance / Reuters article */}
                    <a
                      href={news.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block font-display text-sm md:text-[15px] font-bold text-white hover:text-cyan-300 transition-colors leading-snug"
                    >
                      <span>"{news.headline}"</span>
                    </a>

                    {/* Summary Snippet */}
                    <p className="text-[11px] text-slate-400 font-mono mt-1.5 leading-relaxed">
                      {news.summary}
                    </p>

                    {/* Impact Line: e.g. Impact: GOLD • USD • NASDAQ */}
                    <div className="mt-3 py-1.5 px-2.5 rounded bg-black/40 border border-slate-800/90 text-xs font-mono flex items-center gap-2 flex-wrap">
                      <span className="text-slate-400 font-bold">Impact:</span>
                      <span className="text-cyan-300 font-bold tracking-wide">
                        {news.impactAssets.join(' • ')}
                      </span>
                    </div>

                    {/* Transmission Pathway: e.g. Gold News → USD / Rates → Gold → Equities → BTC */}
                    <div className="mt-2.5 p-2.5 rounded bg-slate-900/80 border border-slate-800/80">
                      <div className="text-[10px] font-mono text-slate-400 uppercase font-bold mb-1.5 flex items-center gap-1">
                        <Network className="w-3 h-3 text-cyan-400" />
                        <span>TRANSMISSION PATHWAY:</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap font-mono text-[11px] text-slate-300">
                        {news.transmissionChain.map((node, nIdx) => (
                          <React.Fragment key={nIdx}>
                            <span
                              className={`px-2 py-0.5 rounded font-semibold ${
                                nIdx === 0
                                  ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-800/60 font-bold'
                                  : 'bg-slate-800/80 text-slate-300'
                              }`}
                            >
                              {node}
                            </span>
                            {nIdx < news.transmissionChain.length - 1 && (
                              <ArrowRight className="w-3 h-3 text-cyan-400 shrink-0" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Actions: Open Original Article + Feed into Macro Analysis */}
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                    {/* Prominent OPEN ORIGINAL ARTICLE button */}
                    <a
                      href={news.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    >
                      <span>[↗ OPEN ORIGINAL ARTICLE]</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    {/* Feed into Macro Transmission button */}
                    <button
                      onClick={() => setSelectedNewsId(news.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/20'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                      }`}
                    >
                      <Zap className={`w-3 h-3 ${isSelected ? 'text-black' : 'text-amber-400'}`} />
                      <span>{isSelected ? 'ACTIVE IN ANALYSIS' : 'TRANSMIT TO ANALYSIS'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredLiveNews.length === 0 && (
            <div className="p-8 text-center rounded-xl bg-[#0e1422] border border-slate-800 text-slate-400 font-mono text-xs">
              No news items match the selected asset filter or search keyword.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
