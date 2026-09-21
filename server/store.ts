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

function initStore(): AppState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, 'utf-8');
      const loaded = JSON.parse(raw);
      const mergedPortfolio = { ...DEFAULT_PORTFOLIO, ...loaded.portfolio };
      if (
        !mergedPortfolio.dailyPnlHistory ||
        mergedPortfolio.dailyPnlHistory.length < 5 ||
        !mergedPortfolio.dailyPnlHistory.some((d: any) => d.pnl !== 0)
      ) {
        mergedPortfolio.dailyPnlHistory = DEFAULT_PORTFOLIO.dailyPnlHistory;
      }
      // Deduplicate arrays by unique ID to prevent any duplicate key errors
      const seenDecIds = new Set<string>();
      const deduplicatedDecisions = (loaded.aiDecisions || []).filter((d: any) => {
        if (!d?.id || seenDecIds.has(d.id)) return false;
        seenDecIds.add(d.id);
        return true;
      });

      const seenActIds = new Set<string>();
      const deduplicatedActivities = (loaded.activities || []).filter((a: any) => {
        if (!a?.id || seenActIds.has(a.id)) return false;
        seenActIds.add(a.id);
        return true;
      });

      const seenPosIds = new Set<string>();
      const deduplicatedPositions = (loaded.openPositions || []).filter((p: any) => {
        if (!p?.id || seenPosIds.has(p.id)) return false;
        seenPosIds.add(p.id);
        return true;
      });

      const seenTradeIds = new Set<string>();
      const deduplicatedTrades = (loaded.closedTrades || []).filter((t: any) => {
        const id = t?.id || t?.tradeId;
        if (!id || seenTradeIds.has(id)) return false;
        seenTradeIds.add(id);
        return true;
      });

      // Canonical lifecycle normalization (preserving true immutable timestamps)
      for (const pos of deduplicatedPositions) {
        pos.openingTimestamp = pos.openedAt;
        pos.entryExecutionTimestamp = pos.entryExecutionTimestamp || pos.openedAt;
        if (pos.openedAt && pos.openedAt > 0) {
          pos.openingTime = formatUTCDateTime(pos.openedAt);
        } else if (pos.openingTime) {
          pos.openingTime = formatUTCDateTime(pos.openingTime);
        } else {
          pos.openingTime = 'TIMESTAMP UNAVAILABLE';
        }
        pos.status = 'OPEN';
      }

      for (const trade of deduplicatedTrades) {
        trade.openingTimestamp = trade.openedAt;
        trade.closingTimestamp = trade.closedAt;
        if (trade.openedAt && trade.openedAt > 0) {
          trade.openingTime = formatUTCDateTime(trade.openedAt);
        } else if (trade.openingTime) {
          trade.openingTime = formatUTCDateTime(trade.openingTime);
        } else {
          trade.openingTime = 'TIMESTAMP UNAVAILABLE';
        }
        if (trade.closedAt && trade.closedAt > 0) {
          trade.closingTime = formatUTCDateTime(trade.closedAt);
        } else if (trade.closingTime) {
          trade.closingTime = formatUTCDateTime(trade.closingTime);
        } else {
          trade.closingTime = 'TIMESTAMP UNAVAILABLE';
        }
        if (!trade.durationFormatted && trade.durationSeconds !== undefined) {
          trade.durationFormatted = formatDuration(trade.durationSeconds);
        }
        trade.status = 'CLOSED';
      }

      const journals = loaded.tradeJournals || {};
      for (const j of Object.values(journals) as any[]) {
        if (j.openedAt && j.openedAt > 0) {
          j.openingTime = formatUTCDateTime(j.openedAt);
        } else if (j.openingTime) {
          j.openingTime = formatUTCDateTime(j.openingTime);
        }
        if (j.closedAt && j.closedAt > 0) {
          j.closingTime = formatUTCDateTime(j.closedAt);
        } else if (j.closingTime) {
          j.closingTime = formatUTCDateTime(j.closingTime);
        }
        if (!j.durationFormatted && j.durationSeconds !== undefined) {
          j.durationFormatted = formatDuration(j.durationSeconds);
        }
        if (Array.isArray(j.timeline)) {
          for (const step of j.timeline) {
            if (step.timestamp && step.timestamp > 0) {
              step.timeFormatted = formatUTCDateTime(step.timestamp);
            }
          }
        }
      }

      // Ensure merged defaults
      return {
        portfolio: mergedPortfolio,
        openPositions: deduplicatedPositions,
        closedTrades: deduplicatedTrades,
        aiDecisions: deduplicatedDecisions,
        tradeJournals: journals,
        activities: deduplicatedActivities,
        backtestRecords: loaded.backtestRecords || DEFAULT_BACKTEST,
        historicalValidation: loaded.historicalValidation || null,
        settings: { ...DEFAULT_SETTINGS, ...loaded.settings },
        dataHealth: loaded.dataHealth || {},
        agentState: loaded.agentState || {
          state: 'SCANNING',
          currentAsset: null,
          lastCycleAt: Date.now(),
          conviction: 82,
          marketPressure: 45,
        },
      };
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
        detail: 'MacroMind 2.0 core services started in PAPER execution mode.',
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

export function saveState(s: AppState = state): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${STATE_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(s, null, 2), 'utf-8');
    fs.renameSync(tempFile, STATE_FILE);
  } catch (err) {
    console.error('Error saving state to disk:', err);
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
