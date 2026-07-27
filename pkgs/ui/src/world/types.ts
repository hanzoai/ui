/**
 * @hanzo/ui/world - Shared data types
 *
 * Prop shapes for the World data components. These mirror the typed data the
 * hanzoai/world panels consume, so a host can feed the same payloads the
 * /v1/world API returns. Numeric fields keep `| null` as the missing-data
 * sentinel — components branch on null to show "N/A" rather than a fake 0.
 */

/** Standard async data envelope shared by every self-fetching component. */
export interface PanelState<T> {
  data: T | null
  loading: boolean
  error: string | null
  /** Source reported no data (endpoint reachable but empty/unavailable). */
  unavailable?: boolean
}

/** Severity ramp used for alerts, threats and instability. */
export type WorldSeverity = 'critical' | 'high' | 'elevated' | 'normal' | 'low' | 'info'

/* ------------------------------------------------------------------ */
/*  NewsStream                                                        */
/* ------------------------------------------------------------------ */

export interface NewsStreamItem {
  /** Stable key. Falls back to `url` then title+index. */
  id?: string
  title: string
  /** Publisher / feed name, e.g. "Reuters". */
  source?: string
  /** Canonical article link (http/https only — validated at render). */
  url?: string
  /** Publish time — Date, epoch ms, or ISO string. */
  timestamp?: string | number | Date
  /** Free-form category / topic label. */
  category?: string
  /** Highlights the item and colors its rail. */
  severity?: WorldSeverity
  /** Optional place label, e.g. "Kyiv, UA". */
  location?: string
}

/* ------------------------------------------------------------------ */
/*  MarketTicker                                                      */
/* ------------------------------------------------------------------ */

export interface MarketQuote {
  /** Trading symbol, e.g. "AAPL", "BTC". */
  symbol: string
  /** Display name, e.g. "Apple Inc.". */
  name?: string
  /** Last price. `null` = unavailable. */
  price: number | null
  /** Percent change over the period. `null` = unavailable. */
  change: number | null
  /** Recent price series for the inline sparkline. */
  sparkline?: number[]
  /** Currency prefix, default "$". Pass "" for indices. */
  currency?: string
}

/* ------------------------------------------------------------------ */
/*  InstabilityScore                                                  */
/* ------------------------------------------------------------------ */

export type InstabilityLevel = 'low' | 'normal' | 'elevated' | 'high' | 'critical'
export type InstabilityTrend = 'rising' | 'stable' | 'falling'

/** Per-driver breakdown (0-100 each). Mirrors world's ComponentScores. */
export interface InstabilityComponents {
  unrest?: number
  conflict?: number
  security?: number
  information?: number
}

export interface InstabilityScoreData {
  /** Composite score, 0-100. */
  score: number
  /** ISO country code or region key, e.g. "UA". */
  code?: string
  /** Display label, e.g. "Ukraine". */
  name?: string
  /** Severity band. Derived from `score` when omitted. */
  level?: InstabilityLevel
  /** Directional movement. */
  trend?: InstabilityTrend
  /** Change over the last 24h (score points). */
  change24h?: number
  /** Optional driver breakdown, rendered as mini bars. */
  components?: InstabilityComponents
}

/* ------------------------------------------------------------------ */
/*  PredictionMarket                                                  */
/* ------------------------------------------------------------------ */

export interface PredictionMarketItem {
  title: string
  /** Probability of "yes" as a percentage, 0-100. */
  yesPrice: number
  /** Notional traded volume (USD). */
  volume?: number
  /** Market link (http/https only). */
  url?: string
}
