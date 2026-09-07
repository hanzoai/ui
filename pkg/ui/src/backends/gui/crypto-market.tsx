'use client'

/**
 * MarketOverview — a TradingView multi-tab market table, in a gui frame.
 *
 * The rows are TradingView's, drawn inside TradingView's own document, so the
 * table is an `<iframe>` and nothing here draws a pixel of it. What this owns
 * is the frame around it and the settings the table opens with — which tabs,
 * which symbols fill each one, the date range, the theme — written into the
 * iframe's address the way TradingView's own embed script writes them:
 * `/embed-widget/market-overview/?locale=…#<settings as JSON>`. Nothing is
 * fetched or injected at mount, so the markup is the same on the server and in
 * the browser, and the frame has its height before the table arrives.
 *
 * A tab is named by one of the built-in symbol groups (`crypto`, `indices`,
 * `futures`, `bonds`, `forex`) or spelled out in full as a `{ title, symbols }`
 * pair, so a caller reaches for `tabs={['crypto']}` most of the time and for a
 * custom group only when the built-ins don't cover it.
 *
 * The iframe is keyed on that address. A browser treats a `src` that differs
 * only in its fragment as a same-document navigation and does not reload, so
 * without the key a changed `tabs` would leave the old table on screen.
 */
import { YStack, isWeb, type YStackProps } from '@hanzo/gui'
import { slot } from './slot'

export interface MarketOverviewSymbol {
  /** Exchange-qualified ticker, e.g. `BINANCE:BTCUSDT`. */
  s: string
  /** The label shown in the row. */
  d: string
}

export interface MarketOverviewTab {
  title: string
  symbols: MarketOverviewSymbol[]
}

export type MarketOverviewPreset = 'crypto' | 'indices' | 'futures' | 'bonds' | 'forex'

export type MarketOverviewTheme = 'light' | 'dark'

const PRESETS: Record<MarketOverviewPreset, MarketOverviewTab> = {
  crypto: {
    title: 'Crypto',
    symbols: [
      { s: 'BINANCE:BTCUSDT', d: 'Bitcoin' },
      { s: 'BINANCE:ETHUSDT', d: 'Ethereum' },
      { s: 'BINANCE:SOLUSDT', d: 'Solana' },
      { s: 'BINANCE:BNBUSDT', d: 'BNB' },
      { s: 'BINANCE:XRPUSDT', d: 'XRP' },
      { s: 'BINANCE:ADAUSDT', d: 'Cardano' },
    ],
  },
  indices: {
    title: 'Indices',
    symbols: [
      { s: 'FOREXCOM:SPXUSD', d: 'S&P 500 Index' },
      { s: 'FOREXCOM:NSXUSD', d: 'US 100 Cash CFD' },
      { s: 'FOREXCOM:DJI', d: 'Dow Jones Industrial Average Index' },
      { s: 'INDEX:NKY', d: 'Japan 225' },
      { s: 'INDEX:DEU40', d: 'DAX Index' },
      { s: 'FOREXCOM:UKXGBP', d: 'FTSE 100 Index' },
    ],
  },
  futures: {
    title: 'Futures',
    symbols: [
      { s: 'BMFBOVESPA:ISP1!', d: 'S&P 500' },
      { s: 'BMFBOVESPA:EUR1!', d: 'Euro' },
      { s: 'CMCMARKETS:GOLD', d: 'Gold' },
      { s: 'PYTH:WTI3!', d: 'WTI Crude Oil' },
      { s: 'BMFBOVESPA:CCM1!', d: 'Corn' },
    ],
  },
  bonds: {
    title: 'Bonds',
    symbols: [
      { s: 'EUREX:FGBL1!', d: 'Euro Bund' },
      { s: 'EUREX:FBTP1!', d: 'Euro BTP' },
      { s: 'EUREX:FGBM1!', d: 'Euro BOBL' },
    ],
  },
  forex: {
    title: 'Forex',
    symbols: [
      { s: 'FX:EURUSD', d: 'EUR to USD' },
      { s: 'FX:GBPUSD', d: 'GBP to USD' },
      { s: 'FX:USDJPY', d: 'USD to JPY' },
      { s: 'FX:USDCHF', d: 'USD to CHF' },
      { s: 'FX:AUDUSD', d: 'AUD to USD' },
      { s: 'FX:USDCAD', d: 'USD to CAD' },
    ],
  },
}

const resolveTab = (tab: MarketOverviewPreset | MarketOverviewTab): MarketOverviewTab =>
  typeof tab === 'string' ? PRESETS[tab] : tab

export interface MarketOverviewProps extends Omit<YStackProps, 'width' | 'height' | 'theme'> {
  /** Which tabs the table opens with, a preset name or a spelled-out group. */
  tabs?: (MarketOverviewPreset | MarketOverviewTab)[]
  /** The table's own palette; independent of the surrounding gui theme. */
  colorTheme?: MarketOverviewTheme
  /** How far back the sparkline in each row reaches. */
  dateRange?: string
  locale?: string
  isTransparent?: boolean
  showFloatingTooltip?: boolean
  showSymbolLogo?: boolean
  showChart?: boolean
  width?: string | number
  height?: string | number
}

const EMBED = 'https://www.tradingview-widget.com/embed-widget/market-overview/?locale='

/** The settings TradingView reads, with the documented defaults filled in. */
const settings = ({
  tabs = ['crypto'],
  colorTheme = 'dark',
  dateRange = '12M',
  locale = 'en',
  isTransparent = false,
  showFloatingTooltip = false,
  showSymbolLogo = true,
  showChart = true,
  width = '100%',
  height = 550,
}: MarketOverviewProps) => ({
  colorTheme,
  dateRange,
  locale,
  isTransparent,
  showFloatingTooltip,
  plotLineColorGrowing: 'rgba(41, 98, 255, 1)',
  plotLineColorFalling: 'rgba(41, 98, 255, 1)',
  gridLineColor: 'rgba(240, 243, 250, 0)',
  scaleFontColor: colorTheme === 'dark' ? '#DBDBDB' : '#333333',
  belowLineFillColorGrowing: 'rgba(41, 98, 255, 0.12)',
  belowLineFillColorFalling: 'rgba(41, 98, 255, 0.12)',
  belowLineFillColorGrowingBottom: 'rgba(41, 98, 255, 0)',
  belowLineFillColorFallingBottom: 'rgba(41, 98, 255, 0)',
  symbolActiveColor: 'rgba(41, 98, 255, 0.12)',
  tabs: tabs.map(resolveTab),
  support_host: 'https://www.tradingview.com',
  backgroundColor: colorTheme === 'dark' ? '#0f0f0f' : '#ffffff',
  width,
  height,
  showSymbolLogo,
  showChart,
})

const MarketOverview = ({
  tabs,
  colorTheme,
  dateRange,
  locale,
  isTransparent,
  showFloatingTooltip,
  showSymbolLogo,
  showChart,
  width,
  height,
  ...props
}: MarketOverviewProps) => {
  const s = settings({
    tabs,
    colorTheme,
    dateRange,
    locale,
    isTransparent,
    showFloatingTooltip,
    showSymbolLogo,
    showChart,
    width,
    height,
  })
  const src = `${EMBED}${s.locale}#${encodeURIComponent(JSON.stringify(s))}`
  const titles = s.tabs.map((t) => t.title).join(', ')
  return (
    <YStack
      {...slot('market-overview')}
      data-tabs={s.tabs.map((t) => t.title).join(',')}
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
          title={`${titles} market overview`}
          loading="lazy"
          scrolling="no"
          style={{ display: 'block', width: '100%', height: '100%', border: 0 }}
        />
      )}
    </YStack>
  )
}

export { MarketOverview }
