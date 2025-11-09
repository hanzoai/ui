'use client'

import { useEffect, useRef, memo } from 'react'

function TickerTape() {
  const container = useRef<HTMLDivElement>(null)
  const scriptLoaded = useRef(false)

  useEffect(() => {
    if (!container.current || scriptLoaded.current) return

    // Mark as loaded to prevent duplicate execution in React StrictMode
    scriptLoaded.current = true

    // Check if widget already exists (in case of StrictMode double-render)
    const existingWidget = container.current.querySelector('.tradingview-widget-container__widget')
    if (existingWidget && existingWidget.querySelector('iframe')) {
      return
    }

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js'
    script.type = 'text/javascript'
    script.async = true
    script.innerHTML = JSON.stringify({
      symbols: [
        { proName: 'FOREXCOM:SPXUSD', title: 'S&P 500' },
        { proName: 'FOREXCOM:NSXUSD', title: 'US 100' },
        { proName: 'FX_IDC:EURUSD', title: 'EUR/USD' },
        { proName: 'BITSTAMP:BTCUSD', title: 'Bitcoin' },
        { proName: 'BITSTAMP:ETHUSD', title: 'Ethereum' },
        { description: 'Tesla', proName: 'NASDAQ:TSLA' },
        { description: 'Apple', proName: 'NASDAQ:AAPL' },
        { description: 'Amazon', proName: 'NASDAQ:AMZN' },
        { description: 'NVIDIA', proName: 'NASDAQ:NVDA' },
        { description: 'Microsoft', proName: 'NASDAQ:MSFT' },
        { description: 'Google', proName: 'NASDAQ:GOOGL' },
        { description: 'Meta', proName: 'NASDAQ:META' },
      ],
      showSymbolLogo: true,
      isTransparent: false,
      displayMode: 'adaptive',
      colorTheme: 'dark',
      locale: 'en',
    })

    container.current.appendChild(script)
  }, [])

  return (
    <div className="tradingview-widget-container w-full" ref={container}>
      <div className="tradingview-widget-container__widget"></div>
    </div>
  )
}

export default memo(TickerTape)
