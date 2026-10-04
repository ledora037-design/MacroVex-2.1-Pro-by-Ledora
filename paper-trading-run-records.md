# MacroVex 2.1 Pro — Paper Trading Run Records

## Validation Overview

MacroVex 2.1 Pro operates in PAPER mode using real market prices and news, with Bitget MCP connectivity and a deterministic 20-rule risk gate.

## Portfolio Snapshot

| Metric | Observed Value |
|---|---:|
| Starting Capital | $100,000 |
| Current Portfolio Equity | $109,038.63 |
| Portfolio Return | +9.04% |
| Dashboard Realized P&L | +$9,038.63 |
| Current Unrealized P&L | +$20.65 |
| Peak Drawdown | -1.75% |
| Current Open Positions | 5 / 5 |
| Used Margin | $4,000 |
| Risk Cap / Trade | $240 (0.2%) |
| Trading Mode | PAPER |
| Bitget MCP Status | LIVE |
| Data Pipelines | HEALTHY |

## Trade Journal Snapshot

The current execution ledger contains 15 closed trades in the journal view used for this validation snapshot.

| Metric | Observed Value |
|---|---:|
| Total Closed Trades | 15 |
| Wins | 6 |
| Losses | 9 |
| Win Rate | 40.0% |
| Net Realized P&L in Journal View | +$3,885.18 |
| Average R Multiple | +0.47R |
| Baseline R:R | 2.1:1 |

## Closed Trade Execution Ledger

### Trade 001 — NVDA
- Trade ID: `TRD-MUF1NAS3-4QKH`
- Instrument: NVDA [5x]
- Direction: LONG
- Entry: $225.21
- Exit: $231.02
- Entry Time: 2026-09-24 04:40:39 UTC
- Exit Time: 2026-10-04 12:46:32 UTC
- Duration: 248:05:53
- Net P&L: +$47.12
- R Multiple: +1.96R
- Exit Reason: TAKE_PROFIT
- Macro Catalyst: Dynamic Recycled Scalp: EQUITIES Opportunity

### Trade 002 — META
- Trade ID: `TRD-MUD4YAQR-8I8J`
- Instrument: META [5x]
- Direction: LONG
- Entry: $737.52
- Exit: $738.78
- Entry Time: 2026-09-22 20:37:39 UTC
- Exit Time: 2026-10-04 12:46:22 UTC
- Duration: 280:08:43
- Net P&L: -$0.59
- R Multiple: -0.02R
- Exit Reason: STOP_LOSS
- Macro Catalyst: Autonomous 30-Min Cycle: EQUITIES Priority Setup (ALIGNED MTF)

### Trade 003 — AAPL
- Trade ID: `TRD-MUD4YAJX-X03O`
- Instrument: AAPL [5x]
- Direction: LONG
- Entry: $339.94
- Exit: $335.86
- Entry Time: 2026-09-22 20:37:38 UTC
- Exit Time: 2026-10-04 12:46:13 UTC
- Duration: 280:08:34
- Net P&L: -$52.38
- R Multiple: -1.09R
- Exit Reason: STOP_LOSS
- Macro Catalyst: Autonomous 30-Min Cycle: EQUITIES Priority Setup (ALIGNED MTF)

### Trade 004 — MSFT
- Trade ID: `TRD-MUD4YAM7-XZ14`
- Instrument: MSFT [5x]
- Direction: LONG
- Entry: $498.18
- Exit: $511.03
- Entry Time: 2026-09-22 20:37:39 UTC
- Exit Time: 2026-09-26 10:52:26 UTC
- Duration: 86:14:47
- Net P&L: +$47.59
- R Multiple: +1.98R
- Exit Reason: TAKE_PROFIT
- Macro Catalyst: Autonomous 30-Min Cycle: EQUITIES Priority Setup (ALIGNED MTF)

### Trade 005 — AMZN
- Trade ID: `TRD-MUD4YAOH-UBJO`
- Instrument: AMZN [5x]
- Direction: LONG
- Entry: $255.29
- Exit: $252.23
- Entry Time: 2026-09-22 20:37:39 UTC
- Exit Time: 2026-09-24 04:40:34 UTC
- Duration: 32:02:56
- Net P&L: -$51.95
- R Multiple: -1.08R
- Exit Reason: STOP_LOSS
- Macro Catalyst: Autonomous 30-Min Cycle: EQUITIES Priority Setup (ALIGNED MTF)

### Trade 006 — NVDA
- Trade ID: `TRD-MUD4W8C0-3JC7`
- Instrument: NVDA [5x]
- Direction: LONG
- Entry: $228.34
- Exit: $228.38
- Entry Time: 2026-09-22 20:36:02 UTC
- Exit Time: 2026-09-22 20:56:01 UTC
- Duration: 00:19:59
- Net P&L: -$3.30
- R Multiple: -0.07R
- Exit Reason: MANUAL_CLOSE
- Macro Catalyst: Dynamic Recycled Scalp: EQUITIES Opportunity

### Trade 007 — NVDA
- Trade ID: `TRD-MUAC0A47-WQ23`
- Instrument: NVDA [5x]
- Direction: LONG
- Entry: $221.34
- Exit: $228.34
- Entry Time: 2026-09-20 21:31:50 UTC
- Exit Time: 2026-09-22 20:35:58 UTC
- Duration: 47:04:08
- Net P&L: +$1,875.56
- R Multiple: +2.51R
- Exit Reason: MANUAL_CLOSE
- Macro Catalyst: Dynamic Recycled Scalp: EQUITIES Opportunity

### Trade 008 — BTC
- Trade ID: `TRD-MUAA6ASE-2QF8`
- Instrument: BTC [8x]
- Direction: LONG
- Entry: $81,092.10
- Exit: $85,139.90
- Entry Time: 2026-09-20 20:40:32 UTC
- Exit Time: 2026-09-22 20:35:32 UTC
- Duration: 47:55:00
- Net P&L: +$2,263.04
- R Multiple: +3.03R
- Exit Reason: TAKE_PROFIT
- Macro Catalyst: Full-Market Scalper: ALIGNED MTF & Macro NEUTRAL

### Trade 009 — NVDA
- Trade ID: `TRD-MUAAJVXX-Y7O6`
- Instrument: NVDA [3x]
- Direction: LONG
- Entry: $221.00
- Exit: $221.34
- Entry Time: 2026-09-20 20:51:05 UTC
- Exit Time: 2026-09-20 21:31:47 UTC
- Duration: 00:40:42
- Net P&L: +$50.85
- R Multiple: +0.03R
- Exit Reason: MANUAL_CLOSE
- Macro Catalyst: Manual Trader Execution via Asset Intelligence Desk

### Trade 010 — BTC
- Trade ID: `TRD-MUAA2Y94-N0ET`
- Instrument: BTC [8x]
- Direction: LONG
- Entry: $81,062.10
- Exit: $81,092.10
- Entry Time: 2026-09-20 20:37:55 UTC
- Exit Time: 2026-09-20 20:40:29 UTC
- Duration: 00:02:34
- Net P&L: -$58.92
- R Multiple: -0.04R
- Exit Reason: MANUAL_CLOSE
- Macro Catalyst: Full-Market Scalper: ALIGNED MTF & Macro NEUTRAL

### Trade 011 — AAPL
- Trade ID: `TRD-MU6UC8QL-HAVM`
- Instrument: AAPL [5x]
- Direction: LONG
- Entry: $337.00
- Exit: $334.80
- Entry Time: 2026-09-18 10:53:56 UTC
- Exit Time: 2026-09-19 10:17:49 UTC
- Duration: 23:23:53
- Net P&L: -$694.79
- R Multiple: -0.47R
- Exit Reason: MANUAL_CLOSE
- Macro Catalyst: FOMC Interest Rate Decision & Monetary Policy Statement (Federal Reserve Board)

### Trade 012 — XAU
- Trade ID: `TRD-MU86IOJ9-03ZL`
- Instrument: XAU [5x]
- Direction: LONG
- Entry: $4,424.90
- Exit: $4,381.96
- Entry Time: 2026-09-19 09:22:38 UTC
- Exit Time: 2026-09-19 10:17:47 UTC
- Duration: 00:55:09
- Net P&L: -$1,018.36
- R Multiple: -0.67R
- Exit Reason: MANUAL_CLOSE
- Macro Catalyst: FOMC Interest Rate Decision & Monetary Policy Statement (Federal Reserve Board)

### Trade 013 — BTC
- Trade ID: `TRD-MU86FJXE-HT9K`
- Instrument: BTC [5x]
- Direction: LONG
- Entry: $81,396.20
- Exit: $81,471.10
- Entry Time: 2026-09-19 09:20:12 UTC
- Exit Time: 2026-09-19 09:22:27 UTC
- Duration: 00:02:14
- Net P&L: -$7.60
- R Multiple: +0R
- Exit Reason: MANUAL_CLOSE
- Macro Catalyst: FOMC Interest Rate Decision & Monetary Policy Statement (Federal Reserve Board)

### Trade 014 — BTC
- Trade ID: `TRD-MU6U9U6D-YWRM`
- Instrument: BTC [5x]
- Direction: LONG
- Entry: $78,252.20
- Exit: $80,944.08
- Entry Time: 2026-09-18 10:52:04 UTC
- Exit Time: 2026-09-19 09:20:08 UTC
- Duration: 22:28:04
- Net P&L: +$3,081.47
- R Multiple: +2.09R
- Exit Reason: TAKE_PROFIT
- Macro Catalyst: FOMC Interest Rate Decision & Monetary Policy Statement (Federal Reserve Board)

### Trade 015 — BTC
- Trade ID: `TRD-MU4N2XF7-M5PV`
- Instrument: BTC [5x]
- Direction: LONG
- Entry: $89,450.00
- Exit: $88,000.00
- Entry Time: 2026-09-16 21:55:12 UTC
- Exit Time: 2026-09-18 10:51:43 UTC
- Duration: 36:56:30
- Net P&L: -$1,592.56
- R Multiple: -1.06R
- Exit Reason: STOP_LOSS
- Macro Catalyst: Manual Trader Execution via Asset Intelligence Desk

## Execution Notes

- Trading environment: PAPER
- Market data: Bitget
- Bitget MCP status at portfolio snapshot: LIVE
- Data pipeline status at portfolio snapshot: HEALTHY
- Realized P&L includes Bitget MCP fees and slippage according to the journal summary.
- Maximum simultaneous open positions: 5
- Current portfolio snapshot shows 5/5 positions open.
- Current used margin at snapshot: $4,000.
- All timestamps are recorded in UTC.
- Trade records are historical paper-trading records and do not represent real-money trading performance.

## Data Availability Note

The current journal view supplied for this validation record does not expose a separate per-trade `quantity` field or a separate per-trade `account balance change` field. These values are therefore not reconstructed or estimated here.

The recorded fields above are copied from the MacroVex execution ledger and portfolio snapshot without inventing missing values.

## Validation Scope

This record is intended to provide reviewers with an auditable snapshot of MacroVex 2.1 Pro's paper-trading workflow, including actual recorded timestamps, instruments, directions, entry/exit prices, P&L, R multiples, exit reasons, macro catalysts and portfolio-level state.

Performance figures are labeled as observed values from the current MacroVex paper-trading environment. They are not presented as guaranteed future performance or live-money results.