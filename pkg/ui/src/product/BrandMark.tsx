'use client'

/**
 * BrandMark — the canonical brand lockup for an app header, from @hanzo/logo
 * (the ONE home of the mark geometry + motion). Animated by default: intro
 * flip + idle breathing + a wordmark that slides in, holds, then collapses
 * (returns on hover). Pure CSS, reduced-motion-safe; the mark inherits
 * `currentColor` so it themes for free. White-label via `wordmark`.
 */
import { HanzoLogo } from '@hanzo/logo/react'

import { HanzoMark } from './HanzoMark'

export function BrandMark({
  size = 20,
  wordmark = 'Hanzo',
  animated = true,
}: {
  size?: number
  /** Wordmark text (white-label): "Hanzo", "Lux", "Zoo", … */
  wordmark?: string
  /** false = the static mark alone (no motion shell, no wordmark). */
  animated?: boolean
}) {
  if (!animated) return <HanzoMark size={size} />
  return <HanzoLogo animated size={size} wordmark={wordmark} />
}
