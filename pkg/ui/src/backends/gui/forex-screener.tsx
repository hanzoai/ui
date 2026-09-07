'use client'

/**
 * ForexScreener — a TradingView currency-pair screener table, in a gui frame.
 *
 * The rows are TradingView's, drawn inside TradingView's own document, so the
 * table is an `<iframe>` and nothing here draws a pixel of it. What this owns
 * is the frame around it and the settings the table opens with — which market
 * it screens, which column set and preset screen it opens on, the theme —
 * written into the iframe's address the way TradingView's own embed script
 * writes them: `/embed-widget/screener/?locale=…#<settings as JSON>`. Nothing
 * is fetched or injected at mount, so the markup is the same on the server and
 * in the browser, and the frame has its height before the table arrives.
 *
 * The iframe is keyed on that address. A browser treats a `src` that differs
 * only in its fragment as a same-document navigation and does not reload, so
 * without the key a changed `market` would leave the old table on screen.
 */
import { YStack, isWeb, type YStackProps } from '@hanzo/gui'
import { slot } from './slot'

/**
 * The market the table screens — TradingView's own `screener_type` values
 * (`america`, `india`, `crypto_mkt`, `bond_mkt`, …), plus `forex` as the
 * short name for `forex_mkt` this component defaults to.
 */
export type ForexScreenerMarket = 'forex' | (string & {})

export type ForexScreenerColumn =
  | 'overview'
  | 'performance'
  | 'oscillators'
  | 'moving_averages'

export type ForexScreenerScreen =
  | 'general'
  | 'top_gainers'
  | 'top_losers'
  | 'most_volatile'
  | (string & {})

export type ForexScreenerTheme = 'light' | 'dark'

/** `forex` is the one short name; every other market is its own screener_type. */
const screenerType = (market: ForexScreenerMarket) =>
  market === 'forex' ? 'forex_mkt' : market

export interface ForexScreenerProps extends Omit<YStackProps, 'width' | 'height' | 'theme'> {
  /** Which market the table screens. */
  market?: ForexScreenerMarket
  /** Which column set the table opens on. */
  defaultColumn?: ForexScreenerColumn
  /** Which preset screen the table opens filtered to. */
  defaultScreen?: ForexScreenerScreen
  /** Whether the toolbar (screen picker, column picker) is shown. */
  showToolbar?: boolean
  /** The table's own palette; independent of the surrounding gui theme. */
  colorTheme?: ForexScreenerTheme
  isTransparent?: boolean
  locale?: string
  width?: string | number
  height?: string | number
}

const EMBED = 'https://www.tradingview-widget.com/embed-widget/screener/?locale='

/** The settings TradingView reads, with the documented defaults filled in. */
const settings = ({
  market = 'forex',
  defaultColumn = 'overview',
  defaultScreen = 'general',
  showToolbar = true,
  colorTheme = 'dark',
  isTransparent = false,
  locale = 'en',
  width = '100%',
  height = 550,
}: ForexScreenerProps) => ({
  defaultColumn,
  defaultScreen,
  screener_type: screenerType(market),
  showToolbar,
  colorTheme,
  isTransparent,
  locale,
  width,
  height,
})

const ForexScreener = ({
  market,
  defaultColumn,
  defaultScreen,
  showToolbar,
  colorTheme,
  isTransparent,
  locale,
  width,
  height,
  ...props
}: ForexScreenerProps) => {
  const s = settings({
    market,
    defaultColumn,
    defaultScreen,
    showToolbar,
    colorTheme,
    isTransparent,
    locale,
    width,
    height,
  })
  const src = `${EMBED}${s.locale}#${encodeURIComponent(JSON.stringify(s))}`
  return (
    <YStack
      {...slot('forex-screener')}
      data-market={market ?? 'forex'}
      data-color-theme={s.colorTheme}
      // The documented size is TradingView's — a number or a percent string —
      // and gui declares a narrower one; on web both reach CSS as written.
      width={s.width as YStackProps['width']}
      height={s.height as YStackProps['height']}
      overflow="hidden"
      position="relative"
      bg="$panel"
      {...props}
    >
      {isWeb && (
        <iframe
          key={src}
          src={src}
          title={`${market ?? 'forex'} screener`}
          loading="lazy"
          scrolling="no"
          style={{ display: 'block', width: '100%', height: '100%', border: 0 }}
        />
      )}
    </YStack>
  )
}

export { ForexScreener }
