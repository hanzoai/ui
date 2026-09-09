/**
 * The two atoms every ecosystem-shell list is built from — a navigable link and a
 * call-to-action. Pure data, no React: a Next/Svelte/Tamagui/Fumadocs renderer
 * turns each into its own element. Kept minimal on purpose (an `id` is the React
 * list key AND the glyph key each renderer maps to an icon — the data stays
 * glyph-free, the same convention the catalog uses for `iconKey`).
 */

/** A labeled destination — one entry in a menu, footer column, or nav row. */
export interface Link {
  /** Stable key; also the per-renderer glyph key. Unique within its own list. */
  id: string
  /** Visible text. */
  label: string
  /** Where it goes — an absolute `https://…` URL or a site-relative `/path`. */
  href: string
}

/** A primary call-to-action — a label and where it goes. Not a list item, so no id. */
export interface Action {
  label: string
  href: string
}
