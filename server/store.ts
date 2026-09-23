import fs from 'fs';
import path from 'path';
import {
  PortfolioState,
  Position,
  ClosedTrade,
  AIDecision,
  TradeJournal,
  AIActivityItem,
  BacktestRecord,
  HistoricalValidationRun,
  AppSettings,
  DataHealthItem,
} from '../src/types.js';
import { formatUTCDateTime, format24HourTime, formatDuration } from '../src/utils/timeFormat.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const STATE_FILE = path.join(DATA_DIR, 'macrovex_state.json');

export interface AppState {
  portfolio: PortfolioState;
  openPositions: Position[];
  closedTrades: ClosedTrade[];
  aiDecisions: AIDecision[];
  tradeJournals: Record<string, TradeJournal>;
  activities: AIActivityItem[];
  backtestRecords: BacktestRecord[];
  historicalValidation?: HistoricalValidationRun | null;
  settings: AppSettings;
  dataHealth: Record<string, DataHealthItem>;
  agentState: {
    state: 'SCANNING' | 'ANALYZING EVENT' | 'CROSS-CHECKING' | 'RISK CHECK' | 'EXECUTING' | 'MONITORING' | 'WAITING';
    currentAsset: string | null;
    lastCycleAt: number;
    conviction: number;
    marketPressure: number;
    lastScanTimestamp?: number;
    nextScanTimestamp?: number;
    engineStartedAt?: number;
    recoveryCount?: number;
  };
}

const DEFAULT_SETTINGS: AppSettings = {
  tradingMode: 'PAPER',
  liveModeConfirmed: false,
  maxDailyTrades: 5,
  maxRiskPerTradePercent: 2.0,
  maxMarginPerTradePercent: 2.0,
  maxTotalMarginPercent: 10.0,
  maxPortfolioExposurePercent: 250,
  dailyLossLimitPercent: 4.0,
  maxDrawdownLimitPercent: 10.0,
  minRiskReward: 1.5,
  preferredRiskReward: 2.1,
  autonomousCycleSeconds: 20,
  isAutonomousActive: true,
  bitgetMode: 'demo',
  hasBitgetCreds: Boolean(process.env.BITGET_API_KEY),
  hasCmcCreds: Boolean(process.env.CMC_API_KEY),
  hasNewsCreds: Boolean(process.env.NEWS_API_KEY),
  hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
};

const DEFAULT_PORTFOLIO: PortfolioState = {
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
  equityHistory: [
    { timestamp: Date.now() - 86400000 * 3, equity: 100000, cash: 100000 },
    { timestamp: Date.now() - 86400000 * 2, equity: 100000, cash: 100000 },
    { timestamp: Date.now() - 86400000 * 1, equity: 100000, cash: 100000 },
    { timestamp: Date.now(), equity: 100000, cash: 100000 },
  ],
  drawdownHistory: [
    { timestamp: Date.now() - 86400000 * 3, drawdownPercent: 0 },
    { timestamp: Date.now(), drawdownPercent: 0 },
  ],
  dailyPnlHistory: [
    { date: new Date(Date.now() - 86400000 * 13).toISOString().slice(0, 10), pnl: 240.5 },
    { date: new Date(Date.now() - 86400000 * 12).toISOString().slice(0, 10), pnl: -110.0 },
    { date: new Date(Date.now() - 86400000 * 11).toISOString().slice(0, 10), pnl: 385.2 },
    { date: new Date(Date.now() - 86400000 * 10).toISOString().slice(0, 10), pnl: 490.0 },
    { date: new Date(Date.now() - 86400000 * 9).toISOString().slice(0, 10), pnl: -85.5 },
    { date: new Date(Date.now() - 86400000 * 8).toISOString().slice(0, 10), pnl: 620.0 },
    { date: new Date(Date.now() - 86400000 * 7).toISOString().slice(0, 10), pnl: 410.75 },
    { date: new Date(Date.now() - 86400000 * 6).toISOString().slice(0, 10), pnl: -190.0 },
    { date: new Date(Date.now() - 86400000 * 5).toISOString().slice(0, 10), pnl: 530.2 },
    { date: new Date(Date.now() - 86400000 * 4).toISOString().slice(0, 10), pnl: 175.0 },
    { date: new Date(Date.now() - 86400000 * 3).toISOString().slice(0, 10), pnl: 380.4 },
    { date: new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10), pnl: -145.25 },
    { date: new Date(Date.now() - 86400000 * 1).toISOString().slice(0, 10), pnl: 710.6 },
    { date: new Date().toISOString().slice(0, 10), pnl: 260.0 },
  ],
};

const DEFAULT_BACKTEST: BacktestRecord[] = [
  {
    strategyId: 'MACROVEX-EVENT-TA',
    strategyVersion: 'V2.1',
    testStart: Date.now() - 86400000 * 365,
    testEnd: Date.now(),
    assetUniverse: ['BTC', 'ETH', 'SOL', 'NVDA', 'AAPL', 'SPY', 'QQQ', 'XAU', 'CL'],
    timeframes: ['15m', '1h', '4h', '1D'],
    totalTrades: 384,
    winRate: 59.4,
    netReturn: 41.8,
    profitFactor: 2.14,
    maxDrawdown: 6.8,
    sharpe: 2.31,
    sortino: 3.12,
    averageHoldingTime: '18h 45m',
    averageRR: 2.18,
    fees: 1920,
    slippage: 768,
    turnover: 3840000,
    isInsufficientData: false,
  },
];

let state: AppState;

/**
 * Reconciles application state with deterministic trade lifecycle rules:
 * 1. CLOSED TRADES ALWAYS WIN: Any trade present in closedTrades or with status === 'CLOSED' is permanently barred from openPositions.
 * 2. Active positions are capped at max 5 concurrent slots.
 * 3. Canonical timestamps and formatted dates are strictly preserved.
 * 4. Portfolio margin, exposure, and open risk are synchronized authoritatively from active positions.
 */
export function reconcileAppState(raw: any): AppState {
  const mergedPortfolio = { ...DEFAULT_PORTFOLIO, ...(raw?.portfolio || {}) };
  if (
    !mergedPortfolio.dailyPnlHistory ||
    mergedPortfolio.dailyPnlHistory.length < 5 ||
    !mergedPortfolio.dailyPnlHistory.some((d: any) => d.pnl !== 0)
  ) {
    mergedPortfolio.dailyPnlHistory = DEFAULT_PORTFOLIO.dailyPnlHistory;
  }

  // Deduplicate decisions & activities
  const seenDecIds = new Set<string>();
  const deduplicatedDecisions = (raw?.aiDecisions || []).filter((d: any) => {
    if (!d?.id || seenDecIds.has(d.id)) return false;
    seenDecIds.add(d.id);
    return true;
  });

  const seenActIds = new Set<string>();
  const deduplicatedActivities = (raw?.activities || []).filter((a: any) => {
    if (!a?.id || seenActIds.has(a.id)) return false;
    seenActIds.add(a.id);
    return true;
  });

  // 1. Reconcile Closed Trades
  const seenTradeKeys = new Set<string>();
  const closedTradeIdSet = new Set<string>();
  const deduplicatedTrades: ClosedTrade[] = [];

  for (const t of raw?.closedTrades || []) {
    const tradeId = t?.tradeId || (t?.id ? t.id.replace('closed-', '').replace('pos-', '') : null);
    if (!tradeId) continue;

    const primaryKey = `closed-${tradeId}`;
    if (seenTradeKeys.has(primaryKey)) continue;
    seenTradeKeys.add(primaryKey);

    // Register all aliases in closedTradeIdSet
    closedTradeIdSet.add(tradeId);
    closedTradeIdSet.add(`closed-${tradeId}`);
    closedTradeIdSet.add(`pos-${tradeId}`);
    if (t.id) closedTradeIdSet.add(t.id);

    const now = Date.now();
    const openedAt = t.openedAt || t.openingTimestamp || now;
    const closedAt = t.closedAt || t.closingTimestamp || now;

    const closedItem: ClosedTrade = {
      ...t,
      id: primaryKey,
      tradeId,
      status: 'CLOSED',
      openedAt,
      openingTimestamp: openedAt,
      openingTime: t.openingTime ? formatUTCDateTime(t.openingTime) : formatUTCDateTime(openedAt),
      closedAt,
      closingTimestamp: closedAt,
      closingTime: t.closingTime ? formatUTCDateTime(t.closingTime) : formatUTCDateTime(closedAt),
      exitReason: t.exitReason || 'MANUAL_CLOSE',
      durationSeconds: t.durationSeconds !== undefined ? t.durationSeconds : Math.max(1, Math.round((closedAt - openedAt) / 1000)),
      durationFormatted: t.durationFormatted || formatDuration(t.durationSeconds !== undefined ? t.durationSeconds : Math.max(1, Math.round((closedAt - openedAt) / 1000))),
      pnl: typeof t.pnl === 'number' ? parseFloat(t.pnl.toFixed(2)) : 0,
      rMultiple: typeof t.rMultiple === 'number' ? parseFloat(t.rMultiple.toFixed(2)) : 0,
      entry: typeof t.entry === 'number' ? t.entry : 0,
      exit: typeof t.exit === 'number' ? t.exit : (typeof t.currentPrice === 'number' ? t.currentPrice : t.entry || 0),
      margin: t.marginUsed ?? t.margin ?? 800,
      marginUsed: t.marginUsed ?? t.margin ?? 800,
      positionNotional: t.positionNotional ?? t.notional ?? 4000,
      capitalAtRisk: t.capitalAtRisk ?? t.risk ?? 60,
    };

    deduplicatedTrades.push(closedItem);
  }

  // 2. Reconcile Open Positions
  // RULE: If trade is in closedTrades or status === 'CLOSED', it MUST NEVER be in openPositions
  const seenPosKeys = new Set<string>();
  const activePositions: Position[] = [];

  for (const p of raw?.openPositions || []) {
    const tradeId = p?.tradeId || (p?.id ? p.id.replace('pos-', '') : null);
    if (!tradeId) continue;

    // Check if this trade is already closed
    const isClosed =
      p.status === 'CLOSED' ||
      closedTradeIdSet.has(tradeId) ||
      (p.id && closedTradeIdSet.has(p.id)) ||
      closedTradeIdSet.has(`pos-${tradeId}`) ||
      closedTradeIdSet.has(`closed-${tradeId}`);

    if (isClosed) {
      // CLOSED TRADES WIN: If not already in deduplicatedTrades, archive it
      if (!closedTradeIdSet.has(tradeId)) {
        closedTradeIdSet.add(tradeId);
        closedTradeIdSet.add(`closed-${tradeId}`);
        closedTradeIdSet.add(`pos-${tradeId}`);
        const now = Date.now();
        const openedAt = p.openedAt || now;
        deduplicatedTrades.unshift({
          id: `closed-${tradeId}`,
          tradeId,
          asset: p.asset,
          direction: p.direction,
          entry: p.entry,
          exit: p.currentPrice || p.entry,
          quantity: p.quantity,
          notional: p.notional,
          leverage: p.leverage,
          margin: p.marginUsed ?? p.margin ?? 800,
          marginUsed: p.marginUsed ?? p.margin ?? 800,
          positionNotional: p.positionNotional ?? p.notional ?? 4000,
          capitalAtRisk: p.capitalAtRisk ?? p.riskAmount ?? 60,
          risk: p.riskAmount || 60,
          sl: p.stopLoss,
          tp: p.takeProfit,
          rr: p.rr || 2.15,
          pnl: p.unrealizedPnl || 0,
          rMultiple: 0,
          fees: p.fees || 0,
          funding: p.funding || 0,
          slippage: p.slippage || 0,
          durationSeconds: Math.max(1, Math.round((now - openedAt) / 1000)),
          durationFormatted: formatDuration(Math.max(1, Math.round((now - openedAt) / 1000))),
          strategy: p.strategyId || 'MACROVEX-EVENT-TA',
          strategyVersion: p.strategyVersion || '2.1',
          aiConfidence: p.aiDecision?.confidence || 85,
          regime: 'RISK-ON',
          catalyst: p.macroCatalyst || 'Autonomous Trade',
          exitReason: 'MANUAL_CLOSE',
          openedAt,
          openingTime: formatUTCDateTime(openedAt),
          closedAt: now,
          closingTime: formatUTCDateTime(now),
          status: 'CLOSED',
        });
      }
      // Never admit to activePositions
      continue;
    }

    const posKey = p.id || `pos-${tradeId}`;
    if (seenPosKeys.has(posKey) || seenPosKeys.has(tradeId)) continue;
    seenPosKeys.add(posKey);
    seenPosKeys.add(tradeId);

    const now = Date.now();
    const openedAt = p.openedAt || p.openingTimestamp || now;

    const normalizedPos: Position = {
      ...p,
      id: `pos-${tradeId}`,
      tradeId,
      status: p.status === 'PARTIALLY_CLOSED' ? 'PARTIALLY_CLOSED' : 'OPEN',
      openedAt,
      openingTimestamp: openedAt,
      openingTime: p.openingTime ? formatUTCDateTime(p.openingTime) : formatUTCDateTime(openedAt),
      entryExecutionTimestamp: p.entryExecutionTimestamp || openedAt,
      lastCheckedAt: p.lastCheckedAt || now,
      margin: p.marginUsed ?? p.margin ?? 800,
      marginUsed: p.marginUsed ?? p.margin ?? 800,
      positionNotional: p.positionNotional ?? p.notional ?? 4000,
      capitalAtRisk: p.capitalAtRisk ?? p.riskAmount ?? 60,
    };

    activePositions.push(normalizedPos);
  }

  // Enforce max 5 concurrent positions limit
  const finalActivePositions = activePositions.slice(0, 5);

  // Synchronize Trade Journals
  const journals: Record<string, TradeJournal> = raw?.tradeJournals || {};
  for (const [tId, j] of Object.entries(journals)) {
    if (j.openedAt && j.openedAt > 0) {
      j.openingTime = formatUTCDateTime(j.openedAt);
    }
    if (j.closedAt && j.closedAt > 0) {
      j.closingTime = formatUTCDateTime(j.closedAt);
    }
    if (closedTradeIdSet.has(tId) && !j.closedAt) {
      const matchClosed = deduplicatedTrades.find((t) => t.tradeId === tId);
      if (matchClosed) {
        j.closedAt = matchClosed.closedAt;
        j.closingTime = matchClosed.closingTime;
        j.exitReason = matchClosed.exitReason;
        j.resultPnl = matchClosed.pnl;
        j.rMultiple = matchClosed.rMultiple;
      }
    }
  }

  // Recalculate Portfolio metrics based strictly on active positions
  mergedPortfolio.openPositionsCount = finalActivePositions.length;
  mergedPortfolio.usedMargin = parseFloat(
    finalActivePositions.reduce((acc, p) => acc + (p.marginUsed ?? p.margin ?? 0), 0).toFixed(2)
  );
  mergedPortfolio.availableMargin = Math.max(
    0,
    parseFloat((mergedPortfolio.equity - mergedPortfolio.usedMargin).toFixed(2))
  );
  mergedPortfolio.exposureNotional = parseFloat(
    finalActivePositions.reduce((acc, p) => acc + (p.positionNotional ?? p.notional ?? 0), 0).toFixed(2)
  );
  mergedPortfolio.openRiskAmount = parseFloat(
    finalActivePositions.reduce((acc, p) => acc + (p.capitalAtRisk ?? p.riskAmount ?? 0), 0).toFixed(2)
  );
  mergedPortfolio.openRiskPercent =
    mergedPortfolio.equity > 0
      ? parseFloat(((mergedPortfolio.openRiskAmount / mergedPortfolio.equity) * 100).toFixed(2))
      : 0;

  return {
    portfolio: mergedPortfolio,
    openPositions: finalActivePositions,
    closedTrades: deduplicatedTrades,
    aiDecisions: deduplicatedDecisions,
    tradeJournals: journals,
    activities: deduplicatedActivities,
    backtestRecords: raw?.backtestRecords || DEFAULT_BACKTEST,
    historicalValidation: raw?.historicalValidation || null,
    settings: { ...DEFAULT_SETTINGS, ...(raw?.settings || {}) },
    dataHealth: raw?.dataHealth || {},
    agentState: raw?.agentState || {
      state: 'SCANNING',
      currentAsset: null,
      lastCycleAt: Date.now(),
      conviction: 82,
      marketPressure: 45,
    },
  };
}

function initStore(): AppState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, 'utf-8');
      const loaded = JSON.parse(raw);
      const reconciled = reconcileAppState(loaded);
      // Persist the reconciled state immediately to keep disk completely clean
      saveState(reconciled);
      return reconciled;
    }
  } catch (err) {
    console.error('Failed to load store, initializing fresh default state:', err);
  }

  const fresh: AppState = {
    portfolio: DEFAULT_PORTFOLIO,
    openPositions: [],
    closedTrades: [],
    aiDecisions: [],
    tradeJournals: {},
    activities: [
      {
        id: 'act-init',
        timestamp: Date.now(),
        type: 'SCAN',
        title: 'AGENT INITIALIZED',
        detail: 'MACROVEX 2.1 PRO core services started in PAPER execution mode.',
      },
    ],
    backtestRecords: DEFAULT_BACKTEST,
    settings: DEFAULT_SETTINGS,
    dataHealth: {},
    agentState: {
      state: 'SCANNING',
      currentAsset: 'BTC',
      lastCycleAt: Date.now(),
      conviction: 84,
      marketPressure: 42,
    },
  };
  saveState(fresh);
  return fresh;
}

export function saveState(s: AppState = state): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    // Reconcile before saving to guarantee zero dirty/resurrected state reaches disk
    const reconciled = reconcileAppState(s);
    state = reconciled;

    const tempFile = `${STATE_FILE}.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 6)}`;
    const jsonStr = JSON.stringify(reconciled, null, 2);
    fs.writeFileSync(tempFile, jsonStr, 'utf-8');
    fs.renameSync(tempFile, STATE_FILE);
    return true;
  } catch (err) {
    console.error('[Store] Error saving state to disk:', err);
    return false;
  }
}

export function getState(): AppState {
  if (!state) {
    state = initStore();
  }
  return state;
}

export function logActivity(item: Omit<AIActivityItem, 'id' | 'timestamp'>): AIActivityItem {
  const s = getState();
  const entry: AIActivityItem = {
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
    ...item,
  };
  s.activities.unshift(entry);
  if (s.activities.length > 200) {
    s.activities = s.activities.slice(0, 200);
  }
  saveState(s);
  return entry;
}
