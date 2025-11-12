'use client'

import { useEffect, useRef } from 'react'

export interface TechnicalAnalysisProps {
  symbol?: string
  interval?: '1m' | '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '1D' | '1W' | '1M'
  width?: string | number
  height?: string | number
  locale?: string
  colorTheme?: 'light' | 'dark'
  isTransparent?: boolean
  showIntervalTabs?: boolean
  displayMode?: 'single' | 'multiple'
}

export default function TechnicalAnalysis({
  symbol = 'NASDAQ:AAPL',
  interval = '15m',
  width = '100%',
  height = '500',
  locale = 'en',
  colorTheme = 'dark',
  isTransparent = false,
  showIntervalTabs = true,
  displayMode = 'single'
}: TechnicalAnalysisProps) {
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
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js'
    script.async = true
    script.innerHTML = JSON.stringify({
      interval,
      width,
      isTransparent,
      height,
      symbol,
      showIntervalTabs,
      displayMode,
      locale,
      colorTheme,
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
  }, [symbol, interval, width, height, locale, colorTheme, isTransparent, showIntervalTabs, displayMode])

  return (
    <div className="tradingview-widget-container w-full h-[500px]" ref={containerRef}>
      <div className="tradingview-widget-container__widget h-full"></div>
    </div>
  )
}
