import { Text, YStack } from "@hanzo/gui"
import { Particles } from "@hanzo/ui"

/** Default — a dark panel with fifty drifting dots joining into lines as they near each other. */
export function Default() {
  return (
    <YStack
      position="relative"
      width="100%"
      height={320}
      rounded="$4"
      overflow="hidden"
      bg="black"
      items="center"
      justify="center"
    >
      <Particles />
      <Text color="white" fontSize="$5">
        Particles
      </Text>
    </YStack>
  )
}

/** Dense and warm — more, larger dots in an amber palette, connecting across a wider radius. */
export function DenseWarm() {
  return (
    <YStack position="relative" width="100%" height={320} rounded="$4" overflow="hidden" bg="black">
      <Particles
        particleCount={120}
        particleSize={3}
        particleColor="rgba(255, 191, 90, 0.8)"
        lineColor="rgba(255, 191, 90, 0.25)"
        connectionDistance={140}
      />
    </YStack>
  )
}

/** Still field — interaction and drift both switched off, for a quiet, non-distracting backdrop. */
export function Still() {
  return (
    <YStack position="relative" width="100%" height={240} rounded="$4" overflow="hidden" bg="$color2">
      <Particles
        particleCount={40}
        speed={0}
        enableMouseInteraction={false}
        particleColor="rgba(0, 0, 0, 0.35)"
        lineColor="rgba(0, 0, 0, 0.12)"
      />
    </YStack>
  )
}

/** Behind content — the field sits under a card, proving it never intercepts a click on what it backs. */
export function BehindContent() {
  return (
    <YStack position="relative" width="100%" height={320} rounded="$4" overflow="hidden" bg="black">
      <Particles particleColor="rgba(120, 170, 255, 0.7)" lineColor="rgba(120, 170, 255, 0.2)" />
      <YStack
        position="absolute"
        inset={0}
        items="center"
        justify="center"
      >
        <YStack bg="$color1" rounded="$3" px="$4" py="$3">
          <Text fontSize="$4">Content stays clickable on top</Text>
        </YStack>
      </YStack>
    </YStack>
  )
}
