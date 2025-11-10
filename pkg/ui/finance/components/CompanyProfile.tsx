'use client'

import { useEffect, useRef } from 'react'

export interface CompanyProfileProps {
  symbol?: string
  width?: string | number
  height?: string | number
  locale?: string
  colorTheme?: 'light' | 'dark'
  isTransparent?: boolean
}

export default function CompanyProfile({
  symbol = 'NASDAQ:AAPL',
  width = '100%',
  height = '100%',
  locale = 'en',
  colorTheme = 'dark',
  isTransparent = false
}: CompanyProfileProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-profile.js'
    script.async = true
    script.innerHTML = JSON.stringify({
      width,
      height,
      colorTheme,
      isTransparent,
      symbol,
      locale,
    })

    containerRef.current.appendChild(script)

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [symbol, width, height, locale, colorTheme, isTransparent])

  return (
    <div className="tradingview-widget-container" ref={containerRef}>
      <div className="tradingview-widget-container__widget"></div>
    </div>
  )
}
