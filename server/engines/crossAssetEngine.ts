import { CrossAssetRelationship, MarketRegime } from '../../src/types.js';
import { fetchLiveQuote } from '../providers/marketData.js';

export interface CrossAssetSummary {
  regime: MarketRegime;
  relationships: CrossAssetRelationship[];
  divergences: string[];
  macroTheme: string;
  equityCryptoCorrelation: number;
  dollarYieldPressure: 'EASING' | 'NEUTRAL' | 'TIGHTENING';
}

export async function analyzeCrossAsset(): Promise<CrossAssetSummary> {
  const [btcQuote, qqqQuote, spyQuote, xauQuote, clQuote] = await Promise.all([
    fetchLiveQuote('BTC'),
    fetchLiveQuote('QQQ'),
    fetchLiveQuote('SPY'),
    fetchLiveQuote('XAU'),
    fetchLiveQuote('CL'),
  ]);

  const btcChg = btcQuote.change24h;
  const qqqChg = qqqQuote.change24h;
  const spyChg = spyQuote.change24h;
  const xauChg = xauQuote.change24h;
  const clChg = clQuote.change24h;

  const relationships: CrossAssetRelationship[] = [
    {
      source: 'BTC (Digital Growth)',
      target: 'QQQ (Nasdaq 100)',
      relationship: btcChg * qqqChg > 0 ? 'POSITIVE' : 'DIVERGENT',
      correlation: 0.74,
      description: 'High correlation with liquidity conditions and tech sector risk appetite.',
    },
    {
      source: 'Gold (XAU)',
      target: 'Real Yields / USD',
      relationship: xauChg > 0 && spyChg > 0 ? 'DIVERGENT' : 'INVERSE',
      correlation: -0.62,
      description: 'Hedge against currency debasement and geopolitical uncertainty.',
    },
    {
      source: 'WTI Oil (CL)',
      target: 'Headline Inflation Expectations',
      relationship: 'POSITIVE',
      correlation: 0.58,
      description: 'Input cost pressure on corporate margins and consumer real purchasing power.',
    },
    {
      source: 'SPY (S&P 500)',
      target: 'High-Yield Credit Spreads',
      relationship: 'INVERSE',
      correlation: -0.78,
      description: 'Tighter credit spreads provide bedrock liquidity for broad equities.',
    },
    {
      source: 'BTC (Liquidity Gauge)',
      target: 'Gold (Monetary Reserve)',
      relationship: 'POSITIVE',
      correlation: 0.44,
      description: 'Both assets express monetary debasement and central bank balance sheet expansion.',
    },
  ];

  const divergences: string[] = [];
  if (btcChg > 2 && qqqChg < -0.5) {
    divergences.push('Crypto decoupling: BTC exhibiting idiosyncratic strength relative to Tech Equities.');
  } else if (btcChg < -2 && qqqChg > 0.5) {
    divergences.push('Crypto lagging: BTC underperforming broad equities despite firm equity backdrop.');
  }

  if (xauChg > 1.5 && spyChg > 1) {
    divergences.push('Simultaneous Gold & Equity bid: Suggests debasement trade rather than pure risk-off fear.');
  }

  // Determine cross-asset regime
  let regime: MarketRegime = 'RISK-ON';
  if (spyChg < -1 && qqqChg < -1.5) {
    regime = 'RISK-OFF';
  } else if (Math.abs(spyChg) < 0.3 && Math.abs(btcChg) < 0.8) {
    regime = 'NEUTRAL';
  } else if (divergences.length > 0) {
    regime = 'TRANSITION';
  }

  return {
    regime,
    relationships,
    divergences,
    macroTheme: regime === 'RISK-ON' ? 'Growth Expansion & Liquidity Inflow' : regime === 'RISK-OFF' ? 'Capital Preservation & Defensive Flight' : 'Cross-Asset Consolidation',
    equityCryptoCorrelation: 0.72,
    dollarYieldPressure: 'EASING',
  };
}
