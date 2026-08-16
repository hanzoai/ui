'use client'

/**
 * BrandMark — the brand's mark, for any brand this design system dresses.
 *
 * It used to render `HanzoLogo` with `wordmark = 'Hanzo'` baked in, so the ONE
 * canonical mark could only ever say Hanzo. Every white-label surface therefore
 * had to write its own — the console carries two — which is how a shared
 * component ends up shared by nobody: a lux or zoo host mounting this rendered
 * the Hanzo H, and that is the white-label invariant broken outright.
 *
 * The geometry was never ours to hold either. `@hanzo/brand` is the fleet
 * registry (`BRAND_MARKS`, keyed by the same id that keys the IAM org) and it
 * ALREADY composes `@hanzo/logo` for Hanzo's own paths — so reaching past it to
 * `@hanzo/logo` skipped the one layer that knows there is more than one brand.
 * One registry, one mark per brand, resolved by the host that asked.
 *
 * MOTION IS THE APP'S, deliberately. A brand's animated mark ships in that
 * brand's own package (`@luxfi/logo`, `@zooai/logo`); depending on all of them
 * here would put every brand's bytes in every brand's page, which is the
 * cross-bundling the registry exists to prevent. So `animated` is a SLOT — pass
 * the getter the app already carries — and Hanzo's is the default only because
 * `@hanzo/logo` is a dependency of the registry regardless.
 */
import { BRANDS, BRAND_MARKS, DEFAULT_BRAND, brandFromHost, type BrandId } from '@hanzo/brand/registry'
import { HanzoLogo } from '@hanzo/logo/react'

/** The brand this surface is serving, from its own hostname. Server-side there
 *  is no host to read, so it answers the default — the same answer the registry
 *  gives an unrecognized host, and the same one the app corrects by passing
 *  `brand` explicitly when it resolves the brand its own way. */
export const hostBrand = (): BrandId =>
  typeof window === 'undefined' ? DEFAULT_BRAND : brandFromHost(window.location.hostname)

export type BrandMarkProps = {
  /** Edge of the mark, px. */
  size?: number
  /** Which brand. Defaults to the host's — the white-label resolution. */
  brand?: BrandId
  /**
   * Wordmark beside the mark. Defaults to the brand's own name; `false` renders
   * the mark alone. Only the animated lockup draws one.
   */
  wordmark?: string | false
  /**
   * Motion. `true` animates when this app carries that brand's motion package
   * (Hanzo's rides along with the registry); pass a getter returning SVG markup
   * for any other brand; `false` is the static mark.
   */
  animated?: boolean | (() => string)
  /** Ink for a mark that inherits it. A `colored` mark keeps its own fills. */
  color?: string
}

export function BrandMark({
  size = 20,
  brand,
  wordmark,
  animated = true,
  color = 'currentColor',
}: BrandMarkProps) {
  const id = brand ?? hostBrand()
  const mark = BRAND_MARKS[id] ?? BRAND_MARKS[DEFAULT_BRAND]
  const name = BRANDS[id]?.name ?? BRANDS[DEFAULT_BRAND].name
  const label = wordmark === false ? name : (wordmark ?? name)

  // An app-supplied mark for a brand whose motion this package cannot carry.
  if (typeof animated === 'function') {
    // The published marks are self-contained and carry a viewBox but no width or
    // height, so they fill whatever box they are given.
    const svg = animated().replace('<svg ', '<svg width="100%" height="100%" ')
    return (
      <span
        role="img"
        aria-label={label}
        style={{ width: size, height: size, display: 'inline-flex', flexShrink: 0 }}
        // A brand's own published mark — a package constant, never user input.
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    )
  }

  // Hanzo's motion is the one this package already depends on.
  if (animated && id === 'hanzo') {
    return <HanzoLogo animated size={size} wordmark={wordmark === false ? undefined : label} />
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={mark.viewBox}
      role="img"
      aria-label={label}
      // A mark flagged `colored` carries its own intrinsic fills (Zoo's six
      // circles are a COLOUR mark) and recoloring it would publish a logo we do
      // not publish. Every other mark inherits, so it themes for free.
      {...(mark.colored ? null : { fill: color })}
      style={{ display: 'block', flexShrink: 0 }}
      // Registry geometry — a build-time package constant, never user input.
      dangerouslySetInnerHTML={{ __html: mark.content }}
    />
  )
}
