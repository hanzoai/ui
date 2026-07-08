/**
 * @hanzo/ui/world
 *
 * Reusable, embeddable data-stream components ported from hanzoai/world
 * (world.hanzo.ai). Self-contained React + TS, MIT, no external deps beyond
 * @hanzo/ui peers. Feed them data via props or the `useWorldData` hooks that
 * hit the /v1/world API.
 *
 * Default look = the world.hanzo.ai Geist/black-monochrome aesthetic. Re-skin
 * to any host by overriding the `--world-*` custom properties — import the
 * tokens once:
 *
 *   import '@hanzo/ui/world/tokens.css'
 *   import { NewsStream, MarketTicker } from '@hanzo/ui/world'
 */

// Components
export { NewsStream } from './news-stream'
export type { NewsStreamProps } from './news-stream'

export { MarketTicker } from './market-ticker'
export type { MarketTickerProps } from './market-ticker'

export { InstabilityScore } from './instability-score'
export type { InstabilityScoreProps } from './instability-score'

export { PredictionMarket } from './prediction-market'
export type { PredictionMarketProps } from './prediction-market'

// Data hooks
export {
  useWorldData,
  useNewsStream,
  useMarketTicker,
  usePredictionMarkets,
  useInstabilityScores,
} from './hooks'
export type { UseWorldDataOptions } from './hooks'

// Formatting + safety helpers (reusable in host cells / custom renders)
export {
  formatPrice,
  formatChange,
  formatCompact,
  formatVolume,
  formatRelativeTime,
  safeUrl,
  sparklinePoints,
  instabilityLevel,
} from './format'

// Types
export type {
  PanelState,
  WorldSeverity,
  NewsStreamItem,
  MarketQuote,
  InstabilityLevel,
  InstabilityTrend,
  InstabilityComponents,
  InstabilityScoreData,
  PredictionMarketItem,
} from './types'
