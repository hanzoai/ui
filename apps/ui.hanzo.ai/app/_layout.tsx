import '@hanzo/font/css'
import '@hanzo/ui/styles.css'
import '~/app.css'
import mono from '@hanzo/font/dist/fonts/zen-mono/ZenMono-Variable.woff2?url'
import sans from '@hanzo/font/dist/fonts/zen-sans/Zen-Variable.woff2?url'
import { YStack } from '@hanzo/gui'
import { Hanzo } from '@hanzo/ui'
import { SchemeProvider, useUserScheme } from '@vxrn/color-scheme'
import { Slot } from 'one'

import { brand } from '~/brand'
import { Docs } from '~/features/docs'
import { Footer } from '~/features/footer'
import { Header } from '~/features/header'

/**
 * The document. The theme class is on <html> in the HTML itself and the scheme
 * provider's script settles the stored choice before the first paint, so the
 * page never paints in one theme and repaints in another. Dark first, with the
 * system preference honoured.
 */

export default function Layout() {
  return (
    <html lang="en" className="t_dark" style={{ colorScheme: 'dark' }} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="dark light" />
        <link rel="icon" href={brand.icon} type="image/svg+xml" />
        <link rel="preload" href={sans} as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href={mono} as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>
        <SchemeProvider defaultScheme="dark">
          <Site />
        </SchemeProvider>
      </body>
    </html>
  )
}

function Site() {
  const { value } = useUserScheme()
  return (
    <Hanzo theme={value}>
      <Docs>
        <YStack minH="100vh">
          <Header />
          <Slot />
          <Footer />
        </YStack>
      </Docs>
    </Hanzo>
  )
}
