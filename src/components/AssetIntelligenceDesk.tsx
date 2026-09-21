import React, { useState, useEffect } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bot,
  CheckCircle2,
  Cpu,
  Layers,
  Percent,
  Play,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
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
import { AssetIntelligence, Candle, InstrumentId } from '../types.js';

interface AssetIntelligenceDeskProps {
  initialAsset?: string;
  onTradeSubmitted: () => void;
}

const ASSET_LIST: Array<{ symbol: InstrumentId; name: string; cat: string }> = [
  { symbol: 'BTC', name: 'Bitcoin', cat: 'CRYPTO' },
  { symbol: 'ETH', name: 'Ethereum', cat: 'CRYPTO' },
  { symbol: 'SOL', name: 'Solana', cat: 'CRYPTO' },
  { symbol: 'BNB', name: 'BNB Chain', cat: 'CRYPTO' },
  { symbol: 'XRP', name: 'Ripple', cat: 'CRYPTO' },
  { symbol: 'DOGE', name: 'Dogecoin', cat: 'CRYPTO' },
  { symbol: 'AVAX', name: 'Avalanche', cat: 'CRYPTO' },
  { symbol: 'LINK', name: 'Chainlink', cat: 'CRYPTO' },
  { symbol: 'SUI', name: 'Sui', cat: 'CRYPTO' },
  { symbol: 'ADA', name: 'Cardano', cat: 'CRYPTO' },
  { symbol: 'NVDA', name: 'Nvidia Corp', cat: 'EQUITIES' },
  { symbol: 'AAPL', name: 'Apple Inc', cat: 'EQUITIES' },
  { symbol: 'MSFT', name: 'Microsoft', cat: 'EQUITIES' },
  { symbol: 'AMZN', name: 'Amazon', cat: 'EQUITIES' },
  { symbol: 'META', name: 'Meta Platforms', cat: 'EQUITIES' },
  { symbol: 'GOOGL', name: 'Alphabet', cat: 'EQUITIES' },
  { symbol: 'TSLA', name: 'Tesla Inc', cat: 'EQUITIES' },
  { symbol: 'AMD', name: 'AMD', cat: 'EQUITIES' },
  { symbol: 'AVGO', name: 'Broadcom', cat: 'EQUITIES' },
  { symbol: 'QQQ', name: 'Nasdaq 100', cat: 'EQUITIES' },
  { symbol: 'SPY', name: 'S&P 500 ETF', cat: 'EQUITIES' },
  { symbol: 'XAU', name: 'Gold Futures', cat: 'COMMODITIES' },
  { symbol: 'XAG', name: 'Silver Futures', cat: 'COMMODITIES' },
  { symbol: 'CL', name: 'Crude Oil WTI', cat: 'COMMODITIES' },
];

export const AssetIntelligenceDesk: React.FC<AssetIntelligenceDeskProps> = ({
  initialAsset = 'BTC',
  onTradeSubmitted,
}) => {
  const [selectedAsset, setSelectedAsset] = useState<InstrumentId>(initialAsset as InstrumentId);
  const [timeframe, setTimeframe] = useState<'15m' | '1h' | '4h' | '1D'>('1h');
  const [intel, setIntel] = useState<AssetIntelligence | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(false);
  const [evaluatingAI, setEvaluatingAI] = useState(false);

  // Manual trade form state
  const [direction, setDirection] = useState<'LONG' | 'SHORT'>('LONG');
  const [entryPrice, setEntryPrice] = useState<string>('');
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [leverage, setLeverage] = useState<number>(5);
  const [riskPercent, setRiskPercent] = useState<number>(1.5);
  const [submittingTrade, setSubmittingTrade] = useState(false);
  const [tradeMessage, setTradeMessage] = useState<{ success: boolean; message: string; checks?: Record<string, boolean> } | null>(null);

  const fetchAssetData = async (symbol: InstrumentId, tf: string) => {
    setLoading(true);
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

        // Pre-populate trade form with sensible initial values based on current price
        const curPrice = intelData.price || 100;
        setEntryPrice(curPrice.toString());
        const isBullish = intelData.technicalBias === 'BULLISH';
        const dir = isBullish ? 'LONG' : 'SHORT';
        setDirection(dir);
        if (dir === 'LONG') {
          setStopLoss((curPrice * 0.984).toFixed(2));
          setTakeProfit((curPrice * 1.035).toFixed(2));
        } else {
          setStopLoss((curPrice * 1.016).toFixed(2));
          setTakeProfit((curPrice * 0.965).toFixed(2));
        }
      }
    } catch (err) {
      console.error('Failed to load asset data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssetData(selectedAsset, timeframe);
  }, [selectedAsset, timeframe]);

  // Calculate live R:R
  const numEntry = parseFloat(entryPrice) || 0;
  const numSl = parseFloat(stopLoss) || 0;
  const numTp = parseFloat(takeProfit) || 0;
  const riskDist = Math.abs(numEntry - numSl);
  const rewardDist = Math.abs(numTp - numEntry);
  const currentRR = riskDist > 0 ? parseFloat((rewardDist / riskDist).toFixed(2)) : 0;

  const handleEvaluateAI = async () => {
    setEvaluatingAI(true);
    setTradeMessage(null);
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
        setTradeMessage({
          success: true,
          message: `AI evaluated ${selectedAsset}: Action [${dec.action}] | Confidence ${dec.confidence}%. Parameters populated into order ticket.`,
        });
      }
    } catch (err: any) {
      setTradeMessage({ success: false, message: `Evaluation failed: ${err.message}` });
    } finally {
      setEvaluatingAI(false);
    }
  };

  const handleExecuteTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingTrade(true);
    setTradeMessage(null);

    try {
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
        }),
      });

      const data = await res.json();
      if (res.ok && data.approved) {
        setTradeMessage({
          success: true,
          message: `Order approved & executed: ${direction} ${selectedAsset} in PAPER mode. Passed 20/20 risk checks!`,
          checks: data.riskResult?.checks,
        });
        onTradeSubmitted();
      } else {
        setTradeMessage({
          success: false,
          message: `Risk Engine REJECTED: ${data.reason}`,
          checks: data.checks,
        });
      }
    } catch (err: any) {
      setTradeMessage({
        success: false,
        message: `Execution error: ${err.message}`,
      });
    } finally {
      setSubmittingTrade(false);
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
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* 1. Asset Universe Strip */}
      <div className="p-3 rounded-xl bg-[#0e1422] border border-slate-800/80">
        <div className="text-[11px] font-mono text-slate-400 mb-2 flex items-center justify-between">
          <span>SELECT INSTRUMENT (24 CROSS-ASSET UNIVERSE)</span>
          <span className="text-cyan-400">SELECTED: {selectedAsset}</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {ASSET_LIST.map((item) => (
            <button
              key={item.symbol}
              onClick={() => setSelectedAsset(item.symbol)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                selectedAsset === item.symbol
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <span>{item.symbol}</span>
              <span className="text-[10px] opacity-75">
                {item.cat === 'CRYPTO' ? '₿' : item.cat === 'COMMODITIES' ? '⛏' : '📈'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Main Terminal Grid: Chart + Technicals & Order Ticket */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Chart & Indicators (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Price Header & Timeframe selector */}
          <div className="p-4 rounded-xl bg-[#0e1422] border border-slate-800/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-display font-bold text-white tracking-wide">
                    {intel?.name || selectedAsset}
                  </h1>
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    {selectedAsset}
                  </span>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    {intel?.status || 'AVAILABLE'}
                  </span>
                </div>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-2xl font-mono font-bold text-white">
                    ${intel?.price ? intel.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '...'}
                  </span>
                  <span
                    className={`font-mono text-sm font-bold ${
                      (intel?.change24h || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {(intel?.change24h || 0) >= 0 ? '+' : ''}
                    {intel?.change24h}%
                  </span>
                  <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                    High: ${intel?.high24h} • Low: ${intel?.low24h}
                  </span>
                </div>
              </div>

              {/* Timeframe Buttons */}
              <div className="flex items-center gap-1 bg-[#090d14] p-1 rounded-lg border border-slate-800 self-start">
                {(['15m', '1h', '4h', '1D'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                      timeframe === tf
                        ? 'bg-cyan-500 text-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Candle / Price Chart */}
            <div className="h-[280px] mt-4 w-full">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-mono">
                  Loading multi-timeframe candles...
                </div>
              ) : chartData.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-mono">
                  No candle data available for {selectedAsset}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis
                      stroke="#64748b"
                      fontSize={10}
                      domain={['auto', 'auto']}
                      tickFormatter={(v) => `$${v}`}
                      tickLine={false}
                      orientation="right"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0b0f19',
                        borderColor: '#1e293b',
                        color: '#f8fafc',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#00f0ff"
                      strokeWidth={2}
                      dot={false}
                      name="Close Price"
                    />
                    <Bar dataKey="volume" fill="#334155" opacity={0.3} yAxisId="right" name="Volume" />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Technicals & Smart Money Concepts (SMC) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Technical Indicators */}
            <div className="p-4 rounded-xl bg-[#0e1422] border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-display text-xs font-bold text-white tracking-wider flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                  TECHNICAL INDICATORS
                </span>
                <span className="text-[10px] font-mono text-cyan-400">TF: {timeframe}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                  <div className="text-[10px] text-slate-400">RSI (14)</div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {intel?.indicators.rsi14}
                  </div>
                </div>
                <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                  <div className="text-[10px] text-slate-400">VWAP</div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    ${intel?.indicators.vwap}
                  </div>
                </div>
                <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                  <div className="text-[10px] text-slate-400">EMA 20 / EMA 50</div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    ${intel?.indicators.ema20} / ${intel?.indicators.ema50}
                  </div>
                </div>
                <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                  <div className="text-[10px] text-slate-400">MACD HIST</div>
                  <div
                    className={`text-sm font-bold mt-0.5 ${
                      (intel?.indicators.macd.hist || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {intel?.indicators.macd.hist}
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Money Concepts (SMC) */}
            <div className="p-4 rounded-xl bg-[#0e1422] border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-display text-xs font-bold text-white tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  SMART MONEY CONCEPTS (SMC)
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-300">
                  {intel?.smc.marketStructure} STRUCTURE
                </span>
              </div>

              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 text-[11px]">ORDER BLOCKS:</span>
                  <span className="text-emerald-400 font-bold">
                    {intel?.smc.orderBlocks.length || 0} Identified
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 text-[11px]">FAIR VALUE GAPS (FVG):</span>
                  <span className="text-cyan-400 font-bold">
                    {intel?.smc.fvg.length || 0} Open Gaps
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 text-[11px]">BREAKOUT STATE:</span>
                  <span className="text-amber-400 font-bold">
                    {intel?.smc.breakoutState}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Manual Trade Execution Ticket & Risk Engine Validation (4 Cols) */}
        <div className="lg:col-span-4 p-4 rounded-xl bg-[#0e1422] border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <h2 className="font-display text-sm font-bold text-white tracking-wide">
                  ORDER EXECUTION TICKET
                </h2>
              </div>
              <span className="text-[10px] font-mono text-cyan-400">PAPER MODE</span>
            </div>

            {/* AI Assistant Quick Autofill */}
            <div className="mt-3 p-2.5 rounded-lg bg-cyan-950/20 border border-cyan-500/30 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-mono font-bold text-cyan-300 flex items-center gap-1">
                  <Bot className="w-3.5 h-3.5 text-cyan-400" />
                  AI SETUP EVALUATOR
                </div>
                <div className="text-[10px] text-slate-400">
                  Ask AI for optimal TP/SL parameters
                </div>
              </div>
              <button
                type="button"
                onClick={handleEvaluateAI}
                disabled={evaluatingAI}
                className="px-2.5 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-mono font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                {evaluatingAI ? 'EVALUATING...' : 'AUTOFIL'}
              </button>
            </div>

            {/* Direction Toggle */}
            <form onSubmit={handleExecuteTrade} className="mt-3 space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDirection('LONG')}
                  className={`py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    direction === 'LONG'
                      ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/30'
                      : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  LONG (BUY)
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('SHORT')}
                  className={`py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    direction === 'SHORT'
                      ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                      : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  SHORT (SELL)
                </button>
              </div>

              {/* Entry Price */}
              <div>
                <label className="text-[11px] text-slate-400">ENTRY PRICE ($)</label>
                <input
                  type="number"
                  step="any"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value)}
                  className="w-full mt-1 p-2 rounded bg-slate-900 border border-slate-800 text-white focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>

              {/* Stop Loss & Take Profit */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-rose-400">STOP LOSS ($)</label>
                  <input
                    type="number"
                    step="any"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    className="w-full mt-1 p-2 rounded bg-slate-900 border border-slate-800 text-white focus:border-rose-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] text-emerald-400">TAKE PROFIT ($)</label>
                  <input
                    type="number"
                    step="any"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(e.target.value)}
                    className="w-full mt-1 p-2 rounded bg-slate-900 border border-slate-800 text-white focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Leverage & Risk % */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400">LEVERAGE ({leverage}x)</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={leverage}
                    onChange={(e) => setLeverage(parseInt(e.target.value, 10))}
                    className="w-full mt-2 accent-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400">RISK PER TRADE ({riskPercent}%)</label>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={riskPercent}
                    onChange={(e) => setRiskPercent(parseFloat(e.target.value))}
                    className="w-full mt-2 accent-amber-400"
                  />
                </div>
              </div>

              {/* Risk Math Preview */}
              <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">CALCULATED R:R:</span>
                  <span className={currentRR >= 1.5 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {currentRR}:1 (Min 1.5:1 required)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">STOP DISTANCE:</span>
                  <span className="text-white">
                    ${riskDist.toFixed(2)} ({numEntry > 0 ? ((riskDist / numEntry) * 100).toFixed(2) : 0}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">SAFETY GATE:</span>
                  <span className="text-cyan-400">20 Deterministic Checks</span>
                </div>
              </div>

              {/* Execution Feedback */}
              {tradeMessage && (
                <div
                  className={`p-2.5 rounded-lg border text-xs ${
                    tradeMessage.success
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    {tradeMessage.success ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    )}
                    <span>{tradeMessage.success ? 'ORDER APPROVED' : 'SAFETY GATE HALTED'}</span>
                  </div>
                  <p className="text-[11px] leading-tight">{tradeMessage.message}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={submittingTrade}
                className="w-full py-2.5 rounded-lg font-bold text-xs bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black shadow-lg shadow-cyan-500/20 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
              >
                {submittingTrade ? 'VALIDATING RISK ENGINE...' : `EXECUTE ${direction} ${selectedAsset}`}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
