'use client'

/**
 * Financials — a TradingView financial-statements widget for one symbol, in a
 * gui frame.
 *
 * The statements, ratios and estimates are TradingView's, drawn inside
 * TradingView's own document, so the widget is an `<iframe>` and nothing here
 * draws a row of it. What this owns is the frame around it and the settings it
 * opens with — symbol, display mode, theme — written into the iframe's address
 * the way TradingView's own embed script writes them:
 * `/embed-widget/financials/?locale=…#<settings as JSON>`. Nothing is fetched
 * or injected at mount, so the markup is the same on the server and in the
 * browser, and the frame has its height before the widget arrives.
 *
 * The iframe is keyed on that address. A browser treats a `src` that differs
 * only in its fragment as a same-document navigation and does not reload, so
 * without the key a new `symbol` would change the URL and leave the old
 * widget on screen.
 */
import { YStack, isWeb, type YStackProps } from '@hanzo/gui'
import { slot } from './slot'

export type FinancialsDisplayMode = 'adaptive' | 'regular' | 'compact'

export type FinancialsTheme = 'light' | 'dark'

export interface FinancialsProps extends Omit<YStackProps, 'width' | 'height' | 'theme'> {
  /** The symbol to report on, exchange-qualified. */
  symbol?: string
  width?: string | number
  height?: string | number
  locale?: string
  /** The widget's own palette; independent of the surrounding gui theme. */
  colorTheme?: FinancialsTheme
  isTransparent?: boolean
  displayMode?: FinancialsDisplayMode
  largeChartUrl?: string
}

const EMBED = 'https://www.tradingview-widget.com/embed-widget/financials/?locale='

/** The settings TradingView reads, with the documented defaults filled in. */
const settings = ({
  symbol = 'NASDAQ:AAPL',
  width = '100%',
  height = 800,
  colorTheme = 'dark',
  isTransparent = false,
  displayMode = 'adaptive',
  largeChartUrl = '',
}: FinancialsProps) => ({
  symbol,
  width,
  height,
  colorTheme,
  isTransparent,
  displayMode,
  largeChartUrl,
})

const Financials = ({
  symbol,
  width,
  height,
  locale = 'en',
  colorTheme,
  isTransparent,
  displayMode,
  largeChartUrl,
  ...props
}: FinancialsProps) => {
  const s = settings({ symbol, width, height, colorTheme, isTransparent, displayMode, largeChartUrl })
  const src = EMBED + encodeURIComponent(locale) + '#' + encodeURIComponent(JSON.stringify(s))
  return (
    <YStack
      {...slot('financials')}
      data-symbol={s.symbol}
      data-display-mode={s.displayMode}
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
          title={`${s.symbol} financials`}
          loading="lazy"
          scrolling="no"
          allowFullScreen
          style={{ display: 'block', width: '100%', height: '100%', border: 0 }}
        />
      )}
    </YStack>
  )
}

export { Financials }
