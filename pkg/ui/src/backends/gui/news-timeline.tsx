'use client'

/**
 * NewsTimeline — a TradingView news feed, in a gui frame.
 *
 * The headlines are TradingView's, drawn inside TradingView's own document, so
 * the feed is an `<iframe>` and nothing here draws a pixel of it. What this
 * owns is the frame around it and the settings the feed opens with — which
 * mode it filters by, which market or symbol that mode reads, the theme —
 * written into the iframe's address the way TradingView's own embed script
 * writes them: `/embed-widget/timeline/?locale=…#<settings as JSON>`. Nothing
 * is fetched or injected at mount, so the markup is the same on the server and
 * in the browser, and the frame has its height before the feed arrives.
 *
 * `feedMode` picks what narrows the headlines: `all_symbols` takes none of
 * `market`/`symbol`, `market` reads `market`, and `symbol` reads `symbol`.
 *
 * The iframe is keyed on that address. A browser treats a `src` that differs
 * only in its fragment as a same-document navigation and does not reload, so
 * without the key a changed prop would leave the old feed on screen.
 */
import { YStack, isWeb, type YStackProps } from '@hanzo/gui'
import { slot } from './slot'

export type NewsTimelineFeedMode = 'all_symbols' | 'market' | 'symbol'

export type NewsTimelineTheme = 'light' | 'dark'

export interface NewsTimelineProps extends Omit<YStackProps, 'width' | 'height' | 'colorTheme'> {
  /** News feed filter mode. */
  feedMode?: NewsTimelineFeedMode
  /** Market to display news for, read when `feedMode` is `market`. */
  market?: string
  /** Specific symbol for news, read when `feedMode` is `symbol`. */
  symbol?: string
  width?: string | number
  height?: string | number
  /** The feed's own palette; independent of the surrounding gui theme. */
  colorTheme?: NewsTimelineTheme
  locale?: string
  isTransparent?: boolean
}

const EMBED = 'https://www.tradingview-widget.com/embed-widget/timeline/?locale='

/** The settings TradingView reads, with the documented defaults filled in. */
const settings = ({
  feedMode = 'all_symbols',
  market = 'crypto',
  symbol,
  width = '100%',
  height = 400,
  colorTheme = 'dark',
  isTransparent = false,
}: NewsTimelineProps) => ({
  displayMode: 'regular',
  feedMode,
  ...(feedMode === 'market' ? { market } : {}),
  ...(feedMode === 'symbol' ? { symbol: symbol ?? '' } : {}),
  colorTheme,
  isTransparent,
  width,
  height,
})

const NewsTimeline = ({
  feedMode,
  market,
  symbol,
  width,
  height,
  colorTheme,
  locale = 'en',
  isTransparent,
  ...props
}: NewsTimelineProps) => {
  const s = settings({ feedMode, market, symbol, width, height, colorTheme, isTransparent })
  const src = `${EMBED}${locale}#${encodeURIComponent(JSON.stringify(s))}`
  return (
    <YStack
      {...slot('news-timeline')}
      data-feed-mode={s.feedMode}
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
          title="News timeline"
          loading="lazy"
          scrolling="no"
          style={{ display: 'block', width: '100%', height: '100%', border: 0 }}
        />
      )}
    </YStack>
  )
}

export { NewsTimeline }
