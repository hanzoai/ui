'use client'

import { useEffect, useRef, memo } from 'react'

function ForexScreener() {
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
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-screener.js'
    script.type = 'text/javascript'
    script.async = true
    script.innerHTML = JSON.stringify({
      market: 'forex',
      showToolbar: true,
      defaultColumn: 'overview',
      defaultScreen: 'general',
      isTransparent: false,
      locale: 'en',
      colorTheme: 'dark',
      width: '100%',
      height: 550,
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
  }, [])

  return (
    <div className="tradingview-widget-container w-full" ref={container}>
      <div className="tradingview-widget-container__widget"></div>
    </div>
  )
}

export default memo(ForexScreener)
