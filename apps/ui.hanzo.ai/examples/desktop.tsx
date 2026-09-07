import { SizableText, XStack, YStack } from "@hanzo/gui"
import { Desktop } from "@hanzo/ui"

/** Default — a full-viewport surface with an app window laid over it. */
export function Default() {
  return (
    <Desktop height={320} background="linear-gradient(135deg, #1d4ed8, #7c3aed)">
      <YStack
        position="absolute"
        t={24}
        l={24}
        width={220}
        rounded="$3"
        bg="$background"
        borderWidth={1}
        borderColor="$borderColor"
        overflow="hidden"
      >
        <XStack px="$3" py="$2" bg="$color3" items="center">
          <SizableText size="$2" fontWeight="600">
            Finder
          </SizableText>
        </XStack>
        <YStack p="$3">
          <SizableText size="$2" color="$color11">
            Two windows, one dock, no document scroll.
          </SizableText>
        </YStack>
      </YStack>
    </Desktop>
  )
}

/** Solid background — a plain color instead of a gradient, for a flatter wallpaper. */
export function SolidBackground() {
  return (
    <Desktop height={200} background="#111318">
      <SizableText position="absolute" b={16} l={16} size="$2" color="white">
        macOS Sonoma
      </SizableText>
    </Desktop>
  )
}

/** No background — the surface alone, left to inherit the page's own color. */
export function NoBackground() {
  return (
    <Desktop height={160}>
      <YStack width="100%" height="100%" items="center" justify="center">
        <SizableText size="$2" color="$color11">
          An empty desktop
        </SizableText>
      </YStack>
    </Desktop>
  )
}
