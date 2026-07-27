/**
 * Pure logic for `AnimatedLogo` — the wordmark ⇄ mark collapse. No React, no DOM,
 * no @hanzo/gui: just the state → style math, unit-tested in a plain Node env
 * (the house convention — view components are proven by build + visual e2e).
 */

/**
 * The Hanzo house motion curve (expo-out) — the ONE easing used across the app
 * shell (sidebar collapse, fade-up) and the animated mark's fold-in. Reused here
 * so the wordmark collapse feels of a piece with every other Hanzo surface.
 */
export const HOUSE_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

/** Default collapse/expand duration (ms) — echoes the mark's ~0.4s fold-in. */
export const DEFAULT_DURATION_MS = 360

/** Default hold before the wordmark auto-collapses to the mark on mount (ms). */
export const DEFAULT_INTRO_MS = 1500

/** Default gap (px) between the mark and the wordmark when expanded. */
export const DEFAULT_GAP = 8

/** The full accessible/visible name: brand word + optional surface word. */
export function wordmarkText(name: string, surface?: string): string {
  const s = surface?.trim()
  return s ? `${name} ${s}` : name
}

/**
 * Is the wordmark shown? Expanded whenever the user is pointing at or keyboard-
 * focused on the logo, OR during the on-mount intro (full name shows, then tucks
 * into the mark). Hover/focus always win, so the name is reachable after intro.
 */
export function isExpanded(s: { hovered: boolean; focused: boolean; introShowing: boolean }): boolean {
  return s.hovered || s.focused || s.introShowing
}

export interface WordmarkStyleInput {
  expanded: boolean
  /** Measured natural width (px); undefined before first measure (SSR/first paint). */
  naturalWidth?: number
  gap: number
  durationMs: number
  easing: string
  /** prefers-reduced-motion: no transition (instant), so there is no motion. */
  reduce: boolean
}

export interface WordmarkStyle {
  width: number | string
  opacity: number
  marginLeft: number
  transition: string
}

/**
 * The inline style for the clipping wordmark wrapper. Collapsed = width 0 /
 * opacity 0 / no gap (the name tucks fully into the mark); expanded = the measured
 * natural width (or `auto` until measured). Under reduced motion the transition is
 * dropped entirely — the state still resolves, just without animating.
 */
export function wordmarkStyle(i: WordmarkStyleInput): WordmarkStyle {
  return {
    width: i.expanded ? (i.naturalWidth ?? 'auto') : 0,
    opacity: i.expanded ? 1 : 0,
    marginLeft: i.expanded ? i.gap : 0,
    transition: i.reduce
      ? 'none'
      : `width ${i.durationMs}ms ${i.easing}, opacity ${i.durationMs}ms ${i.easing}, margin-left ${i.durationMs}ms ${i.easing}`,
  }
}
