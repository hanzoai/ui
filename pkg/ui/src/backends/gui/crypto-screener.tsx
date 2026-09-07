'use client'

/**
 * CryptoScreener — a TradingView screener table, in a gui frame.
 *
 * The rows are TradingView's, drawn inside TradingView's own document, so the
 * table is an `<iframe>` and nothing here draws a pixel of it. What this owns
 * is the frame around it and the settings the table opens with — which market
 * it screens, which column set it opens on, the display currency, the theme —
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
 * (`america`, `india`, `forex_mkt`, `bond_mkt`, …), plus `crypto` as the
 * short name for `crypto_mkt` this component defaults to.
 */
export type CryptoScreenerMarket = 'crypto' | (string & {})

export type CryptoScreenerColumn =
  | 'overview'
  | 'performance'
  | 'oscillators'
  | 'moving_averages'
  | 'valuation'

export type CryptoScreenerTheme = 'light' | 'dark'

/** `crypto` is the one short name; every other market is its own screener_type. */
const screenerType = (market: CryptoScreenerMarket) =>
  market === 'crypto' ? 'crypto_mkt' : market

export interface CryptoScreenerProps extends Omit<YStackProps, 'width' | 'height' | 'theme'> {
  /** Which market the table screens. */
  market?: CryptoScreenerMarket
  /** Which column set the table opens on. */
  defaultColumn?: CryptoScreenerColumn
  /** The currency prices and volumes are shown in. */
  displayCurrency?: string
  /** The table's own palette; independent of the surrounding gui theme. */
  colorTheme?: CryptoScreenerTheme
  isTransparent?: boolean
  locale?: string
  width?: string | number
  height?: string | number
}

const EMBED = 'https://www.tradingview-widget.com/embed-widget/screener/?locale='

/** The settings TradingView reads, with the documented defaults filled in. */
const settings = ({
  market = 'crypto',
  defaultColumn = 'overview',
  displayCurrency = 'USD',
  colorTheme = 'dark',
  isTransparent = false,
  locale = 'en',
  width = '100%',
  height = 550,
}: CryptoScreenerProps) => ({
  defaultColumn,
  screener_type: screenerType(market),
  displayCurrency,
  colorTheme,
  isTransparent,
  locale,
  width,
  height,
})

const CryptoScreener = ({
  market,
  defaultColumn,
  displayCurrency,
  colorTheme,
  isTransparent,
  locale,
  width,
  height,
  ...props
}: CryptoScreenerProps) => {
  const s = settings({
    market,
    defaultColumn,
    displayCurrency,
    colorTheme,
    isTransparent,
    locale,
    width,
    height,
  })
  const src = `${EMBED}${s.locale}#${encodeURIComponent(JSON.stringify(s))}`
  return (
    <YStack
      {...slot('crypto-screener')}
      data-market={market ?? 'crypto'}
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
          title={`${market ?? 'crypto'} screener`}
          loading="lazy"
          scrolling="no"
          style={{ display: 'block', width: '100%', height: '100%', border: 0 }}
        />
      )}
    </YStack>
  )
}

export { CryptoScreener }
