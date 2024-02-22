'use client'

import { useEffect, useState } from 'react'
import * as gtag from './gtag'
import Script from 'next/script'
import { usePathname } from 'next/navigation'

const GoogleAnalyticsHead = () => {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', '${gtag.GA_TRACKING_ID}', {
            page_path: window.location.pathname,
          });
        `,
      }}
    />
  )
}

const GoogleAnalytics = () => {
  const [loaded, setLoaded] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    if (!loaded) return

    gtag.pageview(pathname)
  }, [pathname, loaded])

  return (
    <div>
      <Script
        strategy='afterInteractive'
        onLoad={() => setLoaded(true)}
        src={`https://www.googletagmanager.com/gtag/js?id=${gtag.GA_TRACKING_ID}`}
      />
    </div>
  )
}

export {GoogleAnalyticsHead, GoogleAnalytics}