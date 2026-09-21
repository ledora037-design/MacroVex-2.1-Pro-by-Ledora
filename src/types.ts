export type AssetCategory = 'CRYPTO' | 'EQUITIES' | 'COMMODITIES';

export type InstrumentId =
  | 'BTC' | 'ETH' | 'SOL' | 'BNB' | 'XRP' | 'DOGE' | 'AVAX' | 'LINK' | 'SUI' | 'ADA'
  | 'PEPE' | 'NEAR' | 'APT' | 'ARB' | 'OP' | 'TIA' | 'INJ' | 'RENDER' | 'FET' | 'TON' | 'SEI' | 'DOT'
  | 'NVDA' | 'AAPL' | 'MSFT' | 'AMZN' | 'META' | 'GOOGL' | 'TSLA' | 'AMD' | 'AVGO' | 'QQQ' | 'SPY'
  | 'XAU' | 'XAG' | 'CL';

export type AssetStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'STALE' | 'DATA ERROR';

export type MarketRegime = 'RISK-ON' | 'RISK-OFF' | 'NEUTRAL' | 'TRANSITION';

export type TradingMode = 'PAPER' | 'DEMO' | 'LIVE';

export type AgentState =
  | 'SCANNING'
  | 'ANALYZING EVENT'
  | 'CROSS-CHECKING'
  | 'RISK CHECK'
  | 'EXECUTING'
  | 'MONITORING'
  | 'WAITING';

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  ema20: number;
  ema50: number;
  rsi14: number;
  macd: { macd: number; signal: number; hist: number };
  adx14: number;
  volumeVsAvg: number;
  vwap: number;
}

export interface OrderBlock {
  type: 'BULLISH' | 'BEARISH';
  top: number;
  bottom: number;
  active: boolean;
}

export interface FairValueGap {
  type: 'BULLISH' | 'BEARISH';
  top: number;
  bottom: number;
}

export interface LiquiditySweep {
  level: number;
  type: 'HIGH' | 'LOW';
  time: number;
}

export interface SmartMoneyConcepts {
  marketStructure: 'HH' | 'HL' | 'LH' | 'LL';
  orderBlocks: OrderBlock[];
  fvg: FairValueGap[];
  liquiditySweeps: LiquiditySweep[];
  supportLevels: number[];
  resistanceLevels: number[];
  breakoutState: 'BREAKOUT' | 'REJECTION' | 'RANGING' | 'TRENDING';
}

export interface AssetSummary {
  symbol: InstrumentId;
  name: string;
  category: AssetCategory;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  status: AssetStatus;
  opportunityScore: number;
  technicalBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  macroRelevance: number;
  crossAssetConfirmation: boolean;
  momentum: number;
  volatility: number;
  liquidity: number;
  aiConfidence: number;
  setupStatus: 'HIGH CONVICTION' | 'WATCH' | 'WAIT' | 'INVALID' | 'DATA UNAVAILABLE';
}

export interface AssetIntelligence extends AssetSummary {
  multiTimeframe: {
    '1m'?: { bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; rsi: number; emaState: string };
    '5m'?: { bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; rsi: number; emaState: string };
    '15m': { bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; rsi: number; emaState: string };
    '1h': { bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; rsi: number; emaState: string };
    '4h': { bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; rsi: number; emaState: string };
    '1D': { bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; rsi: number; emaState: string };
  };
  indicators: TechnicalIndicators;
  smc: SmartMoneyConcepts;
  technicalConfidence: number;
  macroBias: 'EXPANSION' | 'CONTRACTION' | 'NEUTRAL';
  crossAssetBias: 'SUPPORTIVE' | 'CONFLICTED' | 'NEUTRAL';
  overallSetup: string;
}

export interface AssetDirectionalBias {
  symbol: string;
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  reason?: string;
}

export interface LiveNewsItem {
  id: string;
  primaryAsset: string;
  source: string;
  headline: string;
  url: string;
  publishedAt: string;
  timestamp: number;
  timeAgo: string;
  summary: string;
  impactAssets: string[];
  transmissionChain: string[];
  transmissionText: string;
  directImpact?: string;
  macroTransmission?: string;
  category: string;
  importance: 'HIGH' | 'MEDIUM' | 'LOW';
  assetBiases?: AssetDirectionalBias[];
}

export interface MacroEvent {
  id: string;
  headline: string;
  source: string;
  timestamp: number;
  category: string;
  importance: 'HIGH' | 'MEDIUM' | 'LOW';
  affectedAssets: string[];
  summary: string;
  url: string;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED';
  directImpact?: string;
  macroTransmission?: string;
  assetResponse?: string;
  crossAssetConfirmation?: string;
  tradingImplication?: string;
  assetBiases?: AssetDirectionalBias[];
  primaryAsset?: string;
  transmissionChain?: string[];
}

export interface CrossAssetRelationship {
  source: string;
  target: string;
  relationship: 'POSITIVE' | 'INVERSE' | 'DIVERGENT';
  correlation: number;
  description: string;
}

export interface AIDecision {
  id: string;
  timestamp: number;
  asset: InstrumentId;
  direction: 'LONG' | 'SHORT';
  action: 'BUY' | 'SELL' | 'WAIT';
  entry: number;
  stop_loss: number;
  take_profit: number;
  leverage: number;
  position_size: number;
  risk_percent: number;
  rr: number;
  confidence: number;
  macro_catalyst: string;
  technical_reasoning: string;
  cross_asset_reasoning: string;
  regime: MarketRegime;
  invalidation: string;
  holding_horizon: string;
  strategy_id: string;
  strategy_version: string;
  marginUsed?: number;
  margin_used?: number;
  positionNotional?: number;
  position_notional?: number;
  capitalAtRisk?: number;
  capital_at_risk?: number;
  signalStrength?: string;
  signal_strength?: string;
  risk_decision?: {
    approved: boolean;
    reason: string;
    checks: Record<string, boolean>;
    calculatedSize?: {
      quantity: number;
      notional: number;
      margin: number;
      marginUsed?: number;
      positionNotional?: number;
      capitalAtRisk?: number;
      riskAmount: number;
      riskPercent: number;
      rr: number;
      leverage: number;
      signalStrength?: string;
    };
  };
}

export interface PositionModification {
  id: string;
  timestamp: number;
  timeFormatted?: string;
  type: 'PARTIAL_TAKE_PROFIT' | 'SL_MODIFIED' | 'TP_MODIFIED' | 'BREAKEVEN_SL' | 'TRAILING_SL';
  oldPrice: number;
  newPrice: number;
  executionPrice?: number;
  reason: string;
  quantityAffected?: number;
  quantity?: number;
  percentageClosed?: number;
  remainingQuantity?: number;
  realizedPnl?: number;
}

export interface Position {
  id: string;
  tradeId: string;
  asset: InstrumentId;
  direction: 'LONG' | 'SHORT';
  entry: number;
  currentPrice: number;
  stopLoss: number;
  takeProfit: number;
  quantity: number;
  notional: number;
  leverage: number;
  margin: number;
  marginUsed?: number;
  positionNotional?: number;
  capitalAtRisk?: number;
  signalStrength?: string;
  riskAmount: number;
  riskPercent: number;
  rr: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  fees: number;
  funding: number;
  slippage: number;
  strategyId: string;
  strategyVersion: string;
  macroCatalyst: string;
  openedAt: number;
  openingTime?: string;
  openingTimestamp?: number;
  entryExecutionTimestamp?: number;
  lastCheckedAt: number;
  status: 'OPEN' | 'CLOSED';
  partialProfitTaken?: boolean;
  highestPriceSeen?: number;
  lowestPriceSeen?: number;
  modifications?: PositionModification[];
  aiDecision?: any;
  riskDecision?: any;
  marketSnapshot?: {
    entryPrice: number;
    fundingRate?: number;
    spreadBps?: number;
    regime?: string;
    mtfBias?: string;
    source?: string;
  };
}

export interface ClosedTrade {
  id: string;
  tradeId: string;
  asset: InstrumentId;
  direction: 'LONG' | 'SHORT';
  entry: number;
  exit: number;
  quantity: number;
  notional: number;
  leverage: number;
  margin?: number;
  marginUsed?: number;
  positionNotional?: number;
  capitalAtRisk?: number;
  signalStrength?: string;
  risk: number;
  sl: number;
  tp: number;
  rr: number;
  pnl: number;
  rMultiple: number;
  fees: number;
  funding: number;
  slippage: number;
  durationSeconds: number;
  durationFormatted?: string;
  strategy: string;
  strategyVersion: string;
  aiConfidence: number;
  regime: MarketRegime;
  catalyst: string;
  exitReason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'MANUAL_CLOSE' | 'RISK_EXIT' | 'TIMEOUT' | 'THESIS_INVALIDATED';
  openedAt: number;
  openingTime?: string;
  openingTimestamp?: number;
  closedAt: number;
  closingTime?: string;
  closingTimestamp?: number;
  status: 'CLOSED';
  modifications?: PositionModification[];
  aiDecision?: any;
  riskDecision?: any;
  marketSnapshot?: {
    entryPrice: number;
    exitPrice: number;
    fundingRate?: number;
    spreadBps?: number;
    regime?: string;
    mtfBias?: string;
    source?: string;
  };
}

export interface TimelineStep {
  step: 'EVENT' | 'AI_ANALYSIS' | 'RISK_CHECK' | 'EXECUTION' | 'MONITORING' | 'EXIT' | 'RESULT';
  label: string;
  timestamp: number;
  timeFormatted?: string;
  detail: string;
  status: 'COMPLETED' | 'ACTIVE' | 'FAILED';
}

export interface TradeJournal {
  tradeId: string;
  asset: InstrumentId;
  direction: 'LONG' | 'SHORT';
  openedAt: number;
  openingTime?: string;
  closedAt?: number;
  closingTime?: string;
  durationSeconds?: number;
  durationFormatted?: string;
  macroCatalyst: string;
  technicalSetup: string;
  crossAssetConfirmation: string;
  regime: MarketRegime;
  aiReasoning: string;
  riskDecision: {
    approved: boolean;
    checksPassed: number;
    totalChecks: number;
    summary: string;
  };
  entry: number;
  sl: number;
  tp: number;
  leverage: number;
  positionSize: number;
  margin?: number;
  marginUsed?: number;
  positionNotional?: number;
  capitalAtRisk?: number;
  signalStrength?: string;
  exitReason?: string;
  resultPnl?: number;
  rMultiple?: number;
  timeline: TimelineStep[];
}

export interface PortfolioState {
  equity: number;
  initialCapital: number;
  cash: number;
  availableMargin: number;
  usedMargin: number;
  unrealizedPnl: number;
  realizedPnl: number;
  dailyPnl: number;
  weeklyPnl: number;
  peakEquity: number;
  maxDrawdownPercent: number;
  currentDrawdownPercent: number;
  exposureNotional: number;
  exposurePercent: number;
  openRiskAmount: number;
  openRiskPercent: number;
  openPositionsCount: number;
  todayTradesCount: number;
  maxDailyTrades: number;
  equityHistory: Array<{ timestamp: number; equity: number; cash: number }>;
  drawdownHistory: Array<{ timestamp: number; drawdownPercent: number }>;
  dailyPnlHistory: Array<{ date: string; pnl: number }>;
}

export interface StockPerformanceRow {
  ticker: InstrumentId;
  name: string;
  category: AssetCategory;
  isPrimaryStock: boolean;
  rTokenAvailable: boolean;
  rTokenPair?: string;
  trades: number;
  winRate: number;
  netPnl: number;
  returnPercent: number;
  profitFactor: number;
  sharpe: number;
  sortino: number;
  maxDrawdown: number;
  avgWin: number;
  avgLoss: number;
  avgRR: number;
  avgHoldingTime: string;
  fees: number;
  slippage: number;
  longTrades: number;
  shortTrades: number;
  longWinRate: number;
  shortWinRate: number;
  largestWin: number;
  largestLoss: number;
  bestRegime: string;
  dataStatus: 'VERIFIED_HISTORICAL' | 'DATA_UNAVAILABLE' | 'PARTIAL_HISTORICAL';
  historicalPeriodAvailable: string;
}

export interface BacktestTradeRecord {
  tradeId: string;
  backtestRunId: string;
  ticker: InstrumentId;
  rToken?: string;
  direction: 'LONG' | 'SHORT';
  entry: number;
  exit: number;
  quantity: number;
  notional: number;
  margin: number;
  leverage: number;
  sl: number;
  tp: number;
  rr: number;
  risk: number;
  pnl: number;
  returnPercent: number;
  rMultiple: number;
  fees: number;
  slippage: number;
  holdingTimeFormatted: string;
  durationSeconds: number;
  openedAt: number;
  closedAt: number;
  closeReason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'PARTIAL_TP' | 'SIGNAL_REVERSAL' | 'RISK_EXIT' | 'TIMEOUT';
  regime: string;
  macroEvent?: string;
  catalyst?: string;
  technicalSetup: string;
  rTokenLiquidity?: string;
  rTokenPriceDeviation?: number;
  orderbookState?: string;
  aiConfidence: number;
  aiReasoning: string;
  riskEngineChecksPassed: number;
  strategyVersion: string;
  gapFilled?: boolean;
  partialExits?: Array<{
    timestamp: number;
    price: number;
    quantityPercent: number;
    pnl: number;
  }>;
}

export type BacktestDateRange = '3m' | '6m' | '1y' | '2y' | 'custom';
export type BacktestMode =
  | 'SINGLE_ASSET'
  | 'MULTI_ASSET'
  | 'STOCK_PORTFOLIO'
  | 'EVENT_DRIVEN'
  | 'RTOKEN_COMPARISON'
  | 'FULL_MACROMIND';

export interface StockBacktestRun {
  id: string; // e.g. BT-STOCK-2026-000001
  strategyId: string;
  strategyVersion: string; // 'MM-STOCK-MACRO-V1'
  dateRange: BacktestDateRange;
  testStart: number;
  testEnd: number;
  mode: BacktestMode;
  assetUniverse: InstrumentId[];
  primaryStockUniverse: InstrumentId[];
  secondaryUniverse: InstrumentId[];
  timeframes: string[];
  initialCapital: number;
  finalEquity: number;
  netReturn: number;
  netPnl: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  profitFactor: number;
  sharpe: number;
  sortino: number;
  maxDrawdown: number;
  averageRR: number;
  averageHoldingTime: string;
  fees: number;
  slippage: number;
  turnover: number;
  rTokenTrackingError?: number;
  rTokenCoverageNotes?: string;
  stockPerformanceMatrix: StockPerformanceRow[];
  equityCurve: Array<{
    timestamp: number;
    date: string;
    stockEquity: number;
    cryptoEquity: number;
    commodityEquity: number;
    totalEquity: number;
    drawdownPercent: number;
  }>;
  regimePerformance: Record<
    string,
    { trades: number; winRate: number; netPnl: number; profitFactor: number }
  >;
  eventPerformance: Record<
    string,
    { trades: number; winRate: number; netPnl: number }
  >;
  trades: BacktestTradeRecord[];
  dataCoverage: {
    availableRange: string;
    hasHistoricalQuotes: boolean;
    hasHistoricalEvents: boolean;
    hasRTokenData: boolean;
    unsupportedNotes?: string[];
  };
  createdAt: number;
}

export interface BacktestRecord {
  strategyId: string;
  strategyVersion: string;
  testStart: number;
  testEnd: number;
  assetUniverse: string[];
  timeframes: string[];
  totalTrades: number;
  winRate: number;
  netReturn: number;
  profitFactor: number;
  maxDrawdown: number;
  sharpe: number;
  sortino: number;
  averageHoldingTime: string;
  averageRR: number;
  fees: number;
  slippage: number;
  turnover: number;
  isInsufficientData?: boolean;
}

export interface HistoricalRoundTripTrade {
  tradeId: string;
  asset: InstrumentId;
  direction: 'LONG' | 'SHORT';
  entryTimestamp: number;
  entryPrice: number;
  exitTimestamp: number;
  exitPrice: number;
  positionSize: number;
  notionalValue: number;
  realizedPnl: number;
  returnPercent: number;
  exitReason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'TRAILING_STOP' | 'STRATEGY_EXIT';
  feesPaid: number;
  durationSeconds: number;
  durationFormatted: string;
  technicalRationale: string;
  macroContext: string;
  riskEnginePassed: boolean;
  riskEngineDetails: {
    checksPassed: number;
    totalChecks: number;
    approved: boolean;
    summary: string;
  };
  entrySl: number;
  entryTp: number;
  rr: number;
  leverage: number;
}

export interface HistoricalValidationRun {
  id: string;
  strategyId: string;
  strategyVersion: string;
  runTimestamp: number;
  assetUniverse: InstrumentId[];
  candleSource: string;
  totalRoundTrips: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  profitFactor: number;
  totalNetPnl: number;
  grossProfit: number;
  grossLoss: number;
  maxDrawdownPercent: number;
  maxDrawdownDollar: number;
  sharpeRatio: number;
  sortinoRatio: number;
  avgWinDollar: number;
  avgLossDollar: number;
  winLossRatio: number;
  largestWinningTrade: number;
  largestLosingTrade: number;
  averageDurationFormatted: string;
  averageDurationSeconds: number;
  averageRR: number;
  totalFeesPaid: number;
  initialCapital: number;
  finalEquity: number;
  equityCurve: Array<{
    tradeIndex: number;
    tradeId: string;
    timestamp: number;
    date: string;
    asset: string;
    tradePnl: number;
    cumulativePnl: number;
    equity: number;
    drawdownPercent: number;
  }>;
  returnDistribution: Array<{
    bin: string;
    count: number;
    label: string;
    isWin: boolean;
  }>;
  trades: HistoricalRoundTripTrade[];
}

export interface DataHealthItem {
  service: string;
  provider: string;
  status: 'CONNECTED' | 'DEGRADED' | 'STALE' | 'ERROR' | 'UNAVAILABLE';
  latencyMs: number;
  lastUpdated: number;
  message: string;
}

export interface AIActivityItem {
  id: string;
  timestamp: number;
  type: 'SCAN' | 'EVENT' | 'ANALYSIS' | 'CROSS_CHECK' | 'RISK_REJECT' | 'RISK_PASS' | 'EXECUTE' | 'MONITOR' | 'EXIT';
  event?: string;
  title: string;
  detail: string;
  asset?: string;
  tradeId?: string;
  status?: string;
}

export interface AppSettings {
  tradingMode: TradingMode;
  liveModeConfirmed: boolean;
  maxDailyTrades: number;
  maxRiskPerTradePercent: number;
  maxMarginPerTradePercent?: number;
  maxTotalMarginPercent?: number;
  maxPortfolioExposurePercent: number;
  dailyLossLimitPercent: number;
  maxDrawdownLimitPercent: number;
  minRiskReward: number;
  preferredRiskReward: number;
  autonomousCycleSeconds: number;
  isAutonomousActive: boolean;
  bitgetMode: 'demo' | 'live';
  hasBitgetCreds: boolean;
  hasCmcCreds: boolean;
  hasNewsCreds: boolean;
  hasGeminiKey: boolean;
}

export type AIDecisionRecord = AIDecision;

export type AppTheme = 'dark' | 'light';

export interface BitgetTradingMcpVerification {
  installedPackage: string;
  corePackage: string;
  endpoint: string;
  transport: 'STDIO';
  discoveredToolCount: number;
  discoveredTools: string[];
  marketData: {
    status: 'LIVE' | 'DATA UNAVAILABLE';
    verifiedCall: string;
    lastPrice: number;
    lastVerifiedTimestamp: number;
  };
  futuresSpot: {
    status: 'ENABLED' | 'DATA UNAVAILABLE';
    modules: string[];
    verifiedContractsCount: number;
  };
  account: {
    status: 'LIVE' | 'REQUIRES AUTH (NOT CONFIGURED)' | 'DATA UNAVAILABLE';
    hasCredentials: boolean;
    detail: string;
  };
  positions: {
    status: 'LIVE' | 'REQUIRES AUTH (NOT CONFIGURED)' | 'DATA UNAVAILABLE';
    hasCredentials: boolean;
    detail: string;
  };
  tradingDemo: {
    readOnlyActive: boolean;
    demoModeFlag: string;
    executionPath: string;
    liveOrderPlacement: string;
  };
  reconnectBehavior: string;
  staleDataBehavior: string;
  verifiedSymbols: string[];
}

export interface BitgetMarketMcpVerification {
  usEquities: {
    status: 'NOT VERIFIED' | 'DATA UNAVAILABLE';
    detail: string;
  };
  etfs: {
    status: 'DATA UNAVAILABLE';
    detail: string;
  };
  fundamentals: {
    status: 'DATA UNAVAILABLE';
    detail: string;
  };
  analystInstitutional: {
    status: 'DATA UNAVAILABLE';
    detail: string;
  };
  newsSentiment: {
    status: 'DATA UNAVAILABLE';
    detail: string;
  };
  notes: string;
}

export interface BitgetMcpStatus {
  service?: string;
  endpoint: string;
  transport?: string;
  connected?: boolean;
  status: 'LIVE' | 'RECONNECTING' | 'STALE' | 'DATA UNAVAILABLE' | 'CONNECTED' | 'DISCONNECTED' | 'INITIALIZING';
  livePricesCount?: number;
  lastChecked?: number;
  lastUpdated?: number;
  latencyMs: number;
  supportedAssets?: string[];
  protocolVersion?: string;
  sourceOfTruth?: string;
  tools?: string[];
  serverType?: string;
  version?: string;
  modules?: string[];
  readOnly?: boolean;
  paperTrading?: boolean;
  hasCredentials?: boolean;
  resolvedSymbolsCount?: number;
  error?: string | null;
  tradingMcp?: BitgetTradingMcpVerification;
  marketMcp?: BitgetMarketMcpVerification;
}

export interface MarketOpportunity {
  asset: InstrumentId;
  name: string;
  category: AssetCategory;
  price: number;
  change24h: number;
  volume24h: number;
  direction: 'LONG' | 'SHORT';
  action: 'BUY' | 'SELL' | 'WAIT';
  rankScore: number;
  signalStrength: number;
  mtfAlignment: 'ALIGNED' | 'PARTIAL' | 'CONFLICT';
  executionTimeframe: '1m' | '5m' | '15m';
  trendTimeframe: '1H' | '4H';
  marketStructure: string;
  bosChoch: 'BOS_BULL' | 'BOS_BEAR' | 'CHOCH_BULL' | 'CHOCH_BEAR' | 'NONE';
  orderBlock: 'BULL_OB' | 'BEAR_OB' | 'NONE';
  fvg: 'BULL_FVG' | 'BEAR_FVG' | 'NONE';
  liquiditySweep: boolean;
  momentum: number;
  volatility: number;
  liquidity: number;
  spreadBps: number;
  rr: number;
  entry: number;
  sl: number;
  tp: number;
  confidence: number;
  macroAlignment: boolean;
  crossAssetStatus: string;
  riskGateStatus: 'APPROVED' | 'REJECTED' | 'WAITING_SLOT' | 'MAX_POSITIONS_REACHED' | 'COOLDOWN_PROTECTED';
  rejectionReason?: string;
  lastScannedAt: number;
}

export interface FullMarketScannerState {
  isScanning: boolean;
  lastScanTimestamp: number;
  assetsScannedCount: number;
  validSignalsCount: number;
  riskApprovedCount: number;
  activePositionsCount: number;
  maxOpenPositions: number;
  availableSlots: number;
  dailyLimitRule: string;
  antiOvertradingActive: boolean;
  rankedOpportunities: MarketOpportunity[];
}

export interface AutonomousEngineStatus {
  isRunning: boolean;
  engineStartedAt: number;
  engineUptimeSeconds: number;
  lastScanTimestamp: number;
  nextScanTimestamp: number;
  scanIntervalMs: number;
  positionMonitoringIntervalMs: number;
  openPositionsCount: number;
  maxOpenPositions: number;
  availableSlots: number;
  realizedPnl: number;
  unrealizedPnl: number;
  totalTradesExecuted: number;
  mcpStatus: string;
  isStaleOrDisconnected: boolean;
  priorityOrder: string[];
  lastAction: string;
  lastActionTimestamp: number;
  recoveryCount?: number;
}
