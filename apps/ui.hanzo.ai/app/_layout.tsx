import '@hanzo/font/css'
import '@hanzo/ui/styles.css'
import '~/app.css'
import mono from '@hanzo/font/dist/fonts/zen-mono/ZenMono-Variable.woff2?url'
import sans from '@hanzo/font/dist/fonts/zen-sans/Zen-Variable.woff2?url'
import { Text, XStack } from '@hanzo/gui'
import { Hanzo } from '@hanzo/ui'
import { SchemeProvider, useUserScheme } from '@vxrn/color-scheme'
import { Link, Slot } from 'one'

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
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
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
      <XStack
        items="center"
        justify="space-between"
        px="$5"
        height={52}
        borderBottomWidth={1}
        borderColor="$borderColor"
      >
        <Link href="/" style={{ textDecorationLine: 'none' }}>
          <Text fontWeight="600" fontSize={15}>
            @hanzo/ui
          </Text>
        </Link>
        <XStack gap="$4">
          <Link href="https://github.com/hanzoai/ui" target="_blank" style={{ textDecorationLine: 'none' }}>
            <Text fontSize={13} color="$color11">
              GitHub
            </Text>
          </Link>
          <Link href="https://www.npmjs.com/package/@hanzo/ui" target="_blank" style={{ textDecorationLine: 'none' }}>
            <Text fontSize={13} color="$color11">
              npm
            </Text>
          </Link>
        </XStack>
      </XStack>
      <Slot />
    </Hanzo>
  )
}
