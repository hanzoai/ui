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
  height = '100%',
  locale = 'en',
  colorTheme = 'dark',
  isTransparent = false,
  showIntervalTabs = true,
  displayMode = 'single'
}: TechnicalAnalysisProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

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
        containerRef.current.innerHTML = ''
      }
    }
  }, [symbol, interval, width, height, locale, colorTheme, isTransparent, showIntervalTabs, displayMode])

  return (
    <div className="tradingview-widget-container" ref={containerRef}>
      <div className="tradingview-widget-container__widget"></div>
    </div>
  )
}
