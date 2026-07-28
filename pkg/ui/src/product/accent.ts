'use client'

/**
 * Org accent theme — the ONE place that turns an organization's saved brand color
 * (`themeData.colorPrimary`, when `themeData.isEnabled`) into the LIVE console accent.
 *
 * The console is monochrome by default; an org opts into a custom accent in Settings →
 * Branding. Saving persists the color on the org record (that half already works). This
 * module is the missing APPLY half: a tiny external store holds the resolved accent
 * (hex + a readable contrast, or null); `setOrgAccent` updates it on load AND on save
 * (one mechanism, two callers), and `useAccent()` lets the genuine accent surfaces (the
 * primary button, the active tabs, the active nav item) read it and recolor with real
 * `@hanzo/gui` props — reverting cleanly to the default monochrome when the org disables
 * its theme (or the hex is invalid). React-prop driven (Tamagui's own styling path), NOT
 * a CSS class — Tamagui does not forward `className` to a Button's DOM node.
 *
 * Pure + SSR-safe: the resolve/contrast helpers are pure (unit-tested); the store starts
 * from a stable default snapshot so the server render and first client paint agree.
 */
import { useSyncExternalStore } from 'react'

/** An org's persisted theme block (mirrors IAM `themeData`; only the fields we apply). */
export type OrgThemeData = {
  colorPrimary?: string
  isEnabled?: boolean
}

/** The live accent — a resolved hex + a readable text color for content on it, or null. */
export type Accent = { accent: string | null; contrast: string }

/** True for a 3- or 6-digit CSS hex color (`#RGB` / `#RRGGBB`). */
export function isHexColor(v: string | undefined | null): boolean {
  return typeof v === 'string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v.trim())
}

/**
 * The accent hex to apply for an org, or `null` when no custom accent should be used —
 * i.e. the theme is disabled, missing, or the color is not a valid hex. PURE.
 */
export function resolveAccent(theme: OrgThemeData | null | undefined): string | null {
  if (!theme || !theme.isEnabled) return null
  const hex = (theme.colorPrimary ?? '').trim()
  return isHexColor(hex) ? hex : null
}

/** Expand `#abc` → `#aabbcc`; pass a 6-digit hex through (lowercased). */
function expandHex(hex: string): string {
  const h = hex.trim().toLowerCase()
  if (h.length === 4) return `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`
  return h
}

/**
 * A readable text color (`#000000` / `#ffffff`) for content placed ON the accent,
 * chosen by the accent's relative luminance (WCAG-style). PURE. Falls back to white
 * for a non-hex input (never throws).
 */
export function contrastText(hex: string): '#000000' | '#ffffff' {
  if (!isHexColor(hex)) return '#ffffff'
  const h = expandHex(hex)
  const r = parseInt(h.slice(1, 3), 16) / 255
  const g = parseInt(h.slice(3, 5), 16) / 255
  const b = parseInt(h.slice(5, 7), 16) / 255
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  const luminance = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
  return luminance > 0.5 ? '#000000' : '#ffffff'
}

/** Resolve a theme block to the `Accent` value it should apply (accent+contrast or null). PURE. */
export function accentFor(theme: OrgThemeData | null | undefined): Accent {
  const hex = resolveAccent(theme)
  return { accent: hex, contrast: hex ? contrastText(hex) : '#ffffff' }
}

// ── The live accent store (an external store React subscribes to) ─────────────

/** The default (no custom accent) — a STABLE reference so SSR + first paint agree. */
const DEFAULT: Accent = { accent: null, contrast: '#ffffff' }

let current: Accent = DEFAULT
const listeners = new Set<() => void>()

/**
 * Set the live accent from an org theme block. Called on load (from the fetched org) AND
 * immediately on save — the SINGLE mechanism, so the accent survives reload and updates
 * without one. A no-op when the resolved accent is unchanged (keeps the snapshot stable).
 */
export function setOrgAccent(theme: OrgThemeData | null | undefined): void {
  const next = accentFor(theme)
  if (next.accent === current.accent) return
  current = next.accent ? next : DEFAULT
  for (const l of listeners) l()
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

/** The live accent (subscribes to the store). Returns the default until an org theme is applied. */
export function useAccent(): Accent {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => DEFAULT,
  )
}
