# MACROVEX 2.1 PRO ⚡
### Cross-Asset AI Trading & Institutional Market Intelligence Terminal

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey?logo=express)](https://expressjs.com/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-8E75B2?logo=google)](https://ai.google.dev/)
[![Bitget MCP](https://img.shields.io/badge/Bitget-MCP_Server-00F0FF)](https://www.bitget.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**MACROVEX 2.1 PRO** is an institutional-grade, full-stack cryptocurrency and cross-asset trading terminal designed with an AI-driven market intelligence core, **Bitget Model Context Protocol (MCP)** integration, and a **deterministic 20-Gate Risk Engine** that strictly governs all order proposals, margin allocations, and execution workflows.

---

## 🌟 Key Highlights

- **Deterministic 20-Gate Risk Engine**: Every order (AI-proposed or manual) must pass 20 pre-trade, portfolio, and market-structure checks before submission. Trades that breach limits are rejected with explicit diagnostic feedback (`STATUS: RISK REJECTED`).
- **Dynamic Tiered Margin Allocation System**: Strict conceptual separation between:
  - **USDT COMMITTED (Margin Used)**: Collateral locked from balance.
  - **USDT AT RISK (Capital at Risk)**: Maximum monetary loss if Stop-Loss triggers (`Stop Distance × Position Size`).
  - **POSITION NOTIONAL**: Total effective market purchasing power (`Margin Used × Leverage`).
- **Multi-Factor Tiered Margin Sizing**:
  - Weaker Valid Setup: `$100 – $200` margin
  - Normal Setup: `$200 – $500` margin
  - Strong Setup: `$500 – $800` margin
  - Very Strong Setup: `$800 – $1,000` margin
  - Exceptional Setup: `$1,500 – $2,000` margin
  - Strict 2% equity per-trade cap (~`$2,100` on `$105,000` balance) & 10% portfolio margin cap.
- **Smart Money Concepts (SMC) & ICT Analytics**: Real-time detection of Order Blocks (OB), Fair Value Gaps (FVG), Liquidity Sweeps, Market Structure Shifts (MSS), and Break of Structure (BOS).
- **Institutional AI Intelligence (Gemini 2.5 Flash)**: In-depth order-flow analysis, macro sentiment parsing, and structured trade proposals delivered in strict JSON formats.
- **Bitget MCP Server Connectivity**: Native MCP client communicating with Bitget APIs for ticker data, depth, funding rates, and demo/paper execution.
- **Unified Trading Desk**: High-density trading workspace featuring interactive multi-timeframe charts, order ticket, position ledger, live PnL tracker, and risk dials.

---

## 🏛️ System Architecture

```
                                  ┌────────────────────────┐
                                  │   Browser Client (UI)  │
                                  │ React 19 + Tailwind v4 │
                                  └───────────┬────────────┘
                                              │ HTTP / JSON
                                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Express 4.21 Backend Server                           │
│                                                                             │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌───────────────────┐  │
│  │   Gemini 2.5 AI      │  │  20-Gate Deterministic │ │  State Store &    │  │
│  │ Intelligence Engine  │  │     Risk Engine      │  │ Position Manager  │  │
│  └──────────┬───────────┘  └──────────┬───────────┘  └─────────┬─────────┘  │
│             │                         │                        │            │
│             └─────────────────────────┼────────────────────────┘            │
│                                       │                                     │
│                        ┌──────────────┴──────────────┐                      │
│                        │   Bitget MCP Client Engine  │                      │
│                        └──────────────┬──────────────┘                      │
└───────────────────────────────────────┼─────────────────────────────────────┘
                                        │
                                        ▼
                         ┌─────────────────────────────┐
                         │  Bitget Exchange / MCP Hub  │
                         └─────────────────────────────┘
```

---

## 🛡️ The 20 Deterministic Risk Gates

Before any order is allowed to execute or be validated in the ticket, it is evaluated by `server/engines/riskEngine.ts`:

1. **Active Instrument Validation**: Symbol verification against available quote currencies.
2. **Directional Integrity**: Explicit Long or Short verification.
3. **Price Sanity Verification**: Entry, SL, and TP must be non-zero, positive numbers.
4. **Invalidation Logic**: Stop-Loss must be below entry for Longs, and above entry for Shorts.
5. **Take-Profit Direction**: Take-Profit must be above entry for Longs, and below entry for Shorts.
6. **Minimum Risk-to-Reward (R:R)**: Minimum threshold of 1.5:1 enforced.
7. **Maximum Stop-Loss Distance**: Prevents runaway liquidation risks (caps at 15% distance).
8. **Minimum Stop-Loss Distance (Noise Gate)**: Prevents sub-ATR stops liable to be stopped out by exchange spread.
9. **Account Drawdown Circuit Breaker**: Trading halts or reduces size when portfolio drawdown reaches critical levels.
10. **Daily Loss Threshold**: Stops new positions if daily realized + unrealized loss breaches daily budget.
11. **Concurrent Open Position Limit**: Prevents over-leveraging the account across too many open assets.
12. **Sector & Category Concentration**: Enforces maximum margin exposure per asset class (e.g., L1, DeFi, Meme).
13. **Maximum Leverage Cap**: Hard ceiling on permissible leverage per asset volatility profile.
14. **Per-Trade Margin Cap**: Single-trade margin allocation capped at 2% of total account equity.
15. **Total Portfolio Margin Cap**: Combined margin across all active positions cannot exceed 10% of portfolio equity.
16. **Available Cash Collateral**: Verifies unencumbered USDT balance is sufficient.
17. **Capital At Risk Validation**: Ensures theoretical maximum loss does not exceed user's risk percentage budget.
18. **Market Volatility & ATR Filter**: Rejects trades during erratic volatility expansion or news spikes.
19. **Liquidity Sweep Invalidation**: Evaluates recent liquidity sweeps to avoid trading into trapped breakout liquidity.
20. **Spread & Slippage Headroom**: Confirms entry feasibility against active order-book spread.

---

## 📊 Margin Allocation vs. Capital at Risk

A critical innovation in MACROVEX 2.1 PRO is the clean separation between **collateral committed** and **capital at risk**:

| Metric | Formula | What It Means |
| :--- | :--- | :--- |
| **Margin Used** | Determined by Setup Tier & Headroom | Account collateral reserved to back the leveraged trade. |
| **Position Notional** | `Margin Used × Leverage` | Full effective purchasing power and exposure in the market. |
| **Capital At Risk** | `Position Notional × (Stop Distance / Entry)` | Actual maximum dollar loss if the Stop-Loss is hit. |
| **Quantity** | `Position Notional / Entry Price` | Asset units held in the position. |

### Formula Verification:
$$\text{Position Notional} = \text{Margin Used} \times \text{Leverage}$$
$$\text{Capital At Risk} = \text{Quantity} \times |\text{Entry} - \text{Stop Loss}|$$

---

## 📁 Repository Structure

```bash
├── server.ts                       # Express backend entry point & API routes
├── server/
│   ├── engines/
│   │   ├── riskEngine.ts           # 20-Gate Risk Engine & Tiered Margin Allocator
│   │   ├── geminiEngine.ts         # Google Gemini AI market analysis & evaluation
│   │   ├── bitgetMcpClient.ts      # Bitget MCP protocol integration
│   │   └── smcEngine.ts            # Smart Money Concepts / ICT market structure
│   └── store.ts                    # In-memory account state, positions, trades, & settings
├── src/
│   ├── App.tsx                     # Main terminal layout & navigation
│   ├── components/
│   │   ├── UnifiedTradingDesk.tsx  # Core trading workspace, order ticket, charts
│   │   ├── AiTradeDecisionPanel.tsx# AI trade decision & risk sizing panel
│   │   ├── PositionsManager.tsx    # Active positions, orders, and trade ledger
│   │   ├── MarketScanner.tsx       # Multi-timeframe cross-asset scanner
│   │   ├── SmcChart.tsx            # Candlestick chart with SMC indicators
│   │   └── SettingsModal.tsx       # System configurations & risk parameters
│   ├── types.ts                    # Global TypeScript interfaces & data models
│   └── index.css                   # Tailwind CSS v4 styling rules
├── .env.example                    # Template for environment variables
├── package.json                    # Project dependencies & build scripts
└── vite.config.ts                  # Vite build configuration
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v20.x or higher
- **npm** or **pnpm**
- **Google Gemini API Key**: Obtainable from [Google AI Studio](https://aistudio.google.com/)
- *(Optional)* **Bitget API Credentials**: Required for live exchange integration; paper trading mode works out of the box.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/macrovex-2.1-pro.git
   cd macrovex-2.1-pro
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your API credentials:
   ```ini
   # Google Gemini API
   GEMINI_API_KEY=your_gemini_api_key_here

   # Execution Mode (PAPER | DEMO | LIVE)
   TRADING_MODE=PAPER

   # Optional Bitget MCP Credentials
   BITGET_API_KEY=
   BITGET_SECRET_KEY=
   BITGET_PASSPHRASE=
   BITGET_API_BASE_URL=https://api.bitget.com
   BITGET_MODE=demo
   ```

4. **Run Development Server:**
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000`.

5. **Build for Production:**
   ```bash
   npm run build
   npm start
   ```

---

## ⚙️ Available Scripts

- `npm run dev`: Boots the full-stack app in development mode using `tsx` on port 3000.
- `npm run build`: Compiles Vite frontend assets to `dist/` and bundles `server.ts` into a CommonJS production bundle `dist/server.cjs` via `esbuild`.
- `npm start`: Starts the production bundled server via `node dist/server.cjs`.
- `npm run lint`: Validates TypeScript typing with `tsc --noEmit`.

---

## 🔒 Security & Risk Notice

- **Simulated & Paper First**: By default, MACROVEX 2.1 PRO starts in `PAPER` trading mode to protect capital while tuning risk models.
- **Server-Side Key Isolation**: All API keys (`GEMINI_API_KEY`, exchange secrets) reside strictly on the Node.js server side and are never exposed to client-side browser bundles.
- **Financial Disclaimer**: This software is built for educational, analytical, and technological experimentation. Trading cryptocurrencies and leveraged derivatives involves substantial risk of loss. Always exercise independent financial prudence.

---

## 📄 License

N/A
