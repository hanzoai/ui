import { YStack } from "@hanzo/gui"
import { Safari } from "@hanzo/ui"

/** Default — a browser frame around a preview, with the Favorites/Reading List/History row shown. */
export function Default() {
  return (
    <Safari url="https://ui.hanzo.ai">
      <YStack height={240} items="center" justify="center">
        <YStack width="60%" height={12} rounded="$2" bg="$color4" />
      </YStack>
    </Safari>
  )
}

/** Without the secondary toolbar — just the address bar above the page. */
export function WithoutToolbar() {
  return (
    <Safari url="https://ui.hanzo.ai/docs" showToolbar={false}>
      <YStack height={200} items="center" justify="center">
        <YStack width="40%" height={12} rounded="$2" bg="$color4" />
      </YStack>
    </Safari>
  )
}

/** Custom URL — any string renders in the address pill, screenshot or live content either way. */
export function CustomUrl() {
  return (
    <Safari url="https://example.com/dashboard">
      <YStack height={220} items="center" justify="center">
        <YStack width="70%" height={12} rounded="$2" bg="$color4" />
      </YStack>
    </Safari>
  )
}
