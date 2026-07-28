'use client'

/**
 * Loader — the layer's own pending state: the brand mark, pulsing. It uses the
 * product layer's `HanzoMark` (which already inherits `currentColor`, so it
 * themes and white-labels for free) rather than importing a brand package, so
 * this stays a presentational primitive with no host coupling.
 */
import { Text, YStack } from '@hanzo/gui'

import { HanzoMark } from '../product/HanzoMark'

export function Loader({ label, size = 40 }: { label?: string; size?: number }) {
  return (
    <YStack flex={1} minH={280} items="center" justify="center" gap="$3">
      <style>
        {'@keyframes hz-pulse{0%,100%{opacity:.45}50%{opacity:1}}.hz-pulse{animation:hz-pulse 1.5s ease-in-out infinite;display:inline-flex}@media (prefers-reduced-motion:reduce){.hz-pulse{animation:none}}'}
      </style>
      <div className="hz-pulse">
        <HanzoMark size={size} />
      </div>
      {label ? (
        <Text fontSize="$3" color="$color11">
          {label}
        </Text>
      ) : null}
    </YStack>
  )
}
