/**
 * The iconKey → component code map (the other map that can't live in a DB).
 *
 * A catalog row carries an `iconKey` (a PascalCase name, e.g. `"Network"`); this
 * resolves it to the real `@hanzogui/lucide-icons-2` component. It is the ONLY
 * React-touching module and is a SEPARATE entry point (`@hanzo/products/icons`),
 * so a static consumer that imports from `@hanzo/products` never pulls React or
 * the icon set into its bundle.
 *
 * Same vocabulary, different renderer: docs resolves the SAME names against
 * `lucide-react` via its own plugin; this map is for React consumers (console,
 * site, pricing) that already ship `@hanzogui/lucide-icons-2`.
 */
import type { ComponentType } from "react"
import * as Icons from "@hanzogui/lucide-icons-2"

/** A Hanzo GUI icon component (accepts the usual lucide props). */
export type IconComponent = ComponentType<{
  size?: number | string
  color?: string
  strokeWidth?: number
  className?: string
}>

// Materialize the module namespace into a plain object so a dynamic `MAP[key]`
// lookup returns `undefined` for an unknown key (a live ES namespace is spec'd to
// do the same, but a bundler/test namespace Proxy may throw — this normalizes it).
// A string->component map inherently needs every icon present, so eager is correct.
const MAP: Record<string, IconComponent | undefined> = { ...(Icons as Record<string, IconComponent | undefined>) }

/** Resolve an `iconKey` to its component, or `undefined` when the name is unknown. */
export function iconComponent(key: string): IconComponent | undefined {
  return MAP[key]
}

/** True when `key` names a real icon in the set. */
export function hasIcon(key: string): boolean {
  return Boolean(MAP[key])
}

/**
 * Resolve an `iconKey`, falling back to a stable default (`Box`) so a row with a
 * typo'd or not-yet-shipped icon still renders a glyph instead of crashing.
 */
export function iconComponentOr(key: string, fallbackKey = "Box"): IconComponent {
  const icon = MAP[key] ?? MAP[fallbackKey]
  if (!icon) throw new Error(`@hanzo/products/icons: neither "${key}" nor fallback "${fallbackKey}" exists`)
  return icon
}
