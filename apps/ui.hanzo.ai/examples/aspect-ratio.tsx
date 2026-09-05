import { Text, XStack, YStack } from "@hanzo/gui"
import { AspectRatio, Badge } from "@hanzo/ui"

/** Default — a square box, the default ratio, that has its height before anything is put in it. */
export function Default() {
  return (
    <AspectRatio
      maxW={240}
      bg="$panel"
      rounded="$3"
      items="center"
      justify="center"
    >
      <Text color="$quiet">1 : 1</Text>
    </AspectRatio>
  )
}

/** Ratios — `ratio` is width divided by height, so four boxes of one width take four heights. */
export function Ratios() {
  return (
    <XStack gap="$3" items="flex-start">
      <AspectRatio
        ratio={3 / 4}
        flex={1}
        bg="$panel"
        rounded="$3"
        items="center"
        justify="center"
      >
        <Text color="$quiet">3 : 4</Text>
      </AspectRatio>
      <AspectRatio
        ratio={4 / 3}
        flex={1}
        bg="$panel"
        rounded="$3"
        items="center"
        justify="center"
      >
        <Text color="$quiet">4 : 3</Text>
      </AspectRatio>
      <AspectRatio
        ratio={16 / 9}
        flex={1}
        bg="$panel"
        rounded="$3"
        items="center"
        justify="center"
      >
        <Text color="$quiet">16 : 9</Text>
      </AspectRatio>
      <AspectRatio
        ratio={21 / 9}
        flex={1}
        bg="$panel"
        rounded="$3"
        items="center"
        justify="center"
      >
        <Text color="$quiet">21 : 9</Text>
      </AspectRatio>
    </XStack>
  )
}

/** With image — an `<img>` child fills the frame, cropped to cover, and the frame is that tall before the bytes arrive. */
export function WithImage() {
  return (
    <AspectRatio ratio={16 / 9} maxW={480} rounded="$3">
      <img
        src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80"
        alt="Mountain ridge at sunset"
      />
    </AspectRatio>
  )
}

/** Overlay — the frame is the containing block, so an absolutely positioned badge or caption lands on the picture instead of the page. */
export function Overlay() {
  return (
    <AspectRatio ratio={16 / 9} maxW={480} rounded="$3">
      <img
        src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80"
        alt="Mountain ridge at sunset"
      />
      <YStack position="absolute" t="$3" l="$3">
        <Badge variant="secondary">Cover</Badge>
      </YStack>
      <YStack
        position="absolute"
        b={0}
        l={0}
        r={0}
        px="$3"
        py="$2"
        bg="rgba(0,0,0,0.6)"
      >
        <Text color="white" fontWeight="600">
          Mountain ridge at sunset
        </Text>
        <Text color="rgba(255,255,255,0.7)" fontSize="$2">
          Unsplash
        </Text>
      </YStack>
    </AspectRatio>
  )
}
