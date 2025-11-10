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
  height = '100%',
  locale = 'en',
  colorTheme = 'dark',
  isTransparent = false,
  displayMode = 'adaptive',
  largeChartUrl = ''
}: FinancialsProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

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
        containerRef.current.innerHTML = ''
      }
    }
  }, [symbol, width, height, locale, colorTheme, isTransparent, displayMode, largeChartUrl])

  return (
    <div className="tradingview-widget-container" ref={containerRef}>
      <div className="tradingview-widget-container__widget"></div>
    </div>
  )
}
