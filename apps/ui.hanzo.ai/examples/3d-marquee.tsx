import { YStack } from "@hanzo/gui"
import { Marquee3D, Marquee3DFloating, Marquee3DPreset } from "@hanzo/ui"

/** Default — a row of items crawling left through a slight tilt, `gap` spacing them and `autoFill` laying them out until the frame is covered. */
export function Default() {
  return (
    <Marquee3D autoFill rotateX={-6} gap={32}>
      <span>🚀 Innovation</span>
      <span>⚡ Speed</span>
      <span>💎 Quality</span>
      <span>🎯 Precision</span>
      <span>🌟 Excellence</span>
    </Marquee3D>
  )
}

/** Presets — the five named looks, each with its own size, speed and tilt already set. */
export function Presets() {
  return (
    <YStack gap="$3">
      <Marquee3DPreset.Hero autoFill gap={48}>HANZO</Marquee3DPreset.Hero>
      <Marquee3DPreset.Neon autoFill gap={48}>NEON NIGHTS</Marquee3DPreset.Neon>
      <Marquee3DPreset.Metallic autoFill gap={48}>BRUSHED STEEL</Marquee3DPreset.Metallic>
      <Marquee3DPreset.Fire autoFill gap={48}>ON FIRE</Marquee3DPreset.Fire>
      <Marquee3DPreset.Glass autoFill gap={48}>FROSTED</Marquee3DPreset.Glass>
    </YStack>
  )
}

/** Vertical — `direction="up"` runs the track along the block axis, and `gradient` fades both ends by `gradientWidth`. */
export function Vertical() {
  return (
    <Marquee3D direction="up" variant="glass" size="lg" gap={12} gradient gradientWidth={16}>
      <span>Alpha</span>
      <span>Beta</span>
      <span>Gamma</span>
    </Marquee3D>
  )
}

/** Pause on hover — `pauseOnHover` holds the track while the pointer is over the frame. */
export function PauseOnHover() {
  return (
    <Marquee3D autoFill gap={24} pauseOnHover>
      <span>Hover to pause</span>
    </Marquee3D>
  )
}

/** Floating text — each character of the string bobs on top of the scroll. */
export function Floating() {
  return (
    <Marquee3DFloating autoFill variant="rainbow" size="2xl" gap={64} floatIntensity={8}>
      HANZO UI
    </Marquee3DFloating>
  )
}
