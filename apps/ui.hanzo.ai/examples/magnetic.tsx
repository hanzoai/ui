import { XStack, YStack } from "@hanzo/gui"
import { Magnetic } from "@hanzo/ui"

/** Default — a button that pulls toward the pointer as it approaches. */
export function Default() {
  return (
    <YStack items="center" justify="center" minH={200} p="$8">
      <Magnetic strength={0.3}>
        <button
          type="button"
          style={{
            padding: "16px 32px",
            borderRadius: 8,
            fontWeight: 600,
            border: "none",
          }}
        >
          Hover Me!
        </button>
      </Magnetic>
    </YStack>
  )
}

/** Strength — a stronger pull travels further for the same pointer distance. */
export function Strength() {
  return (
    <XStack items="center" justify="center" gap="$8" minH={200} p="$8">
      <Magnetic strength={0.15}>
        <YStack width={96} height={96} rounded="$4" bg="$blue9" items="center" justify="center">
          Subtle
        </YStack>
      </Magnetic>
      <Magnetic strength={0.6}>
        <YStack width={96} height={96} rounded="$4" bg="$purple9" items="center" justify="center">
          Strong
        </YStack>
      </Magnetic>
    </XStack>
  )
}

/** Multiple — each wrapped element tracks its own pointer distance independently. */
export function Multiple() {
  return (
    <XStack items="center" justify="center" gap="$6" minH={200} p="$8">
      {[0, 1, 2].map((i) => (
        <Magnetic key={i} strength={0.35}>
          <YStack width={64} height={64} rounded="$10" bg="$green9" items="center" justify="center">
            {i + 1}
          </YStack>
        </Magnetic>
      ))}
    </XStack>
  )
}
