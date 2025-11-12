'use client'

import { useEffect, useRef } from 'react'

export interface SymbolInfoProps {
  symbol?: string
  width?: string | number
  locale?: string
  colorTheme?: 'light' | 'dark'
  isTransparent?: boolean
}

export default function SymbolInfo({
  symbol = 'NASDAQ:AAPL',
  width = '100%',
  locale = 'en',
  colorTheme = 'dark',
  isTransparent = false
}: SymbolInfoProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Check if widget is already initialized using data attribute
    if (containerRef.current.dataset.initialized === 'true') {
      return // Widget already initialized, skip
    }

    // Mark as initialized before adding script
    containerRef.current.dataset.initialized = 'true'

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js'
    script.async = true
    script.innerHTML = JSON.stringify({
      symbol,
      width,
      locale,
      colorTheme,
      isTransparent,
    })

    containerRef.current.appendChild(script)

    return () => {
      if (containerRef.current) {
        // Remove initialization flag on unmount
        delete containerRef.current.dataset.initialized
        // Remove all scripts
        const scripts = containerRef.current.querySelectorAll('script')
        scripts.forEach((s) => s.remove())
      }
    }
  }, [symbol, width, locale, colorTheme, isTransparent])

  return (
    <div className="tradingview-widget-container" ref={containerRef}>
      <div className="tradingview-widget-container__widget"></div>
    </div>
  )
}
