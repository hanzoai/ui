import { SizableText, YStack } from '@hanzo/gui'
import { GridPattern, GridPatternPresets } from '@hanzo/ui'

/** Variants — the five tile marks GridPattern can repeat. */
export function Variants() {
  return (
    <YStack gap="$4">
      {(['dots', 'lines', 'crosses', 'plus', 'squares'] as const).map((variant) => (
        <YStack key={variant} position="relative" height={96} borderWidth={1} borderColor="$borderColor" rounded="$3" overflow="hidden">
          <GridPattern variant={variant} gap={20} opacity={0.5} />
          <YStack position="relative" height="100%" items="center" justify="center">
            <SizableText size="$2">{variant}</SizableText>
          </YStack>
        </YStack>
      ))}
    </YStack>
  )
}

/** Fade edges — the pattern fades out toward every side of its box. */
export function FadeEdges() {
  return (
    <YStack position="relative" height={192} borderWidth={1} borderColor="$borderColor" rounded="$3" overflow="hidden">
      <GridPattern variant="dots" size={3} gap={20} opacity={0.6} fade="edges" />
      <YStack position="relative" height="100%" items="center" justify="center">
        <SizableText size="$5" fontWeight="700">Content over grid</SizableText>
      </YStack>
    </YStack>
  )
}

/** Animated — the whole tile slides by one gap on a loop. */
export function Animated() {
  return (
    <YStack position="relative" height={192} borderWidth={1} borderColor="$borderColor" rounded="$3" overflow="hidden">
      <GridPattern
        variant="lines"
        gap={24}
        strokeWidth={1}
        opacity={0.3}
        animation={{ duration: 8, timing: 'linear' }}
      />
      <YStack position="relative" height="100%" items="center" justify="center">
        <SizableText size="$5" fontWeight="700">In motion</SizableText>
      </YStack>
    </YStack>
  )
}

/** Presets — the built-in blueprint and graph-paper configurations. */
export function Presets() {
  return (
    <YStack gap="$4">
      <YStack position="relative" height={128} borderWidth={1} borderColor="$borderColor" rounded="$3" overflow="hidden">
        <GridPattern {...GridPatternPresets.blueprint} />
      </YStack>
      <YStack position="relative" height={128} borderWidth={1} borderColor="$borderColor" rounded="$3" overflow="hidden">
        <GridPattern {...GridPatternPresets.graph} />
      </YStack>
    </YStack>
  )
}
