'use client'

/**
 * ForexMarket — the forex-flavored opening of the TradingView market-overview
 * table that `./crypto-market` already renders.
 *
 * `market-overview.tsx`, `crypto-market.tsx`, `forex-market.tsx` and
 * `stock-market.tsx` are four doc pages for ONE upstream widget, told apart
 * only by which tab it opens on — crypto, forex, indices. Duplicating the
 * iframe address, the preset table and the settings object under a second
 * name would give the table two places to drift out of sync with itself, so
 * this file holds none of that: it is `MarketOverview` with its `tabs` default
 * turned from `['crypto']` to `['forex']`, nothing else.
 */
import { MarketOverview, type MarketOverviewProps } from './crypto-market'

export type {
  MarketOverviewPreset as ForexMarketPreset,
  MarketOverviewSymbol as ForexMarketSymbol,
  MarketOverviewTab as ForexMarketTab,
  MarketOverviewTheme as ForexMarketTheme,
} from './crypto-market'

export type ForexMarketProps = MarketOverviewProps

export function ForexMarket({ tabs = ['forex'], ...props }: ForexMarketProps) {
  return <MarketOverview tabs={tabs} {...props} />
}
