'use client'

import { useEffect, useRef, memo } from 'react'

function AdvancedChart({ symbol = 'NASDAQ:AAPL' }: { symbol?: string }) {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!container.current) return

    // Check if widget is already initialized using data attribute
    if (container.current.dataset.initialized === 'true') {
      return // Widget already initialized, skip
    }

    // Mark as initialized before adding script
    container.current.dataset.initialized = 'true'

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.type = 'text/javascript'
    script.async = true
    script.innerHTML = JSON.stringify({
      width: '100%',
      height: '600',
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

    // Cleanup function
    return () => {
      if (container.current) {
        // Remove initialization flag on unmount
        delete container.current.dataset.initialized
        // Remove all scripts
        const scripts = container.current.querySelectorAll('script')
        scripts.forEach((s) => s.remove())
      }
    }
  }, [symbol])

  return (
    <div className="tradingview-widget-container w-full h-[600px]" ref={container}>
      <div className="tradingview-widget-container__widget h-full"></div>
    </div>
  )
}

export default memo(AdvancedChart)
