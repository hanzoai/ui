'use client'

/**
 * StockScreener — a TradingView equity screener table, in a gui frame.
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

/** The market the table screens — TradingView's own `screener_type` values (`america`, `india`, `germany`, …). */
export type StockScreenerMarket = 'america' | (string & {})

export type StockScreenerColumn =
  | 'overview'
  | 'performance'
  | 'oscillators'
  | 'moving_averages'

export type StockScreenerScreen =
  | 'general'
  | 'top_gainers'
  | 'top_losers'
  | 'most_volatile'
  | (string & {})

export type StockScreenerTheme = 'light' | 'dark'

export interface StockScreenerProps extends Omit<YStackProps, 'width' | 'height' | 'theme'> {
  /** Which market the table screens. */
  market?: StockScreenerMarket
  /** Which column set the table opens on. */
  defaultColumn?: StockScreenerColumn
  /** Which preset screen the table opens filtered to. */
  defaultScreen?: StockScreenerScreen
  /** Whether the toolbar (screen picker, column picker) is shown. */
  showToolbar?: boolean
  /** The table's own palette; independent of the surrounding gui theme. */
  colorTheme?: StockScreenerTheme
  isTransparent?: boolean
  locale?: string
  width?: string | number
  height?: string | number
}

const EMBED = 'https://www.tradingview-widget.com/embed-widget/screener/?locale='

/** The settings TradingView reads, with the documented defaults filled in. */
const settings = ({
  market = 'america',
  defaultColumn = 'overview',
  defaultScreen = 'general',
  showToolbar = true,
  colorTheme = 'dark',
  isTransparent = false,
  locale = 'en',
  width = '100%',
  height = 500,
}: StockScreenerProps) => ({
  defaultColumn,
  defaultScreen,
  screener_type: market,
  showToolbar,
  colorTheme,
  isTransparent,
  locale,
  width,
  height,
})

const StockScreener = ({
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
}: StockScreenerProps) => {
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
      {...slot('stock-screener')}
      data-market={market ?? 'america'}
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
          title={`${market ?? 'america'} screener`}
          loading="lazy"
          scrolling="no"
          style={{ display: 'block', width: '100%', height: '100%', border: 0 }}
        />
      )}
    </YStack>
  )
}

export { StockScreener }
