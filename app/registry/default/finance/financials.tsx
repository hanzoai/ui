'use client'

import { useEffect, useRef } from 'react'

export interface FinancialsProps {
  symbol?: string
  width?: string | number
  height?: string | number
  locale?: string
  colorTheme?: 'light' | 'dark'
  isTransparent?: boolean
  displayMode?: 'regular' | 'compact' | 'adaptive'
  largeChartUrl?: string
}

export default function Financials({
  symbol = 'NASDAQ:AAPL',
  width = '100%',
  height = '500',
  locale = 'en',
  colorTheme = 'dark',
  isTransparent = false,
  displayMode = 'adaptive',
  largeChartUrl = ''
}: FinancialsProps) {
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
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-financials.js'
    script.async = true
    script.innerHTML = JSON.stringify({
      colorTheme,
      isTransparent,
      largeChartUrl,
      displayMode,
      width,
      height,
      symbol,
      locale,
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
  }, [symbol, width, height, locale, colorTheme, isTransparent, displayMode, largeChartUrl])

  return (
    <div className="tradingview-widget-container w-full h-[500px]" ref={containerRef}>
      <div className="tradingview-widget-container__widget h-full"></div>
    </div>
  )
}
