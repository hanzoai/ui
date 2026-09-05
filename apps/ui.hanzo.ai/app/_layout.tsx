import '@hanzo/ui/styles.css'
import '~/app.css'
import { Hanzo } from '@hanzo/ui'
import { Text, XStack } from '@hanzo/gui'
import { Head, Link, Slot } from 'one'

/**
 * The shell every page shares: the provider @hanzo/ui renders under, and a bar
 * with the site's name. The page below decides its own columns.
 */
export default function Layout() {
  return (
    <Hanzo>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
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
