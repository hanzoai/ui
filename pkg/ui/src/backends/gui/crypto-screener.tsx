'use client'

/**
 * CryptoScreener — TradingView's crypto market screener, in a gui frame.
 *
 * The table is TradingView's own document, so it is an `<iframe>` and nothing
 * here draws a row of it. What this owns is the frame around it and the
 * settings the screener opens with — the column set, the display currency,
 * the theme — written into the iframe's address the way TradingView's own
 * embed script writes them:
 * `/embed-widget/screener/?locale=…#<settings as JSON>`. Nothing is fetched or
 * injected at mount, so the markup is the same on the server and in the
 * browser, and the frame has its height before the table arrives.
 *
 * The iframe is keyed on that address, because a browser treats a `src` that
 * differs only in its fragment as a same-document navigation and does not
 * reload — without the key a new `defaultColumn` would change the URL and
 * leave the old table on screen.
 */
import { YStack, isWeb, type YStackProps } from '@hanzo/gui'
import { slot } from './slot'

export type CryptoScreenerColumn = 'overview' | 'performance' | 'oscillators' | 'moving_averages'
export type CryptoScreenerTheme = 'light' | 'dark'
export type CryptoScreenerMarket = 'crypto'

export interface CryptoScreenerProps extends Omit<YStackProps, 'width' | 'height' | 'theme'> {
  /** The market the screener lists; TradingView's crypto table. */
  market?: CryptoScreenerMarket
  /** Which column set opens first; the toolbar still switches it live. */
  defaultColumn?: CryptoScreenerColumn
  /** The currency prices and market caps are shown in. */
  displayCurrency?: string
  /** The screener's own palette; independent of the surrounding gui theme. */
  colorTheme?: CryptoScreenerTheme
  isTransparent?: boolean
  locale?: string
  width?: string | number
  height?: string | number
}

const EMBED = 'https://www.tradingview-widget.com/embed-widget/screener/?locale=en#'

/** The settings TradingView reads, with the documented defaults filled in. */
const settings = ({
  defaultColumn = 'overview',
  displayCurrency = 'USD',
  colorTheme = 'dark',
  isTransparent = false,
  locale = 'en',
  width = '100%',
  height = 550,
}: CryptoScreenerProps) => ({
  defaultColumn,
  screener_type: 'crypto_mkt',
  displayCurrency,
  colorTheme,
  isTransparent,
  locale,
  width,
  height,
})

const CryptoScreener = ({
  market: _market,
  defaultColumn,
  displayCurrency,
  colorTheme,
  isTransparent,
  locale,
  width,
  height,
  ...props
}: CryptoScreenerProps) => {
  const s = settings({ defaultColumn, displayCurrency, colorTheme, isTransparent, locale, width, height })
  const src = EMBED + encodeURIComponent(JSON.stringify(s))
  return (
    <YStack
      {...slot('crypto-screener')}
      data-column={s.defaultColumn}
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
          title="Crypto screener"
          loading="lazy"
          scrolling="no"
          style={{ display: 'block', width: '100%', height: '100%', border: 0 }}
        />
      )}
    </YStack>
  )
}

export { CryptoScreener }
