import { SizableText, XStack, YStack } from "@hanzo/gui"
import { Pin3D } from "@hanzo/ui"

/** Default — a scene that dims and shrinks a touch while it is hovered. */
export function Default() {
  return (
    <XStack justify="center" p="$8">
      <Pin3D>
        <YStack
          width={200}
          height={200}
          bg="$accentBackground"
          rounded="$6"
          items="center"
          justify="center"
        >
          <SizableText color="$accentColor" fontWeight="600">
            Hover me
          </SizableText>
        </YStack>
      </Pin3D>
    </XStack>
  )
}

/** As a link — passing `href` renders the pin as an anchor pointing there. */
export function AsLink() {
  return (
    <XStack justify="center" p="$8">
      <Pin3D href="https://ui.hanzo.ai" title="Hanzo UI">
        <YStack
          width={200}
          height={120}
          bg="$panel"
          borderWidth={1}
          borderColor="$borderColor"
          rounded="$6"
          items="center"
          justify="center"
        >
          <SizableText>ui.hanzo.ai</SizableText>
        </YStack>
      </Pin3D>
    </XStack>
  )
}

/** Row of pins — several scenes side by side, each lifting on its own. */
export function Row() {
  return (
    <XStack gap="$4" justify="center" p="$8" flexWrap="wrap">
      {["Chain", "Wallet", "Bridge"].map((label) => (
        <Pin3D key={label}>
          <YStack
            width={140}
            height={140}
            bg="$edge"
            rounded="$4"
            items="center"
            justify="center"
          >
            <SizableText>{label}</SizableText>
          </YStack>
        </Pin3D>
      ))}
    </XStack>
  )
}
