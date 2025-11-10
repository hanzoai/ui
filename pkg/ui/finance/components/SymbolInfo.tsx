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
        containerRef.current.innerHTML = ''
      }
    }
  }, [symbol, width, locale, colorTheme, isTransparent])

  return (
    <div className="tradingview-widget-container" ref={containerRef}>
      <div className="tradingview-widget-container__widget"></div>
    </div>
  )
}
