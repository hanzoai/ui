import { Text, YStack } from "@hanzo/gui"
import { ParticlesBackground } from "@hanzo/ui"

/** Default — a drifting field of white dots joined by fading lines, reacting to the pointer. */
export function Default() {
  return (
    <YStack position="relative" height={320} bg="black" overflow="hidden">
      <ParticlesBackground />
      <YStack position="relative" items="center" justify="center" height="100%">
        <Text color="white">Move your pointer over the field</Text>
      </YStack>
    </YStack>
  )
}

/** Custom colours — a blue field at a lower count, tuned for a hero section. */
export function CustomColors() {
  return (
    <YStack position="relative" height={320} bg="black" overflow="hidden">
      <ParticlesBackground
        particleColor="rgba(59, 130, 246, 0.6)"
        lineColor="rgba(59, 130, 246, 0.2)"
        particleCount={75}
      />
      <YStack position="relative" items="center" justify="center" height="100%">
        <Text color="white" fontSize="$8">
          Welcome
        </Text>
      </YStack>
    </YStack>
  )
}

/** Dense — a high particle count with a shorter connection distance, for a busier field. */
export function Dense() {
  return (
    <YStack position="relative" height={320} bg="black" overflow="hidden">
      <ParticlesBackground particleCount={150} connectionDistance={60} speed={0.3} />
    </YStack>
  )
}

/** No pointer interaction — a slow, quiet field for behind dashboard content. */
export function Static() {
  return (
    <YStack position="relative" height={320} bg="$color2" overflow="hidden">
      <ParticlesBackground
        particleColor="rgba(148, 163, 184, 0.4)"
        lineColor="rgba(148, 163, 184, 0.1)"
        particleCount={30}
        speed={0.3}
        enableMouseInteraction={false}
      />
    </YStack>
  )
}
