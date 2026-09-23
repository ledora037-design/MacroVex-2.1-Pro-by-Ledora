import { AutonomousEngineStatus, InstrumentId } from '../../src/types.js';
import { getState, logActivity, saveState } from '../store.js';
import { evaluateRisk } from './riskEngine.js';
import {
  executePaperTrade,
  monitorOpenPositions,
  evaluateAndManageOpenPositions,
  registerPositionClosedHook,
} from './executionEngine.js';
import { scanAndRankOpportunities, getLatestScannerState } from './opportunityScanner.js';
import { getBitgetMcpStatus } from '../providers/bitgetMcp.js';
import { fetchLiveQuote } from '../providers/marketData.js';

// =============================================================================
// MACROMIND 2.0 AUTONOMOUS PAPER TRADING ENGINE
// Continuous Server-Side Execution Authority
// =============================================================================

// Authoritative 30-minute scan cycle duration (30 minutes = 1,800,000 ms)
export const SCAN_CYCLE_INTERVAL_MS = 30 * 60 * 1000;
// Authoritative high-frequency position monitoring interval (10 seconds)
export const POSITION_MONITOR_INTERVAL_MS = 10 * 1000;

let isRunning = false;
let engineStartedAt = Date.now();
let lastAction = 'ENGINE_INITIALIZED';
let lastActionTimestamp = Date.now();
let scanSchedulerTimeout: NodeJS.Timeout | null = null;
let positionMonitorInterval: NodeJS.Timeout | null = null;

// Register dynamic position recycling hook:
// When an open position closes, immediately recycle the slot without waiting 30 minutes
registerPositionClosedHook(() => {
  if (isRunning) {
    const s = getState();
    if (s.settings.isAutonomousActive && s.openPositions.length < 5) {
      console.log('[AUTONOMOUS AGENT] Position closed. Triggering immediate dynamic slot recycling scan.');
      setTimeout(() => {
        triggerDynamicRecyclingScan().catch((err) => {
          console.error('[AUTONOMOUS AGENT] Error in dynamic recycling scan:', err);
        });
      }, 1000);
    }
  }
});

/**
 * Bootstraps and resumes the Autonomous Paper Trading Engine.
 * Requirement 11: Backend restart recovery:
 * - restore all open paper positions
 * - query fresh Bitget data
 * - recalculate current P&L
 * - restore TP/SL management
 * - restore the 30-minute scheduler
 * - continue the trading cycle
 * - never duplicate trades
 */
export async function startAutonomousAgent(): Promise<void> {
  if (isRunning) return;
  isRunning = true;
  engineStartedAt = Date.now();

  const state = getState();
  state.agentState.engineStartedAt = engineStartedAt;
  state.agentState.recoveryCount = (state.agentState.recoveryCount || 0) + 1;
  saveState(state);

  console.log(`[AUTONOMOUS AGENT] Starting MacroMind 2.0 Server-Side Engine (Boot/Recovery #${state.agentState.recoveryCount}).`);

  // Step 1: Perform complete restart recovery
  await recoverAndResumeEngine();

  // Step 2: Start continuous high-frequency position monitoring loop (every 10s)
  startPositionMonitoringLoop();

  // Step 3: Start/restore authoritative 30-minute scheduler
  restore30MinuteScheduler();
}

/**
 * Stops the autonomous trading loop cleanly.
 */
export function stopAutonomousAgent(): void {
  isRunning = false;
  if (scanSchedulerTimeout) {
    clearTimeout(scanSchedulerTimeout);
    scanSchedulerTimeout = null;
  }
  if (positionMonitorInterval) {
    clearInterval(positionMonitorInterval);
    positionMonitorInterval = null;
  }
  const s = getState();
  s.settings.isAutonomousActive = false;
  s.agentState.state = 'WAITING';
  saveState(s);
  console.log('[AUTONOMOUS AGENT] Stopped autonomous trading engine.');
}

/**
 * Startup / Recovery Routine (Requirement 11)
 */
async function recoverAndResumeEngine(): Promise<void> {
  lastAction = 'STARTUP_RECOVERY';
  lastActionTimestamp = Date.now();
  const state = getState();

  logActivity({
    type: 'MONITOR',
    title: 'AUTONOMOUS ENGINE RECOVERY INITIATED',
    detail: `Restoring ${state.openPositions.length} open positions, verifying Bitget live connection, and initializing 30-minute scheduler.`,
  });

  // Verify Bitget MCP status
  const mcpStatus = await getBitgetMcpStatus();
  console.log(`[AUTONOMOUS AGENT] Bitget MCP Status on Boot: ${mcpStatus.status} (${mcpStatus.latencyMs}ms)`);

  // Recalculate all open paper positions against fresh Bitget market data
  if (state.openPositions.length > 0) {
    let totalUnrealized = 0;
    for (const pos of state.openPositions) {
      try {
        const quote = await fetchLiveQuote(pos.asset);
        if (quote && quote.price > 0 && quote.status !== 'STALE' && quote.status !== 'UNAVAILABLE' && quote.status !== 'DATA ERROR') {
          pos.currentPrice = quote.price;
          pos.lastCheckedAt = Date.now();
          const diff = pos.direction === 'LONG' ? quote.price - pos.entry : pos.entry - quote.price;
          pos.unrealizedPnl = parseFloat((diff * pos.quantity).toFixed(2));
          pos.unrealizedPnlPercent = parseFloat(((pos.unrealizedPnl / pos.margin) * 100).toFixed(2));
          totalUnrealized += pos.unrealizedPnl;
        }
      } catch (err) {
        console.error(`[AUTONOMOUS AGENT] Error fetching fresh quote for restored position ${pos.asset}:`, err);
      }
    }
    state.portfolio.unrealizedPnl = parseFloat(totalUnrealized.toFixed(2));
    state.portfolio.openPositionsCount = state.openPositions.length;
    saveState(state);
  }

  logActivity({
    type: 'MONITOR',
    title: 'AUTONOMOUS ENGINE RECOVERY COMPLETED',
    detail: `Portfolio equity: $${state.portfolio.equity.toFixed(2)} | Active Positions: ${state.openPositions.length}/5 | Scheduler: 30-Min Authoritative.`,
  });
}

/**
 * Starts the high-frequency position monitoring loop (every 10 seconds).
 * Guarantees real-time TP/SL hits and dynamic profit protection independent of the 30-min scan.
 */
function startPositionMonitoringLoop(): void {
  if (positionMonitorInterval) clearInterval(positionMonitorInterval);

  positionMonitorInterval = setInterval(async () => {
    if (!isRunning) return;
    try {
      await monitorOpenPositions();
    } catch (err) {
      console.error('[AUTONOMOUS AGENT] Error in position monitoring loop:', err);
    }
  }, POSITION_MONITOR_INTERVAL_MS);
}

/**
 * Restores or schedules the authoritative 30-minute full market scan.
 * The 30-minute scheduler survives browser close, frontend disconnect, user logout, and page refresh.
 */
function restore30MinuteScheduler(): void {
  if (scanSchedulerTimeout) {
    clearTimeout(scanSchedulerTimeout);
    scanSchedulerTimeout = null;
  }

  const state = getState();
  const now = Date.now();
  const lastScan = state.agentState.lastScanTimestamp || 0;
  const elapsed = now - lastScan;

  let delayMs = 1500; // default initial run if overdue
  if (lastScan > 0 && elapsed < SCAN_CYCLE_INTERVAL_MS) {
    // If a scan was run recently, continue the schedule based on stored nextScanTimestamp
    const remaining = state.agentState.nextScanTimestamp ? state.agentState.nextScanTimestamp - now : SCAN_CYCLE_INTERVAL_MS - elapsed;
    delayMs = Math.max(2000, remaining);
    console.log(`[AUTONOMOUS AGENT] Resuming 30-min scheduler. Next scan in ${Math.round(delayMs / 1000 / 60)} minutes.`);
  } else {
    console.log('[AUTONOMOUS AGENT] Triggering initial 30-min full market scan cycle.');
  }

  scheduleNext30MinScan(delayMs);
}

function scheduleNext30MinScan(delayMs: number): void {
  if (!isRunning) return;
  if (scanSchedulerTimeout) clearTimeout(scanSchedulerTimeout);

  scanSchedulerTimeout = setTimeout(async () => {
    try {
      await run30MinAutonomousCycle();
    } catch (err) {
      console.error('[AUTONOMOUS AGENT] Error executing 30-minute cycle:', err);
    } finally {
      if (isRunning) {
        scheduleNext30MinScan(SCAN_CYCLE_INTERVAL_MS);
      }
    }
  }, delayMs);
}

/**
 * The Authoritative 30-Minute Full Portfolio & Market Scan Cycle.
 * Executes:
 * LIVE DATA → STOCK SCAN → CRYPTO SCAN → OPPORTUNITY RANKING → AI DECISION
 * → RISK ENGINE → PAPER ENTRY → POSITION MONITORING → TP/SL MANAGEMENT
 * → PARTIAL TP → EXIT → JOURNAL → RESCAN
 */
export async function run30MinAutonomousCycle(): Promise<void> {
  const now = Date.now();
  const state = getState();

  // Authoritative timestamps saved immediately
  state.agentState.lastScanTimestamp = now;
  state.agentState.nextScanTimestamp = now + SCAN_CYCLE_INTERVAL_MS;
  state.agentState.lastCycleAt = now;
  saveState(state);

  lastAction = '30_MIN_CYCLE_STARTED';
  lastActionTimestamp = now;

  console.log(`[AUTONOMOUS AGENT] ========================================`);
  console.log(`[AUTONOMOUS AGENT] STARTING 30-MINUTE AUTONOMOUS CYCLE at ${new Date(now).toISOString()}`);
  console.log(`[AUTONOMOUS AGENT] ========================================`);

  // ---------------------------------------------------------------------------
  // REQUIREMENT 10: BITGET DATA STALENESS / CONNECTION CHECK
  // ---------------------------------------------------------------------------
  const mcpStatus = await getBitgetMcpStatus();
  if (mcpStatus.status !== 'LIVE') {
    state.agentState.state = 'WAITING';
    saveState(state);
    logActivity({
      type: 'MONITOR',
      title: 'BITGET DATA UNAVAILABLE / RECONNECTING',
      detail: `Bitget Agent Hub MCP status is ${mcpStatus.status}. Pausing new entries to prevent price fabrication. Existing positions preserved.`,
    });
    return;
  }

  // ---------------------------------------------------------------------------
  // STEP 1: 30-MINUTE DEEP POSITION MANAGEMENT (Requirements 7 & 8)
  // ---------------------------------------------------------------------------
  state.agentState.state = 'MONITORING';
  saveState(state);

  if (state.openPositions.length > 0) {
    console.log(`[AUTONOMOUS AGENT] Running 30-minute deep position management on ${state.openPositions.length} open trades...`);
    await evaluateAndManageOpenPositions(true);
  }

  if (!state.settings.isAutonomousActive) {
    state.agentState.state = 'WAITING';
    saveState(state);
    return;
  }

  // ---------------------------------------------------------------------------
  // STEP 2: CONCURRENCY CEILING CHECK (Requirement 5)
  // Maximum simultaneous open paper positions = 5.
  // ---------------------------------------------------------------------------
  const currentOpenCount = state.openPositions.length;
  const availableSlots = Math.max(0, 5 - currentOpenCount);

  if (availableSlots === 0) {
    state.agentState.state = 'MONITORING';
    state.agentState.conviction = 90;
    saveState(state);
    logActivity({
      type: 'SCAN',
      title: 'CONCURRENCY CEILING ACTIVE (5/5 POSITIONS)',
      detail: 'Portfolio holds maximum 5 concurrent open positions. Continuously managing active trades. New scalps will recycle immediately when any position exits.',
    });
    return;
  }

  // ---------------------------------------------------------------------------
  // STEP 3: FULL MARKET SCAN & PRIORITY OPPORTUNITY RANKING (Requirements 2 & 4)
  // Priority: Stocks / Stock Tokens first -> Crypto second -> Gold / Silver / Oil afterward
  // ---------------------------------------------------------------------------
  state.agentState.state = 'SCANNING';
  saveState(state);

  const scannerState = await scanAndRankOpportunities();

  state.agentState.state = 'ANALYZING EVENT';
  saveState(state);

  // Filter for valid setups:
  // Requirement 4: "Never force a trade. If no valid setup exists, WAIT."
  const nowTs = Date.now();
  const actionableCandidates = scannerState.rankedOpportunities.filter((opp) => {
    if (opp.action === 'WAIT' || opp.rankScore < 70 || opp.rr < 1.5) return false;
    // Cannot already be held
    if (state.openPositions.some((p) => p.asset === opp.asset)) return false;
    // Anti-churn cooldown: Never immediately re-enter an asset manually closed within 15 minutes
    const recentManualClose = state.closedTrades.find(
      (ct) => ct.asset === opp.asset && ct.exitReason === 'MANUAL_CLOSE' && nowTs - ct.closedAt < 900000
    );
    if (recentManualClose) return false;
    // Anti-revenge cooldown: 3 minutes after stop out
    const recentStop = state.closedTrades.find(
      (ct) => ct.asset === opp.asset && ct.exitReason === 'STOP_LOSS' && nowTs - ct.closedAt < 180000
    );
    if (recentStop) return false;
    return true;
  });

  if (actionableCandidates.length === 0) {
    state.agentState.state = 'WAITING';
    state.agentState.conviction = 68;
    saveState(state);

    logActivity({
      type: 'SCAN',
      title: `30-MIN SCAN COMPLETE: ${scannerState.assetsScannedCount} ASSETS SCANNED`,
      detail: `Available slots: ${availableSlots}/5. Zero forced trades: No candidate currently satisfies strict entry criteria (Score >= 70, R:R >= 1.5). WAITING for high-conviction structure.`,
      asset: 'BTC',
    });
    return;
  }

  // ---------------------------------------------------------------------------
  // STEP 4: AI DECISION & DETERMINISTIC RISK ENGINE EVALUATION (Requirements 6 & 9)
  // ---------------------------------------------------------------------------
  state.agentState.state = 'CROSS-CHECKING';
  saveState(state);

  const candidatesToEvaluate = actionableCandidates.slice(0, availableSlots);

  for (const candidate of candidatesToEvaluate) {
    // Check concurrency again before each trade execution
    if (state.openPositions.length >= 5) break;

    state.agentState.currentAsset = candidate.asset;
    state.agentState.state = 'RISK CHECK';
    state.agentState.conviction = candidate.confidence;
    saveState(state);

    logActivity({
      type: 'ANALYSIS',
      title: `30-MIN SCAN CANDIDATE: ${candidate.direction} ${candidate.asset} [${candidate.category}]`,
      detail: `Score: ${candidate.rankScore}/100 | R:R: ${candidate.rr}:1 | MTF: ${candidate.mtfAlignment} | SMC: ${candidate.bosChoch} ${candidate.orderBlock}. Submitting to Deterministic 20-Gate Risk Engine.`,
      asset: candidate.asset,
    });

    // Requirement 9: Deterministic Risk Engine is the FINAL AUTHORITY
    const riskResult = await evaluateRisk({
      asset: candidate.asset,
      direction: candidate.direction,
      action: candidate.action === 'BUY' ? 'BUY' : 'SELL',
      entry: candidate.entry,
      stop_loss: candidate.sl,
      take_profit: candidate.tp,
      leverage: candidate.category === 'CRYPTO' ? 8 : 5,
      risk_percent: 1.5,
      confidence: candidate.confidence,
      isManual: false,
    });

    if (!riskResult.approved) {
      logActivity({
        type: 'RISK_REJECT',
        title: `RISK ENGINE REJECTED: ${candidate.direction} ${candidate.asset}`,
        detail: `Gate failed: ${riskResult.reason}. Trade aborted.`,
        asset: candidate.asset,
      });
      continue;
    }

    // -------------------------------------------------------------------------
    // STEP 5: PAPER ENTRY EXECUTION USING VERIFIED REAL BITGET MARKET DATA (Req 6)
    // -------------------------------------------------------------------------
    state.agentState.state = 'EXECUTING';
    saveState(state);

    logActivity({
      type: 'RISK_PASS',
      title: `RISK ENGINE APPROVED: ${candidate.direction} ${candidate.asset}`,
      detail: `All 20 deterministic checks passed. Executing paper trade on real Bitget market feed.`,
      asset: candidate.asset,
    });

    await executePaperTrade(
      {
        asset: candidate.asset,
        direction: candidate.direction,
        action: candidate.action === 'BUY' ? 'BUY' : 'SELL',
        entry: candidate.entry,
        stop_loss: candidate.sl,
        take_profit: candidate.tp,
        leverage: candidate.category === 'CRYPTO' ? 8 : 5,
        risk_percent: 1.5,
        confidence: candidate.confidence,
      },
      riskResult,
      `Autonomous 30-Min Cycle: ${candidate.category} Priority Setup (${candidate.mtfAlignment} MTF)`,
      `SMC Analysis: ${candidate.marketStructure} ${candidate.bosChoch} ${candidate.orderBlock} | FVG: ${candidate.fvg} | Sweep: ${candidate.liquiditySweep ? 'YES' : 'NO'}`
    );

    lastAction = `ENTERED_${candidate.direction}_${candidate.asset}`;
    lastActionTimestamp = Date.now();
  }

  // ---------------------------------------------------------------------------
  // STEP 6: MONITORING RESUMED
  // ---------------------------------------------------------------------------
  state.agentState.state = 'MONITORING';
  state.agentState.conviction = 88;
  saveState(state);
  console.log(`[AUTONOMOUS AGENT] 30-Minute Cycle completed. Next scheduled scan at: ${new Date(state.agentState.nextScanTimestamp).toISOString()}`);
}

/**
 * Dynamic position recycling scan:
 * Triggered immediately when any open position closes, recycling the slot instantly.
 */
async function triggerDynamicRecyclingScan(): Promise<void> {
  const state = getState();
  const availableSlots = Math.max(0, 5 - state.openPositions.length);
  if (availableSlots <= 0) return;

  console.log(`[AUTONOMOUS AGENT] Executing dynamic slot recycling scan (available slots: ${availableSlots}/5)...`);
  const scannerState = await scanAndRankOpportunities();

  const nowTs = Date.now();
  const actionable = scannerState.rankedOpportunities.filter((opp) => {
    if (opp.action === 'WAIT' || opp.rankScore < 70 || opp.rr < 1.5) return false;
    // Cannot already be held
    if (state.openPositions.some((p) => p.asset === opp.asset)) return false;
    // Anti-churn cooldown: Never immediately re-enter an asset manually closed within 15 minutes
    const recentManualClose = state.closedTrades.find(
      (ct) => ct.asset === opp.asset && ct.exitReason === 'MANUAL_CLOSE' && nowTs - ct.closedAt < 900000
    );
    if (recentManualClose) return false;
    // Anti-revenge cooldown: 3 minutes after stop out
    const recentStop = state.closedTrades.find(
      (ct) => ct.asset === opp.asset && ct.exitReason === 'STOP_LOSS' && nowTs - ct.closedAt < 180000
    );
    if (recentStop) return false;
    return true;
  });

  if (actionable.length === 0) {
    console.log('[AUTONOMOUS AGENT] Dynamic recycling scan found no setups meeting threshold. Waiting for next 30-min cycle.');
    return;
  }

  const topCandidate = actionable[0];
  const riskResult = await evaluateRisk({
    asset: topCandidate.asset,
    direction: topCandidate.direction,
    action: topCandidate.action === 'BUY' ? 'BUY' : 'SELL',
    entry: topCandidate.entry,
    stop_loss: topCandidate.sl,
    take_profit: topCandidate.tp,
    leverage: topCandidate.category === 'CRYPTO' ? 8 : 5,
    risk_percent: 1.5,
    confidence: topCandidate.confidence,
    isManual: false,
  });

  if (riskResult.approved && state.openPositions.length < 5) {
    await executePaperTrade(
      {
        asset: topCandidate.asset,
        direction: topCandidate.direction,
        action: topCandidate.action === 'BUY' ? 'BUY' : 'SELL',
        entry: topCandidate.entry,
        stop_loss: topCandidate.sl,
        take_profit: topCandidate.tp,
        leverage: topCandidate.category === 'CRYPTO' ? 8 : 5,
        risk_percent: 1.5,
        confidence: topCandidate.confidence,
      },
      riskResult,
      `Dynamic Recycled Scalp: ${topCandidate.category} Opportunity`,
      `Instantly recycled position slot upon trade close. R:R: ${topCandidate.rr}:1.`
    );
    lastAction = `RECYCLED_${topCandidate.direction}_${topCandidate.asset}`;
    lastActionTimestamp = Date.now();
  }
}

/**
 * Authoritative Engine Status for Dashboard and Client API (Requirement 12)
 */
export async function getAutonomousEngineStatus(): Promise<AutonomousEngineStatus> {
  const state = getState();
  const mcp = await getBitgetMcpStatus();
  const now = Date.now();
  const uptimeSeconds = Math.floor((now - engineStartedAt) / 1000);

  const lastScan = state.agentState.lastScanTimestamp || engineStartedAt;
  const nextScan = state.agentState.nextScanTimestamp || lastScan + SCAN_CYCLE_INTERVAL_MS;

  const totalUnrealized = state.openPositions.reduce((acc, p) => acc + (p.unrealizedPnl || 0), 0);

  return {
    isRunning,
    engineStartedAt,
    engineUptimeSeconds: uptimeSeconds,
    lastScanTimestamp: lastScan,
    nextScanTimestamp: nextScan,
    scanIntervalMs: SCAN_CYCLE_INTERVAL_MS,
    positionMonitoringIntervalMs: POSITION_MONITOR_INTERVAL_MS,
    openPositionsCount: state.openPositions.length,
    maxOpenPositions: 5,
    availableSlots: Math.max(0, 5 - state.openPositions.length),
    realizedPnl: state.portfolio.realizedPnl,
    unrealizedPnl: parseFloat(totalUnrealized.toFixed(2)),
    totalTradesExecuted: state.closedTrades.length + state.openPositions.length,
    mcpStatus: mcp.status,
    isStaleOrDisconnected: mcp.status !== 'LIVE',
    priorityOrder: [
      '1. Stocks / Stock Tokens (EQUITIES)',
      '2. Crypto (CRYPTO)',
      '3. Gold / Silver / Oil (COMMODITIES)',
    ],
    lastAction,
    lastActionTimestamp,
    recoveryCount: state.agentState.recoveryCount || 1,
  };
}
