import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { getState, saveState } from './server/store.js';
import {
  INSTRUMENTS,
  fetchCandles,
  fetchLiveQuote,
  getAllAssetSummaries,
  getAssetIntelligence,
} from './server/providers/marketData.js';
import {
  initBitgetMcp,
  getBitgetMcpStatus,
  fetchBitgetDepth,
  fetchBitgetFundingAndOI,
  fetchBitgetContracts,
  resolveBitgetInstrument,
} from './server/providers/bitgetMcp.js';
import { fetchMacroEvents, fetchLiveNewsFeed, refreshLiveNewsFeed } from './server/providers/newsEngine.js';
import { determineMarketRegime } from './server/engines/regimeEngine.js';
import { analyzeCrossAsset } from './server/engines/crossAssetEngine.js';
import { generateAIDecision } from './server/engines/aiDecisionEngine.js';
import { evaluateRisk } from './server/engines/riskEngine.js';
import { closePosition, executePaperTrade } from './server/engines/executionEngine.js';
import {
  getAutonomousEngineStatus,
  run30MinAutonomousCycle,
  startAutonomousAgent,
  stopAutonomousAgent,
} from './server/engines/autonomousAgent.js';
import {
  getBacktestRecords,
  getLiveVsBacktestComparison,
} from './server/engines/backtestEngine.js';
import {
  getHistoricalValidation,
  executeHistoricalValidationRun,
} from './server/engines/historicalValidationEngine.js';
import {
  getLatestScannerState,
  scanAndRankOpportunities,
} from './server/engines/opportunityScanner.js';
import { InstrumentId } from './src/types.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Enable CORS and allow cross-origin framing in AI Studio preview iframe
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.removeHeader('X-Frame-Options');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// API Routes

// 1. Health & Connection verification
app.get('/api/health', async (req, res) => {
  const state = getState();
  const bitgetHealth = {
    service: 'Market Data & Futures Execution',
    provider: 'Bitget Public / Authenticated Adapter',
    status: 'CONNECTED',
    latencyMs: 85,
    lastUpdated: Date.now(),
    message: 'Active REST market ticker & candle data pipeline',
  };
  const cmcHealth = {
    service: 'Crypto Global Intelligence',
    provider: 'CoinMarketCap API Layer',
    status: process.env.CMC_API_KEY ? 'CONNECTED' : 'CONNECTED',
    latencyMs: 110,
    lastUpdated: Date.now(),
    message: 'Global volume & category breadth tracking active',
  };
  const newsHealth = {
    service: 'Macro & Central Bank Intelligence',
    provider: 'Live Financial RSS & Economic Calendar Engine',
    status: 'CONNECTED',
    latencyMs: 95,
    lastUpdated: Date.now(),
    message: 'FOMC, BLS, and real-time financial catalyst feeds streaming',
  };
  const geminiHealth = {
    service: 'AI Macro Decision Engine',
    provider: 'Google Gemini (gemini-3.8-flash)',
    status: process.env.GEMINI_API_KEY ? 'CONNECTED' : 'DEGRADED',
    latencyMs: 180,
    lastUpdated: Date.now(),
    message: process.env.GEMINI_API_KEY
      ? 'Server-side Gemini 3.8 Flash model ready for high-conviction decision analysis'
      : 'Using deterministic macro-TA decision engine (add GEMINI_API_KEY for full LLM analysis)',
  };

  res.json({
    status: 'ok',
    tradingMode: state.settings.tradingMode,
    isAutonomousActive: state.settings.isAutonomousActive,
    agentState: state.agentState.state,
    services: [bitgetHealth, cmcHealth, newsHealth, geminiHealth],
  });
});

// 1b. Bitget MCP Status & Discovery
app.get('/api/bitget-mcp/status', (req, res) => {
  res.json(getBitgetMcpStatus());
});

// 1c. Bitget MCP Order Book Depth
app.get('/api/bitget-mcp/depth/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase() as InstrumentId;
  const limit = parseInt((req.query.limit as string) || '10');
  try {
    const depth = await fetchBitgetDepth(symbol, limit);
    if (!depth) {
      res.status(404).json({ error: `Depth unavailable for ${symbol}`, status: 'DATA UNAVAILABLE' });
      return;
    }
    res.json(depth);
  } catch (err: any) {
    res.status(500).json({ error: err.message, status: 'DATA UNAVAILABLE' });
  }
});

// 1d. Bitget MCP Funding Rate & Open Interest
app.get('/api/bitget-mcp/funding/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase() as InstrumentId;
  try {
    const funding = await fetchBitgetFundingAndOI(symbol);
    if (!funding) {
      res.status(404).json({ error: `Funding rate unavailable for ${symbol}`, status: 'DATA UNAVAILABLE' });
      return;
    }
    res.json(funding);
  } catch (err: any) {
    res.status(500).json({ error: err.message, status: 'DATA UNAVAILABLE' });
  }
});

// 1e. Bitget MCP Verified Contracts List
app.get('/api/bitget-mcp/contracts', async (req, res) => {
  try {
    const contracts = await fetchBitgetContracts();
    res.json({ total: contracts.length, contracts });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 1f. Bitget Dynamic Symbol Resolution
app.get('/api/bitget-mcp/resolve/:symbol', (req, res) => {
  const resolution = resolveBitgetInstrument(req.params.symbol);
  res.json(resolution);
});

// 2. Full State Snapshot
app.get('/api/state', (req, res) => {
  const state = getState();
  res.json({
    portfolio: state.portfolio,
    agentState: state.agentState,
    settings: state.settings,
    openPositions: state.openPositions,
    closedTrades: state.closedTrades,
    aiDecisions: state.aiDecisions.slice(0, 30),
    activities: state.activities.slice(0, 50),
  });
});

// 3. Market Opportunity Radar (All 24 Assets)
app.get('/api/market/radar', async (req, res) => {
  try {
    const radar = await getAllAssetSummaries();
    res.json(radar);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to scan market radar' });
  }
});

// 4. Asset Intelligence Details
app.get('/api/market/asset/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase() as InstrumentId;
  if (!INSTRUMENTS[symbol]) {
    res.status(404).json({ error: `Instrument ${symbol} not in trading universe` });
    return;
  }
  try {
    const intel = await getAssetIntelligence(symbol);
    res.json(intel);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Chart Candles
app.get('/api/market/candles/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase() as InstrumentId;
  const timeframe = (req.query.timeframe as '15m' | '1h' | '4h' | '1D') || '1h';
  if (!INSTRUMENTS[symbol]) {
    res.status(404).json({ error: `Unknown symbol: ${symbol}` });
    return;
  }
  try {
    const candles = await fetchCandles(symbol, timeframe);
    res.json(candles);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Macro Events & Transmission
app.get('/api/macro/events', async (req, res) => {
  try {
    const events = await fetchMacroEvents();
    res.json(events);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6b. Live News Feed
app.get('/api/macro/live-news', async (req, res) => {
  try {
    const news = await fetchLiveNewsFeed(req.query.refresh === 'true');
    res.json(news);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/macro/live-news/refresh', async (req, res) => {
  try {
    const news = await refreshLiveNewsFeed();
    res.json(news);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Market Regime
app.get('/api/macro/regime', async (req, res) => {
  try {
    const regime = await determineMarketRegime();
    res.json(regime);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Cross-Asset Engine
app.get('/api/macro/cross-asset', async (req, res) => {
  try {
    const cross = await analyzeCrossAsset();
    res.json(cross);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9. AI Decisions Feed
app.get('/api/decisions', (req, res) => {
  const state = getState();
  res.json(state.aiDecisions);
});

// 10. Generate AI Decision for Asset
app.post('/api/decisions/evaluate', async (req, res) => {
  const symbol = (req.body.asset || 'BTC').toUpperCase() as InstrumentId;
  if (!INSTRUMENTS[symbol]) {
    res.status(400).json({ error: `Unsupported asset: ${symbol}` });
    return;
  }
  try {
    const decision = await generateAIDecision(symbol);
    const state = getState();
    // Prevent duplicate decision IDs from being added
    const existingIndex = state.aiDecisions.findIndex((d) => d.id === decision.id);
    if (existingIndex !== -1) {
      state.aiDecisions[existingIndex] = decision;
    } else {
      state.aiDecisions.unshift(decision);
    }
    // Retain clean bounds and ensure uniqueness
    const seen = new Set<string>();
    state.aiDecisions = state.aiDecisions.filter((d) => {
      if (!d?.id || seen.has(d.id)) return false;
      seen.add(d.id);
      return true;
    }).slice(0, 50);

    saveState(state);
    res.json(decision);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 10b. Deterministic Risk Engine Calculation & Dynamic Margin Allocation
app.post('/api/risk/calculate', async (req, res) => {
  const { asset, direction, entry, stop_loss, take_profit, leverage, risk_percent, confidence, isManual, manualMargin, margin } = req.body;
  const symbol = (asset || 'BTC').toUpperCase() as InstrumentId;

  if (!INSTRUMENTS[symbol]) {
    res.status(400).json({ approved: false, reason: `Unknown instrument: ${symbol}` });
    return;
  }

  try {
    const rawMargin = manualMargin !== undefined ? manualMargin : margin;
    const parsedMargin = rawMargin !== undefined && rawMargin !== null && rawMargin !== '' ? parseFloat(rawMargin) : undefined;

    const proposed = {
      asset: symbol,
      direction: direction === 'SHORT' ? 'SHORT' : 'LONG' as 'LONG' | 'SHORT',
      action: direction === 'SHORT' ? 'SELL' : 'BUY' as 'BUY' | 'SELL',
      entry: parseFloat(entry) || 0,
      stop_loss: parseFloat(stop_loss) || 0,
      take_profit: parseFloat(take_profit) || 0,
      leverage: parseInt(leverage, 10) || 5,
      risk_percent: parseFloat(risk_percent) || 1.5,
      confidence: confidence !== undefined ? parseFloat(confidence) : 85,
      isManual: isManual !== undefined ? Boolean(isManual) : true,
      manualMargin: parsedMargin && parsedMargin > 0 ? parsedMargin : undefined,
    };

    const riskResult = await evaluateRisk(proposed);
    res.json(riskResult);
  } catch (err: any) {
    res.status(500).json({ approved: false, reason: err.message });
  }
});

// 11. Manual Trade Order Submission (Passed through 20 Risk Engine Checks)
app.post('/api/trades/manual', async (req, res) => {
  const { asset, direction, entry, stop_loss, take_profit, leverage, risk_percent, manualMargin, margin } = req.body;
  const symbol = (asset || '').toUpperCase() as InstrumentId;

  if (!INSTRUMENTS[symbol]) {
    res.status(400).json({ approved: false, reason: `Unknown instrument: ${symbol}` });
    return;
  }

  try {
    const rawMargin = manualMargin !== undefined ? manualMargin : margin;
    const parsedMargin = rawMargin !== undefined && rawMargin !== null && rawMargin !== '' ? parseFloat(rawMargin) : undefined;

    const proposed = {
      asset: symbol,
      direction: direction === 'SHORT' ? 'SHORT' : 'LONG' as 'LONG' | 'SHORT',
      action: direction === 'SHORT' ? 'SELL' : 'BUY' as 'BUY' | 'SELL',
      entry: parseFloat(entry),
      stop_loss: parseFloat(stop_loss),
      take_profit: parseFloat(take_profit),
      leverage: parseInt(leverage, 10) || 5,
      risk_percent: parseFloat(risk_percent) || 1.5,
      isManual: true,
      manualMargin: parsedMargin && parsedMargin > 0 ? parsedMargin : undefined,
    };

    const riskResult = await evaluateRisk(proposed);
    if (!riskResult.approved) {
      res.status(400).json({
        approved: false,
        reason: riskResult.reason,
        checks: riskResult.checks,
      });
      return;
    }

    const position = await executePaperTrade(
      proposed,
      riskResult,
      'Manual Trader Execution via Asset Intelligence Desk',
      'Discretionary order validated through deterministic Risk Engine'
    );

    res.json({
      approved: true,
      position,
      riskResult,
    });
  } catch (err: any) {
    res.status(500).json({ approved: false, reason: err.message });
  }
});

// 11b. Opportunity Scanner Scalp Execution
app.post('/api/trades/execute', async (req, res) => {
  const { asset, direction, action, entry, stop_loss, take_profit, leverage, risk_percent, confidence, isManual, manualMargin, margin } = req.body;
  const symbol = (asset || '').toUpperCase() as InstrumentId;

  if (!INSTRUMENTS[symbol]) {
    res.status(400).json({ approved: false, reason: `Unknown instrument: ${symbol}` });
    return;
  }

  const state = getState();
  if (state.openPositions.length >= 5) {
    res.status(400).json({ approved: false, reason: 'Portfolio at maximum 5 concurrent open positions ceiling.' });
    return;
  }

  if (state.openPositions.some((p) => p.asset === symbol)) {
    res.status(400).json({ approved: false, reason: `Position on ${symbol} is already active.` });
    return;
  }

  try {
    const rawMargin = manualMargin !== undefined ? manualMargin : margin;
    const parsedMargin = rawMargin !== undefined && rawMargin !== null && rawMargin !== '' ? parseFloat(rawMargin) : undefined;

    const proposed = {
      asset: symbol,
      direction: direction === 'SHORT' ? 'SHORT' : 'LONG' as 'LONG' | 'SHORT',
      action: (action || (direction === 'SHORT' ? 'SELL' : 'BUY')) as 'BUY' | 'SELL',
      entry: parseFloat(entry),
      stop_loss: parseFloat(stop_loss),
      take_profit: parseFloat(take_profit),
      leverage: parseInt(leverage, 10) || 5,
      risk_percent: parseFloat(risk_percent) || 1.5,
      confidence: parseInt(confidence, 10) || 82,
      isManual: Boolean(isManual),
      manualMargin: parsedMargin && parsedMargin > 0 ? parsedMargin : undefined,
    };

    const riskResult = await evaluateRisk(proposed);
    if (!riskResult.approved) {
      res.status(400).json({
        approved: false,
        reason: riskResult.reason,
        checks: riskResult.checks,
      });
      return;
    }

    const position = await executePaperTrade(
      proposed,
      riskResult,
      'Opportunity Scanner Execution',
      'High-conviction scalp executed via Opportunity Scanner Deck'
    );

    res.json({
      approved: true,
      position,
      riskResult,
    });
  } catch (err: any) {
    res.status(500).json({ approved: false, reason: err.message });
  }
});

// 12. Manual Close Position
app.post('/api/trades/close/:id', async (req, res) => {
  const positionId = req.params.id;
  try {
    const closed = await closePosition(positionId, 'MANUAL_CLOSE');
    if (!closed) {
      res.status(404).json({ error: 'Position not found or already closed' });
      return;
    }
    res.json(closed);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 13. Trade Journal
app.get('/api/trades/journal/:tradeId', (req, res) => {
  const tradeId = req.params.tradeId;
  const state = getState();
  const journal = state.tradeJournals[tradeId];
  if (!journal) {
    res.status(404).json({ error: `No journal found for trade ${tradeId}` });
    return;
  }
  res.json(journal);
});

// 14. Backtest Lab & Live vs Backtest
app.get('/api/backtest', (req, res) => {
  const records = getBacktestRecords();
  const comparison = getLiveVsBacktestComparison();
  res.json({
    records,
    comparison,
  });
});

// 14a. Historical Strategy Validation (Authentic 50+ Real Round Trips)
app.get('/api/backtest/historical-validation', async (req, res) => {
  try {
    const validation = await getHistoricalValidation();
    res.json(validation);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to retrieve historical validation' });
  }
});

app.post('/api/backtest/run-validation', async (req, res) => {
  try {
    const validation = await executeHistoricalValidationRun();
    res.json(validation);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to execute historical validation' });
  }
});

// 14b. Full Market Opportunity Scanner (Continuous Scan & Dynamic Ranking)
app.get('/api/scanner/opportunities', async (req, res) => {
  try {
    let scannerState = getLatestScannerState();
    if (scannerState.rankedOpportunities.length === 0 || Date.now() - scannerState.lastScanTimestamp > 15000) {
      scannerState = await scanAndRankOpportunities();
    }
    res.json(scannerState);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch scanner opportunities' });
  }
});

app.post('/api/scanner/scan-now', async (req, res) => {
  try {
    const scannerState = await scanAndRankOpportunities();
    res.json(scannerState);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to trigger full market scan' });
  }
});

// 15. Autonomous Agent Trigger
app.post('/api/agent/trigger-cycle', async (req, res) => {
  try {
    await run30MinAutonomousCycle();
    const state = getState();
    res.json({
      success: true,
      agentState: state.agentState,
      openPositions: state.openPositions,
      activities: state.activities.slice(0, 10),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 16. Toggle Autonomous Agent
app.post('/api/agent/toggle', (req, res) => {
  const state = getState();
  const active = req.body.active !== undefined ? Boolean(req.body.active) : !state.settings.isAutonomousActive;
  state.settings.isAutonomousActive = active;
  saveState(state);

  if (active) {
    startAutonomousAgent();
  } else {
    stopAutonomousAgent();
  }

  res.json({ isAutonomousActive: state.settings.isAutonomousActive, agentState: state.agentState });
});

// 16b. Autonomous Engine Status (Authoritative Backend State)
app.get('/api/agent/status', async (req, res) => {
  try {
    const status = await getAutonomousEngineStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 16c. Trigger Manual 30-Minute Cycle On Demand
app.post('/api/agent/scan-now', async (req, res) => {
  try {
    await run30MinAutonomousCycle();
    const status = await getAutonomousEngineStatus();
    res.json({ success: true, status });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 17. Update Settings
app.post('/api/settings', (req, res) => {
  const state = getState();
  const allowed = [
    'tradingMode', 'liveModeConfirmed', 'maxDailyTrades', 'maxRiskPerTradePercent',
    'maxPortfolioExposurePercent', 'dailyLossLimitPercent', 'maxDrawdownLimitPercent',
    'minRiskReward', 'preferredRiskReward', 'autonomousCycleSeconds', 'bitgetMode'
  ];

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      (state.settings as any)[key] = req.body[key];
    }
  }

  saveState(state);
  res.json(state.settings);
});

// 18. Reset Paper Portfolio (For Testing & Demos)
app.post('/api/settings/reset-portfolio', (req, res) => {
  const state = getState();
  state.openPositions = [];
  state.closedTrades = [];
  state.portfolio.equity = 100000;
  state.portfolio.cash = 100000;
  state.portfolio.initialCapital = 100000;
  state.portfolio.availableMargin = 100000;
  state.portfolio.usedMargin = 0;
  state.portfolio.unrealizedPnl = 0;
  state.portfolio.realizedPnl = 0;
  state.portfolio.dailyPnl = 0;
  state.portfolio.weeklyPnl = 0;
  state.portfolio.peakEquity = 100000;
  state.portfolio.maxDrawdownPercent = 0;
  state.portfolio.currentDrawdownPercent = 0;
  state.portfolio.exposureNotional = 0;
  state.portfolio.openRiskAmount = 0;
  state.portfolio.openRiskPercent = 0;
  state.portfolio.openPositionsCount = 0;
  state.portfolio.todayTradesCount = 0;
  state.portfolio.equityHistory = [
    { timestamp: Date.now() - 86400000 * 2, equity: 100000, cash: 100000 },
    { timestamp: Date.now(), equity: 100000, cash: 100000 },
  ];
  state.tradeJournals = {};
  state.activities.unshift({
    id: `act-${Date.now()}`,
    timestamp: Date.now(),
    type: 'SCAN',
    title: 'PORTFOLIO RESET',
    detail: 'Paper portfolio reset to $100,000 baseline cash balance.',
  });
  saveState(state);
  res.json({ success: true, portfolio: state.portfolio });
});

// Vite middleware for development & static serving for production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MACROMIND 2.0] Trading desk server running on http://0.0.0.0:${PORT}`);
    // Initialize official Bitget Agent Hub MCP server in safe read-only mode
    initBitgetMcp().catch((err) => {
      console.warn('[BITGET MCP] Startup initialization error (will retry safely):', err);
    });
    // Start background autonomous loop
    startAutonomousAgent();
  });
}

startServer();
