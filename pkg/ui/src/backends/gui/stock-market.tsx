'use client'

/**
 * StockMarket — the indices-flavored opening of the TradingView market-overview
 * table that `./crypto-market` already renders.
 *
 * `market-overview.tsx`, `crypto-market.tsx`, `forex-market.tsx` and
 * `stock-market.tsx` are four doc pages for ONE upstream widget, told apart
 * only by which tab it opens on — crypto, forex, indices. Duplicating the
 * iframe address, the preset table and the settings object under a second
 * name would give the table two places to drift out of sync with itself, so
 * this file holds none of that: it is `MarketOverview` with its `tabs` default
 * turned from `['crypto']` to `['indices']`, nothing else.
 */
import { MarketOverview, type MarketOverviewProps } from './crypto-market'

export type {
  MarketOverviewPreset as StockMarketPreset,
  MarketOverviewSymbol as StockMarketSymbol,
  MarketOverviewTab as StockMarketTab,
  MarketOverviewTheme as StockMarketTheme,
} from './crypto-market'

export type StockMarketProps = MarketOverviewProps

export function StockMarket({ tabs = ['indices'], ...props }: StockMarketProps) {
  return <MarketOverview tabs={tabs} {...props} />
}
