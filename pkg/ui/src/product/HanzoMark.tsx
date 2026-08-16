'use client'

/**
 * The Hanzo "H" — the house mark, static, inheriting `currentColor`.
 *
 * It held its own copy of the seven paths, which made three copies of one
 * geometry across the fleet: `@hanzo/logo` publishes the canon, `@hanzo/brand`
 * composes it into the registry, and this transcribed it a third time. A
 * transcription drifts silently — it is right until the canon moves — so it
 * reads the registry now, like every other mark.
 *
 * Kept as its own name because it means something the general one cannot: the
 * HOUSE mark specifically, for the places that are Hanzo whatever host they are
 * served from (a "built by Hanzo" credit on a white-label surface). Anything
 * showing THIS surface's identity wants `BrandMark`, which follows the host.
 */
import { BrandMark } from './BrandMark'

export function HanzoMark({ size = 22, color = 'currentColor' }: { size?: number; color?: string }) {
  return <BrandMark brand="hanzo" size={size} color={color} animated={false} wordmark={false} />
}
