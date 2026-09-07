'use client'

/**
 * CompanyProfile — a TradingView company-profile widget for one symbol, in a
 * gui frame.
 *
 * The description, sector, and shareholder rows are TradingView's, drawn
 * inside TradingView's own document, so the widget is an `<iframe>` and
 * nothing here draws a pixel of it. What this owns is the frame around it and
 * the settings the widget opens with — symbol, locale, theme — written into
 * the iframe's address the way TradingView's own embed script writes them:
 * `/embed-widget/symbol-profile/?locale=…#<settings as JSON>`. Nothing is
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

export type CompanyProfileTheme = 'light' | 'dark'

export interface CompanyProfileProps extends Omit<YStackProps, 'width' | 'height' | 'colorTheme'> {
  /** The symbol to describe, exchange-qualified. */
  symbol?: string
  width?: string | number
  height?: string | number
  locale?: string
  /** The widget's own palette; independent of the surrounding gui theme. */
  colorTheme?: CompanyProfileTheme
  isTransparent?: boolean
}

const EMBED = 'https://www.tradingview-widget.com/embed-widget/symbol-profile/?locale='

/** The settings TradingView reads, with the documented defaults filled in. */
const settings = ({
  symbol = 'NASDAQ:AAPL',
  width = '100%',
  height = 400,
  locale = 'en',
  colorTheme = 'dark',
  isTransparent = false,
}: CompanyProfileProps) => ({
  symbol,
  width,
  height,
  colorTheme,
  isTransparent,
})

const CompanyProfile = ({
  symbol,
  width,
  height,
  locale = 'en',
  colorTheme,
  isTransparent,
  ...props
}: CompanyProfileProps) => {
  const s = settings({ symbol, width, height, locale, colorTheme, isTransparent })
  const src = `${EMBED}${locale}#${encodeURIComponent(JSON.stringify(s))}`
  return (
    <YStack
      {...slot('company-profile')}
      data-symbol={s.symbol}
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
          title={`${s.symbol} company profile`}
          loading="lazy"
          scrolling="no"
          style={{ display: 'block', width: '100%', height: '100%', border: 0 }}
        />
      )}
    </YStack>
  )
}

export { CompanyProfile }
