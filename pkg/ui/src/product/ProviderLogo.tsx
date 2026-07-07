'use client'

/**
 * ProviderLogo — a small provider/model avatar resolved from a provider NAME
 * alone (no external logo URLs, no network). Self-contained and prop-driven so
 * it lifts cleanly into `@hanzo/ui` for hanzo.ai / @hanzo/dev / the desktop app.
 *
 * Resolution order:
 *   1. First-party — Zen renders the real ensō mark, Hanzo the real block-H mark
 *      (same geometry as @zenlm/logo / @hanzo/logo), knocked out of a filled
 *      rounded tile so our own models read distinctly and on-brand.
 *   2. A known provider → its mapped @hanzogui/lucide-icons-2 glyph.
 *   3. Otherwise → a stable initials chip (1–2 letters from the name).
 *
 * Honest by construction: we never claim an official brand logo we don't ship —
 * unknown providers get clean initials, not a guessed icon. Colors are @hanzo/gui
 * theme tokens so the mark themes with the shell.
 */
import { Text, XStack, useTheme } from '@hanzo/gui'
import { Boxes, Server, Globe, Cpu } from '@hanzogui/lucide-icons-2'

type IconCmp = typeof Globe

/** Curated, extendable provider→glyph map (lowercased keys). Brand-neutral avatars. */
const KNOWN: Record<string, IconCmp> = {
  openrouter: Globe,
  nvidia: Cpu,
}

const isFirstParty = (provider: string): boolean => {
  const p = provider.trim().toLowerCase()
  return p === 'hanzo' || p === 'zen'
}

/** The Zen ensō mark — identical geometry to @zenlm/logo (svg/zen-enso.svg). */
function EnsoMark({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <path d="M66.22 83.26 A37 37 0 1 1 85.57 60.20" fill="none" stroke={color} strokeWidth={11} strokeLinecap="round" />
    </svg>
  )
}

/** The Hanzo block-H mark — identical geometry to @hanzo/logo (app/icon.svg). */
const HANZO_PATHS = [
  'M22.21 67V44.6369H0V67H22.21Z',
  'M66.7038 22.3184H22.2534L0.0878906 44.6367H44.4634L66.7038 22.3184Z',
  'M22.21 0H0V22.3184H22.21V0Z',
  'M66.7198 0H44.5098V22.3184H66.7198V0Z',
  'M66.7198 67V44.6369H44.5098V67H66.7198Z',
]
function HanzoHMark({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 67 67" aria-hidden="true">
      {HANZO_PATHS.map((d) => (
        <path key={d} d={d} fill={color} />
      ))}
    </svg>
  )
}

/** 1–2 uppercase initials from a provider name: words→first letters, else first 2 chars. */
export function providerInitials(provider: string): string {
  const name = provider.trim()
  if (!name) return '•'
  const words = name.split(/[\s/_-]+/).filter(Boolean)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export function ProviderLogo({ provider, size = 24 }: { provider: string; size?: number }) {
  const theme = useTheme()
  const radius = Math.round(size * 0.28)
  const iconSize = Math.round(size * 0.56)

  // First-party (Zen/Hanzo) — the real brand mark knocked out of a filled tile.
  if (isFirstParty(provider)) {
    const fg = theme.color1?.get() ?? '#000000' // cut-out mark: the tile's contrast color
    const markSize = Math.round(size * 0.66)
    const isZen = provider.trim().toLowerCase() === 'zen'
    return (
      <XStack width={size} height={size} items="center" justify="center" rounded={radius} bg="$color12">
        {isZen ? <EnsoMark size={markSize} color={fg} /> : <HanzoHMark size={Math.round(size * 0.56)} color={fg} />}
      </XStack>
    )
  }

  // A known provider with a curated, brand-neutral glyph.
  const Known = KNOWN[provider.trim().toLowerCase()]
  if (Known) {
    return (
      <XStack
        width={size}
        height={size}
        items="center"
        justify="center"
        rounded={radius}
        bg="$color3"
        borderWidth={1}
        borderColor="$borderColor"
      >
        <Known size={iconSize} color="$color11" />
      </XStack>
    )
  }

  // Otherwise — a clean, stable initials chip (no fabricated brand logo).
  return (
    <XStack
      width={size}
      height={size}
      items="center"
      justify="center"
      rounded={radius}
      bg="$color3"
      borderWidth={1}
      borderColor="$borderColor"
    >
      <Text fontSize={Math.round(size * 0.4)} fontWeight="800" color="$color11">
        {providerInitials(provider)}
      </Text>
    </XStack>
  )
}

/** A generic fallback mark for an unspecified provider (used sparingly). */
export function GenericLogo({ size = 24 }: { size?: number }) {
  return (
    <XStack width={size} height={size} items="center" justify="center" rounded={Math.round(size * 0.28)} bg="$color3" borderWidth={1} borderColor="$borderColor">
      <Server size={Math.round(size * 0.56)} color="$color11" />
    </XStack>
  )
}

// Boxes is re-exported as the conventional "custom model" mark for callers that
// render a non-provider tile next to ProviderLogo (keeps the icon source single).
export { Boxes as CustomModelMark }
