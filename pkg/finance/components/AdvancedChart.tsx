'use client'

import { useEffect, useRef, memo } from 'react'

function AdvancedChart({ symbol = 'NASDAQ:AAPL' }: { symbol?: string }) {
  const container = useRef<HTMLDivElement>(null)
  const scriptLoaded = useRef(false)

  useEffect(() => {
    if (!container.current) return

    // Check if widget already exists with the same symbol (in case of StrictMode double-render)
    const existingWidget = container.current.querySelector('.tradingview-widget-container__widget')
    if (existingWidget && existingWidget.querySelector('iframe')) {
      // Widget already exists, only reload if symbol changed
      if (scriptLoaded.current) {
        return
      }
    }

    // Mark as loaded to prevent duplicate execution in React StrictMode
    scriptLoaded.current = true

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.type = 'text/javascript'
    script.async = true
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval: 'D',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      allow_symbol_change: true,
      calendar: false,
      support_host: 'https://www.tradingview.com',
    })

    container.current.appendChild(script)
  }, [symbol])

  return (
    <div className="tradingview-widget-container w-full h-[600px]" ref={container}>
      <div className="tradingview-widget-container__widget h-full"></div>
    </div>
  )
}

export default memo(AdvancedChart)
