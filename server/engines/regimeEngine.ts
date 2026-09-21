import { MarketRegime } from '../../src/types.js';
import { analyzeCrossAsset } from './crossAssetEngine.js';
import { fetchLiveQuote } from '../providers/marketData.js';

export interface RegimeProfile {
  regime: MarketRegime;
  confidence: number;
  drivers: string[];
  invalidation: string;
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

export async function determineMarketRegime(): Promise<RegimeProfile> {
  const cross = await analyzeCrossAsset();
  const [spyQuote, btcQuote] = await Promise.all([
    fetchLiveQuote('SPY'),
    fetchLiveQuote('BTC'),
  ]);

  const drivers: string[] = [];
  let confidence = 78;

  if (cross.regime === 'RISK-ON') {
    drivers.push('Equity index momentum (SPY, QQQ) positive above multi-session moving averages.');
    drivers.push('Crypto market depth expanding with positive spot inflow momentum.');
    drivers.push('Credit spreads contained; dollar index volatility subdued.');
    confidence = 86;
  } else if (cross.regime === 'RISK-OFF') {
    drivers.push('Flight to cash and short duration Treasuries.');
    drivers.push('High beta and speculative assets experiencing elevated liquidations.');
    drivers.push('Volatility index (VIX) elevated above benchmark baseline.');
    confidence = 82;
  } else if (cross.regime === 'TRANSITION') {
    drivers.push('Cross-asset divergences observed between equities and digital assets.');
    drivers.push('Yield curve repricing creates sector rotation.');
    confidence = 74;
  } else {
    drivers.push('Range-bound consolidation across key asset classes.');
    drivers.push('Awaiting scheduled macroeconomic catalyst prints.');
    confidence = 70;
  }

  const invalidation = cross.regime === 'RISK-ON'
    ? 'SPY closing below key structural swing low or 10-Year yield spiking > 15 bps in a single session.'
    : 'DXY sharp reversal downwards coupled with broad volume breakout in QQQ and BTC.';

  return {
    regime: cross.regime,
    confidence,
    drivers,
    invalidation,
    bias: cross.regime === 'RISK-ON' ? 'BULLISH' : cross.regime === 'RISK-OFF' ? 'BEARISH' : 'NEUTRAL',
  };
}
