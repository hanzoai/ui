'use client'

/**
 * TechnicalAnalysis — TradingView's technical-indicator summary for one
 * symbol, in a gui frame.
 *
 * The gauges and the moving-average/oscillator tables are TradingView's own,
 * drawn inside TradingView's document, so this is an `<iframe>` and nothing
 * here computes an indicator. What this owns is the frame around it and the
 * settings the widget opens with — symbol, interval, theme, the interval
 * tabs, the single/multiple layout — written into the iframe's address the
 * way TradingView's own embed script writes them:
 * `/embed-widget/technical-analysis/?locale=…#<settings as JSON>`. Nothing is
 * fetched or injected at mount, so the markup is the same on the server and
 * in the browser, and the frame has its height before the widget arrives.
 *
 * The iframe is keyed on that address. A browser treats a `src` that differs
 * only in its fragment as a same-document navigation and does not reload, so
 * without the key a new `symbol` would change the URL and leave the old
 * widget on screen.
 */
import { YStack, isWeb, type YStackProps } from '@hanzo/gui'
import { slot } from './slot'

export type TechnicalAnalysisInterval =
  | '1m'
  | '5m'
  | '15m'
  | '30m'
  | '1h'
  | '2h'
  | '4h'
  | '1D'
  | '1W'
  | '1M'

export type TechnicalAnalysisTheme = 'light' | 'dark'
export type TechnicalAnalysisDisplayMode = 'single' | 'multiple'

export interface TechnicalAnalysisProps extends Omit<YStackProps, 'width' | 'height' | 'theme'> {
  /** The symbol to analyze, exchange-qualified. */
  symbol?: string
  /** Minutes, hours, or a day/week/month per analysis window. */
  interval?: TechnicalAnalysisInterval
  width?: string | number
  height?: string | number
  locale?: string
  /** The widget's own palette; independent of the surrounding gui theme. */
  colorTheme?: TechnicalAnalysisTheme
  isTransparent?: boolean
  showIntervalTabs?: boolean
  /** One summary gauge, or the full oscillators/moving-averages breakdown. */
  displayMode?: TechnicalAnalysisDisplayMode
}

const EMBED = 'https://www.tradingview-widget.com/embed-widget/technical-analysis/?locale=en#'

/** The settings TradingView reads, with the documented defaults filled in. */
const settings = ({
  symbol = 'NASDAQ:AAPL',
  interval = '1D',
  width = '100%',
  height = 450,
  locale = 'en',
  colorTheme = 'dark',
  isTransparent = false,
  showIntervalTabs = true,
  displayMode = 'single',
}: TechnicalAnalysisProps) => ({
  symbol,
  interval,
  width,
  height,
  locale,
  colorTheme,
  isTransparent,
  showIntervalTabs,
  displayMode,
})

const TechnicalAnalysis = ({
  symbol,
  interval,
  width,
  height,
  locale,
  colorTheme,
  isTransparent,
  showIntervalTabs,
  displayMode,
  ...props
}: TechnicalAnalysisProps) => {
  const s = settings({
    symbol,
    interval,
    width,
    height,
    locale,
    colorTheme,
    isTransparent,
    showIntervalTabs,
    displayMode,
  })
  const src = EMBED + encodeURIComponent(JSON.stringify(s))
  return (
    <YStack
      {...slot('technical-analysis')}
      data-symbol={s.symbol}
      data-interval={s.interval}
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
          title={`${s.symbol} technical analysis`}
          loading="lazy"
          scrolling="no"
          style={{ display: 'block', width: '100%', height: '100%', border: 0 }}
        />
      )}
    </YStack>
  )
}

export { TechnicalAnalysis }
