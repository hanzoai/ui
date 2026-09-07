'use client'

/**
 * AdvancedChart — a TradingView chart of one symbol, in a gui frame.
 *
 * The candles are TradingView's, drawn inside TradingView's own document, so
 * the chart is an `<iframe>` and nothing here draws a pixel of it. What this
 * owns is the frame around it and the settings the chart opens with — symbol,
 * interval, theme, the toolbars, the save-image control — written into the
 * iframe's address the way TradingView's own embed script writes them:
 * `/embed-widget/advanced-chart/?locale=…#<settings as JSON>`. Nothing is
 * fetched or injected at mount, so the markup is the same on the server and in
 * the browser, and the frame has its height before the chart arrives.
 *
 * The iframe is keyed on that address. A browser treats a `src` that differs
 * only in its fragment as a same-document navigation and does not reload, so
 * without the key a new `symbol` would change the URL and leave the old chart
 * on screen.
 */
import { YStack, isWeb, type YStackProps } from '@hanzo/gui'
import { slot } from './slot'

export type AdvancedChartInterval =
  | '1'
  | '3'
  | '5'
  | '15'
  | '30'
  | '60'
  | '120'
  | '180'
  | '240'
  | 'D'
  | 'W'
  | 'M'

export type AdvancedChartTheme = 'light' | 'dark'

export interface AdvancedChartProps extends Omit<YStackProps, 'width' | 'height' | 'theme'> {
  /** The symbol to chart, exchange-qualified. */
  symbol?: string
  /** Minutes, or a day, a week, a month per bar. */
  interval?: AdvancedChartInterval
  /** The chart's own palette; independent of the surrounding gui theme. */
  theme?: AdvancedChartTheme
  width?: string | number
  height?: string | number
  /** Fill the frame; the chart then ignores its own `width` and `height`. */
  autosize?: boolean
  hideTopToolbar?: boolean
  hideSideToolbar?: boolean
  saveImage?: boolean
}

const EMBED = 'https://www.tradingview-widget.com/embed-widget/advanced-chart/?locale=en#'

/** The settings TradingView reads, with the documented defaults filled in. */
const settings = ({
  symbol = 'NASDAQ:AAPL',
  interval = 'D',
  theme = 'dark',
  width = '100%',
  height = 500,
  autosize = true,
  hideTopToolbar = false,
  hideSideToolbar = false,
  saveImage = true,
}: AdvancedChartProps) => ({
  symbol,
  interval,
  theme,
  width,
  height,
  autosize,
  hide_top_toolbar: hideTopToolbar,
  hide_side_toolbar: hideSideToolbar,
  save_image: saveImage,
  allow_symbol_change: true,
  timezone: 'Etc/UTC',
  style: '1',
  calendar: false,
  support_host: 'https://www.tradingview.com',
})

const AdvancedChart = ({
  symbol,
  interval,
  theme,
  width,
  height,
  autosize,
  hideTopToolbar,
  hideSideToolbar,
  saveImage,
  ...props
}: AdvancedChartProps) => {
  const s = settings({
    symbol,
    interval,
    theme,
    width,
    height,
    autosize,
    hideTopToolbar,
    hideSideToolbar,
    saveImage,
  })
  const src = EMBED + encodeURIComponent(JSON.stringify(s))
  return (
    <YStack
      {...slot('advanced-chart')}
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
          title={`${s.symbol} chart`}
          loading="lazy"
          scrolling="no"
          allowFullScreen
          style={{ display: 'block', width: '100%', height: '100%', border: 0 }}
        />
      )}
    </YStack>
  )
}

export { AdvancedChart }
