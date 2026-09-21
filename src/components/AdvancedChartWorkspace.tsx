import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Activity,
  BarChart2,
  ChevronDown,
  Crosshair,
  Eye,
  Layers,
  Maximize2,
  Minus,
  Plus,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { Candle, InstrumentId } from '../types.js';

interface AdvancedChartWorkspaceProps {
  selectedAsset: string;
  onSelectAsset: (asset: string) => void;
  currentPrice: number;
  priceChange24h: number;
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
  candles: Candle[];
  loadingCandles: boolean;
  smc?: {
    marketStructure: string;
    supportLevels: number[];
    resistanceLevels: number[];
    orderBlocks: Array<{ type: 'BULLISH' | 'BEARISH'; top: number; bottom: number; active: boolean }>;
    fvg: Array<{ type: 'BULLISH' | 'BEARISH'; top: number; bottom: number }>;
    liquiditySweeps: Array<{ level: number; type: 'HIGH' | 'LOW'; time: number }>;
    breakoutState: string;
  };
  indicators?: {
    ema20: number;
    ema50: number;
    rsi14: number;
    vwap: number;
    adx14: number;
  };
}

const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1H', '4H', '1D'];

const QUICK_ASSETS: Array<{ id: string; label: string; cat: 'CRYPTO' | 'EQUITY' | 'COMMODITY' }> = [
  { id: 'BTC', label: 'BTC', cat: 'CRYPTO' },
  { id: 'ETH', label: 'ETH', cat: 'CRYPTO' },
  { id: 'SOL', label: 'SOL', cat: 'CRYPTO' },
  { id: 'XRP', label: 'XRP', cat: 'CRYPTO' },
  { id: 'NVDA', label: 'NVDA', cat: 'EQUITY' },
  { id: 'AAPL', label: 'AAPL', cat: 'EQUITY' },
  { id: 'TSLA', label: 'TSLA', cat: 'EQUITY' },
  { id: 'AVGO', label: 'AVGO', cat: 'EQUITY' },
  { id: 'GOOGL', label: 'GOOGL', cat: 'EQUITY' },
  { id: 'XAU', label: 'GOLD', cat: 'COMMODITY' },
  { id: 'XAG', label: 'SILVER', cat: 'COMMODITY' },
  { id: 'CL', label: 'OIL', cat: 'COMMODITY' },
];

export const AdvancedChartWorkspace: React.FC<AdvancedChartWorkspaceProps> = ({
  selectedAsset,
  onSelectAsset,
  currentPrice,
  priceChange24h,
  timeframe,
  onTimeframeChange,
  candles,
  loadingCandles,
  smc,
  indicators,
}) => {
  // Chart Overlays Toggles (Independent toggles)
  const [showSR, setShowSR] = useState(true);
  const [showFVG, setShowFVG] = useState(true);
  const [showVWAP, setShowVWAP] = useState(true);
  const [showOrderBlocks, setShowOrderBlocks] = useState(true);
  const [showSweeps, setShowSweeps] = useState(true);
  const [showStructure, setShowStructure] = useState(true);
  const [showEMAs, setShowEMAs] = useState(true);

  // Manual Drawings: User drawn levels
  const [manualLines, setManualLines] = useState<Array<{ id: string; price: number; type: 'support' | 'resistance' }>>([]);
  const [drawingMode, setDrawingMode] = useState<'none' | 'support' | 'resistance'>('none');

  // Hovered candle for inspection
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter and compute coordinate bounds
  const chartData = useMemo(() => {
    if (!candles || candles.length === 0) return [];
    return candles.slice(-50); // Show last 50 bars for optimal candle width & wick visibility
  }, [candles]);

  const { minPrice, maxPrice, priceRange } = useMemo(() => {
    if (chartData.length === 0) return { minPrice: 0, maxPrice: 100, priceRange: 100 };
    let min = Infinity;
    let max = -Infinity;
    for (const c of chartData) {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
    }
    // Add 4% padding for breathing room
    const pad = (max - min) * 0.05 || max * 0.02 || 1;
    return {
      minPrice: min - pad,
      maxPrice: max + pad,
      priceRange: max - min + pad * 2,
    };
  }, [chartData]);

  // Compute EMAs and VWAP array over candles for continuous overlay lines
  const calculatedOverlays = useMemo(() => {
    if (chartData.length === 0) return { ema20Arr: [], ema50Arr: [], vwapArr: [] };
    const ema20Arr: Array<{ x: number; y: number }> = [];
    const ema50Arr: Array<{ x: number; y: number }> = [];
    const vwapArr: Array<{ x: number; y: number }> = [];

    let sumPV = 0;
    let sumV = 0;

    chartData.forEach((c, idx) => {
      const typicalPrice = (c.high + c.low + c.close) / 3;
      sumPV += typicalPrice * c.volume;
      sumV += c.volume;
      const runningVwap = sumV > 0 ? sumPV / sumV : typicalPrice;

      // Approximate EMA20 smoothing
      const ema20Val = indicators?.ema20 && idx > 30 ? indicators.ema20 : typicalPrice;
      const ema50Val = indicators?.ema50 && idx > 30 ? indicators.ema50 : typicalPrice * 0.995;

      vwapArr.push({ x: idx, y: runningVwap });
      ema20Arr.push({ x: idx, y: ema20Val });
      ema50Arr.push({ x: idx, y: ema50Val });
    });

    return { ema20Arr, ema50Arr, vwapArr };
  }, [chartData, indicators]);

  // Dimensions & SVG Math
  const chartHeight = 440;
  const paddingLeft = 10;
  const paddingRight = 75; // for price axis
  const paddingTop = 20;
  const paddingBottom = 30; // for time axis
  const effectiveHeight = chartHeight - paddingTop - paddingBottom;

  const getX = (index: number) => {
    if (chartData.length <= 1) return paddingLeft;
    const availableWidth = 800 - paddingLeft - paddingRight;
    return paddingLeft + (index / (chartData.length - 1)) * availableWidth;
  };

  const getY = (price: number) => {
    if (priceRange <= 0) return paddingTop + effectiveHeight / 2;
    const fraction = (price - minPrice) / priceRange;
    return paddingTop + effectiveHeight * (1 - fraction);
  };

  const getPriceFromY = (y: number) => {
    const fraction = 1 - (y - paddingTop) / effectiveHeight;
    return minPrice + fraction * priceRange;
  };

  // Candle width based on count
  const candleWidth = useMemo(() => {
    if (chartData.length === 0) return 6;
    const availableWidth = 800 - paddingLeft - paddingRight;
    const step = availableWidth / chartData.length;
    return Math.max(4, Math.min(14, step * 0.68));
  }, [chartData.length]);

  // Click on chart for manual drawings
  const handleChartClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (drawingMode === 'none') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const targetPrice = getPriceFromY(clickY);

    setManualLines((prev) => [
      ...prev,
      {
        id: `line-${Date.now()}`,
        price: targetPrice,
        type: drawingMode as 'support' | 'resistance',
      },
    ]);
    setDrawingMode('none');
  };

  // Active inspected candle
  const inspectedCandle = hoveredIndex !== null && chartData[hoveredIndex] ? chartData[hoveredIndex] : chartData[chartData.length - 1];

  return (
    <div className="flex flex-col w-full rounded-xl overflow-hidden border border-slate-800 shadow-lg bg-[#090d14]">
      {/* Top Workspace Toolbar */}
      <div className="px-3 py-2 bg-[#0b0f17] border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        {/* Left: Asset Selector & Live Quote */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Quick Asset Selector Buttons */}
          <div className="flex items-center gap-1 bg-[#080c12] p-0.5 rounded border border-slate-800">
            {QUICK_ASSETS.map((a) => (
              <button
                key={a.id}
                onClick={() => onSelectAsset(a.id)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  selectedAsset === a.id
                    ? 'bg-cyan-500 text-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>

          {/* Current Asset Info */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <span className="text-base font-bold text-white">
              {selectedAsset}/USDT
            </span>
            <span className="text-sm font-bold font-mono text-cyan-300">
              ${currentPrice > 0 ? currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '---'}
            </span>
            <span
              className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                priceChange24h >= 0
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              }`}
            >
              {priceChange24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {priceChange24h >= 0 ? '+' : ''}
              {priceChange24h.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Center: Timeframe Picker */}
        <div className="flex items-center gap-1 bg-[#080c12] p-0.5 rounded border border-slate-800">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange(tf)}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                timeframe === tf
                  ? 'bg-cyan-500 text-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Right: Manual Drawing Tools */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setDrawingMode((prev) => (prev === 'support' ? 'none' : 'support'))}
            className={`px-2 py-1 rounded text-[11px] font-mono font-bold border transition-all cursor-pointer ${
              drawingMode === 'support'
                ? 'bg-emerald-500 text-black border-emerald-400'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
            }`}
            title="Click on the chart to place a manual support level"
          >
            + DRAW SUPPORT
          </button>
          <button
            onClick={() => setDrawingMode((prev) => (prev === 'resistance' ? 'none' : 'resistance'))}
            className={`px-2 py-1 rounded text-[11px] font-mono font-bold border transition-all cursor-pointer ${
              drawingMode === 'resistance'
                ? 'bg-rose-500 text-black border-rose-400'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
            }`}
            title="Click on the chart to place a manual resistance level"
          >
            + DRAW RESISTANCE
          </button>
          {manualLines.length > 0 && (
            <button
              onClick={() => setManualLines([])}
              className="px-2 py-1 rounded text-[10px] font-mono text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 cursor-pointer"
            >
              CLEAR ({manualLines.length})
            </button>
          )}
        </div>
      </div>

      {/* Chart Overlay Toggles Bar */}
      <div className="px-3 py-1.5 bg-[#080c12] border-b border-slate-800 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-300 gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 uppercase tracking-wider text-[10px]">
            Overlays:
          </span>

          {/* S/R Toggle */}
          <button
            onClick={() => setShowSR(!showSR)}
            className={`px-2 py-0.5 rounded border transition-colors cursor-pointer text-[10px] ${
              showSR ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold' : 'opacity-40 border-slate-700'
            }`}
          >
            S/R LEVELS
          </button>

          {/* FVG Toggle */}
          <button
            onClick={() => setShowFVG(!showFVG)}
            className={`px-2 py-0.5 rounded border transition-colors cursor-pointer text-[10px] ${
              showFVG ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold' : 'opacity-40 border-slate-700'
            }`}
          >
            FVG ZONES
          </button>

          {/* VWAP Toggle */}
          <button
            onClick={() => setShowVWAP(!showVWAP)}
            className={`px-2 py-0.5 rounded border transition-colors cursor-pointer text-[10px] ${
              showVWAP ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-bold' : 'opacity-40 border-slate-700'
            }`}
          >
            VWAP
          </button>

          {/* Order Blocks */}
          <button
            onClick={() => setShowOrderBlocks(!showOrderBlocks)}
            className={`px-2 py-0.5 rounded border transition-colors cursor-pointer text-[10px] ${
              showOrderBlocks ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 font-bold' : 'opacity-40 border-slate-700'
            }`}
          >
            ORDER BLOCKS
          </button>

          {/* Sweeps */}
          <button
            onClick={() => setShowSweeps(!showSweeps)}
            className={`px-2 py-0.5 rounded border transition-colors cursor-pointer text-[10px] ${
              showSweeps ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold' : 'opacity-40 border-slate-700'
            }`}
          >
            LIQUIDITY SWEEPS
          </button>

          {/* Market Structure */}
          <button
            onClick={() => setShowStructure(!showStructure)}
            className={`px-2 py-0.5 rounded border transition-colors cursor-pointer text-[10px] ${
              showStructure ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold' : 'opacity-40 border-slate-700'
            }`}
          >
            STRUCTURE (BOS/CHoCH)
          </button>

          {/* EMAs */}
          <button
            onClick={() => setShowEMAs(!showEMAs)}
            className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
              showEMAs ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-bold' : 'opacity-40 border-slate-700'
            }`}
          >
            EMAs (20/50)
          </button>
        </div>

        {/* Live Candle Inspector HUD */}
        {inspectedCandle && (
          <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 bg-[#0c1017] px-2.5 py-0.5 rounded border border-slate-800">
            <span>
              O: <strong className="text-white">${inspectedCandle.open.toFixed(2)}</strong>
            </span>
            <span>
              H: <strong className="text-emerald-400">${inspectedCandle.high.toFixed(2)}</strong>
            </span>
            <span>
              L: <strong className="text-rose-400">${inspectedCandle.low.toFixed(2)}</strong>
            </span>
            <span>
              C: <strong className="text-cyan-400">${inspectedCandle.close.toFixed(2)}</strong>
            </span>
            <span>
              VOL: <strong className="text-slate-300">{(inspectedCandle.volume / 1000).toFixed(1)}k</strong>
            </span>
          </div>
        )}
      </div>

      {/* CENTRAL ADVANCED CHART CANVAS — MANDATORY PURE WHITE BACKGROUND #FFFFFF */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden select-none"
        style={{
          backgroundColor: '#FFFFFF', // CRITICAL: MANDATORY PURE WHITE CANVAS IN BOTH THEMES
          minHeight: `${chartHeight}px`,
        }}
      >
        {loadingCandles ? (
          <div className="w-full h-[440px] flex flex-col items-center justify-center gap-2 font-mono text-xs text-slate-700">
            <RefreshCw className="w-6 h-6 animate-spin text-cyan-600" />
            <span>Streaming Bitget MCP Candles...</span>
          </div>
        ) : chartData.length === 0 ? (
          <div className="w-full h-[440px] flex items-center justify-center font-mono text-xs text-slate-500">
            No candle data available for {selectedAsset}
          </div>
        ) : (
          <svg
            className="w-full h-[440px] cursor-crosshair block"
            viewBox={`0 0 800 ${chartHeight}`}
            preserveAspectRatio="none"
            onClick={handleChartClick}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const fraction = (x - paddingLeft) / (rect.width - paddingLeft - paddingRight);
              const index = Math.round(fraction * (chartData.length - 1));
              if (index >= 0 && index < chartData.length) {
                setHoveredIndex(index);
              }
            }}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <defs>
              {/* Patterns & gradients for overlays */}
              <pattern id="fvgBullPattern" width="6" height="6" patternUnits="userSpaceOnUse">
                <line x1="0" y1="6" x2="6" y2="0" stroke="#08AFC0" strokeWidth="1" strokeOpacity="0.4" />
              </pattern>
              <pattern id="fvgBearPattern" width="6" height="6" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="6" y2="6" stroke="#111827" strokeWidth="1" strokeOpacity="0.3" />
              </pattern>
            </defs>

            {/* Horizontal Gridlines & Right Price Scale */}
            {[0, 0.25, 0.5, 0.75, 1].map((frac, idx) => {
              const p = minPrice + (1 - frac) * priceRange;
              const y = paddingTop + frac * effectiveHeight;
              return (
                <g key={`grid-${idx}`}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={800 - paddingRight}
                    y2={y}
                    stroke="#E5E7EB"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={800 - paddingRight + 6}
                    y={y + 3.5}
                    fill="#374151"
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="600"
                  >
                    ${p.toFixed(p > 100 ? 1 : p > 1 ? 2 : 4)}
                  </text>
                </g>
              );
            })}

            {/* OVERLAY: Order Blocks */}
            {showOrderBlocks &&
              smc?.orderBlocks?.slice(0, 3).map((ob, idx) => {
                const topY = getY(Math.max(ob.top, ob.bottom));
                const botY = getY(Math.min(ob.top, ob.bottom));
                const h = Math.max(3, botY - topY);
                const isBull = ob.type === 'BULLISH';
                return (
                  <g key={`ob-${idx}`}>
                    <rect
                      x={paddingLeft}
                      y={topY}
                      width={800 - paddingLeft - paddingRight}
                      height={h}
                      fill={isBull ? '#08AFC0' : '#111827'}
                      fillOpacity={isBull ? 0.09 : 0.07}
                      stroke={isBull ? '#08AFC0' : '#111827'}
                      strokeWidth="1"
                      strokeDasharray="4 2"
                    />
                    <text
                      x={paddingLeft + 8}
                      y={topY + 11}
                      fill={isBull ? '#08AFC0' : '#111827'}
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {isBull ? '▲ BULLISH ORDER BLOCK' : '▼ BEARISH ORDER BLOCK'}
                    </text>
                  </g>
                );
              })}

            {/* OVERLAY: Fair Value Gaps (FVG) */}
            {showFVG &&
              smc?.fvg?.slice(0, 3).map((fvg, idx) => {
                const topY = getY(Math.max(fvg.top, fvg.bottom));
                const botY = getY(Math.min(fvg.top, fvg.bottom));
                const h = Math.max(3, botY - topY);
                const isBull = fvg.type === 'BULLISH';
                return (
                  <g key={`fvg-${idx}`}>
                    <rect
                      x={paddingLeft}
                      y={topY}
                      width={800 - paddingLeft - paddingRight}
                      height={h}
                      fill={isBull ? 'url(#fvgBullPattern)' : 'url(#fvgBearPattern)'}
                      stroke={isBull ? '#08AFC0' : '#111827'}
                      strokeWidth="1"
                    />
                    <text
                      x={800 - paddingRight - 100}
                      y={topY + 10}
                      fill={isBull ? '#068d9c' : '#1f2937'}
                      fontSize="8.5"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      FVG IMBALANCE [{isBull ? '+' : '-'}]
                    </text>
                  </g>
                );
              })}

            {/* OVERLAY: Auto Support & Resistance Levels */}
            {showSR && (
              <>
                {smc?.supportLevels?.slice(0, 2).map((lvl, idx) => {
                  const y = getY(lvl);
                  return (
                    <g key={`sr-sup-${idx}`}>
                      <line
                        x1={paddingLeft}
                        y1={y}
                        x2={800 - paddingRight}
                        y2={y}
                        stroke="#08AFC0"
                        strokeWidth="1.5"
                        strokeDasharray="4 2"
                      />
                      <rect x={paddingLeft + 4} y={y - 8} width="85" height="14" rx="2" fill="#08AFC0" />
                      <text x={paddingLeft + 8} y={y + 2.5} fill="#FFFFFF" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                        SUPPORT ${lvl.toFixed(1)}
                      </text>
                    </g>
                  );
                })}

                {smc?.resistanceLevels?.slice(0, 2).map((lvl, idx) => {
                  const y = getY(lvl);
                  return (
                    <g key={`sr-res-${idx}`}>
                      <line
                        x1={paddingLeft}
                        y1={y}
                        x2={800 - paddingRight}
                        y2={y}
                        stroke="#111827"
                        strokeWidth="1.5"
                        strokeDasharray="4 2"
                      />
                      <rect x={paddingLeft + 4} y={y - 8} width="105" height="14" rx="2" fill="#111827" />
                      <text x={paddingLeft + 8} y={y + 2.5} fill="#FFFFFF" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                        RESISTANCE ${lvl.toFixed(1)}
                      </text>
                    </g>
                  );
                })}
              </>
            )}

            {/* User Manual Drawn S/R Lines */}
            {manualLines.map((line) => {
              const y = getY(line.price);
              const isSup = line.type === 'support';
              return (
                <g key={line.id}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={800 - paddingRight}
                    y2={y}
                    stroke={isSup ? '#10b981' : '#f43f5e'}
                    strokeWidth="2"
                  />
                  <rect
                    x={800 - paddingRight - 110}
                    y={y - 8}
                    width="105"
                    height="16"
                    rx="3"
                    fill={isSup ? '#10b981' : '#f43f5e'}
                  />
                  <text
                    x={800 - paddingRight - 105}
                    y={y + 3.5}
                    fill="#ffffff"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {isSup ? 'USER SUPPORT' : 'USER RESISTANCE'} ${line.price.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {/* OVERLAY: EMAs */}
            {showEMAs && (
              <>
                {/* EMA 20 line (Amber/Orange) */}
                <path
                  d={calculatedOverlays.ema20Arr.reduce((acc, pt, i) => {
                    const cmd = i === 0 ? 'M' : 'L';
                    return `${acc} ${cmd} ${getX(pt.x)} ${getY(pt.y)}`;
                  }, '')}
                  fill="none"
                  stroke="#D97706"
                  strokeWidth="1.5"
                  strokeOpacity="0.85"
                />
                {/* EMA 50 line (Violet) */}
                <path
                  d={calculatedOverlays.ema50Arr.reduce((acc, pt, i) => {
                    const cmd = i === 0 ? 'M' : 'L';
                    return `${acc} ${cmd} ${getX(pt.x)} ${getY(pt.y)}`;
                  }, '')}
                  fill="none"
                  stroke="#7C3AED"
                  strokeWidth="1.5"
                  strokeOpacity="0.8"
                />
              </>
            )}

            {/* OVERLAY: VWAP (Purple dashed) */}
            {showVWAP && indicators?.vwap && (
              <g>
                <line
                  x1={paddingLeft}
                  y1={getY(indicators.vwap)}
                  x2={800 - paddingRight}
                  y2={getY(indicators.vwap)}
                  stroke="#9333EA"
                  strokeWidth="2"
                  strokeDasharray="6 3"
                />
                <rect x={800 - paddingRight - 85} y={getY(indicators.vwap) - 8} width="80" height="15" rx="3" fill="#9333EA" />
                <text x={800 - paddingRight - 80} y={getY(indicators.vwap) + 3} fill="#FFFFFF" fontSize="9" fontFamily="monospace" fontWeight="bold">
                  VWAP ${indicators.vwap.toFixed(1)}
                </text>
              </g>
            )}

            {/* Volume Sub-bars at bottom of canvas */}
            {chartData.map((c, i) => {
              const x = getX(i);
              const maxVol = Math.max(...chartData.map((d) => d.volume)) || 1;
              const volHeight = (c.volume / maxVol) * 45;
              const y = chartHeight - paddingBottom - volHeight;
              const isBull = c.close >= c.open;
              return (
                <rect
                  key={`vol-${i}`}
                  x={x - candleWidth / 2}
                  y={y}
                  width={candleWidth}
                  height={volHeight}
                  fill={isBull ? '#08AFC0' : '#111827'}
                  fillOpacity="0.18"
                />
              );
            })}

            {/* CANDLESTICKS (Bullish = #08AFC0, Bearish = #111827) */}
            {chartData.map((c, i) => {
              const x = getX(i);
              const openY = getY(c.open);
              const closeY = getY(c.close);
              const highY = getY(c.high);
              const lowY = getY(c.low);

              const isBullish = c.close >= c.open;
              // Bullish: Cyan #08AFC0, Bearish: Black #111827
              const candleColor = isBullish ? '#08AFC0' : '#111827';

              const bodyTop = Math.min(openY, closeY);
              const bodyHeight = Math.max(2, Math.abs(closeY - openY));

              return (
                <g key={`candle-${i}`} className="transition-opacity hover:opacity-80">
                  {/* Upper and Lower Wicks */}
                  <line
                    x1={x}
                    y1={highY}
                    x2={x}
                    y2={lowY}
                    stroke={candleColor}
                    strokeWidth="1.5"
                  />

                  {/* Candle Body */}
                  <rect
                    x={x - candleWidth / 2}
                    y={bodyTop}
                    width={candleWidth}
                    height={bodyHeight}
                    fill={candleColor}
                    stroke={candleColor}
                    strokeWidth="1"
                    rx="1"
                  />
                </g>
              );
            })}

            {/* OVERLAY: Market Structure Labels (HH, HL, LH, LL, BOS) */}
            {showStructure &&
              chartData.slice(-15).map((c, idx, arr) => {
                const globalIdx = chartData.length - 15 + idx;
                const x = getX(globalIdx);
                // Simple pivot detector
                if (idx > 1 && idx < arr.length - 1) {
                  const prev = arr[idx - 1];
                  const next = arr[idx + 1];
                  if (c.high > prev.high && c.high > next.high) {
                    return (
                      <g key={`struct-h-${globalIdx}`}>
                        <text
                          x={x}
                          y={getY(c.high) - 6}
                          textAnchor="middle"
                          fill="#111827"
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          HH
                        </text>
                      </g>
                    );
                  }
                  if (c.low < prev.low && c.low < next.low) {
                    return (
                      <g key={`struct-l-${globalIdx}`}>
                        <text
                          x={x}
                          y={getY(c.low) + 12}
                          textAnchor="middle"
                          fill="#08AFC0"
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          HL
                        </text>
                      </g>
                    );
                  }
                }
                return null;
              })}

            {/* Hover Crosshair & Data Inspector Line */}
            {hoveredIndex !== null && (
              <g pointerEvents="none">
                <line
                  x1={getX(hoveredIndex)}
                  y1={paddingTop}
                  x2={getX(hoveredIndex)}
                  y2={chartHeight - paddingBottom}
                  stroke="#4B5563"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <circle
                  cx={getX(hoveredIndex)}
                  cy={getY(chartData[hoveredIndex].close)}
                  r="4"
                  fill="#08AFC0"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
              </g>
            )}
          </svg>
        )}
      </div>

      {/* Bottom Chart Footer Metrics */}
      <div className="px-4 py-2 bg-[#0c1017] border-t border-slate-800 flex flex-wrap items-center justify-between text-xs font-mono text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#08AFC0]" />
            <span className="text-slate-300">Bullish: #08AFC0</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#111827] border border-slate-600" />
            <span className="text-slate-300">Bearish: #111827</span>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-cyan-400 font-bold">CANVAS: #FFFFFF HARDLOCKED</span>
          <span className="text-slate-600">|</span>
          <span className="text-amber-400">RSI(14): {indicators?.rsi14 || 52}</span>
          <span className="text-emerald-400">ADX(14): {indicators?.adx14 || 28}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500">FEED: BITGET MCP LIVE</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>
    </div>
  );
};
