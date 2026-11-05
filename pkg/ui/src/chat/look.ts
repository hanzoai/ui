/**
 * The look every composer control wears, from the tokens, in one place.
 *
 * RING: the focus ring, drawn on the focused control alone and only for the
 * keyboard (`focus-visible`), the same width and colour on `+`, the mic, its
 * chevron, voice, send, and the words under the frame.
 *
 * GHOST: a control with no ground of its own until it is pointed at. Its glyph
 * is drawn in `currentColor`, so the ink is the control's: the secondary ink at
 * rest, lifting to the full ink with a soft hover ground under a pointer. gui's
 * `quickest` eases both (150ms, design's ease).
 *
 * GLYPH and STROKE: the one icon size and line weight in the frame's row, a
 * whole pixel size so every lucide glyph draws crisp, at 1x and 2x alike.
 */
export const RING = { outlineColor: '$outlineColor', outlineWidth: 2, outlineStyle: 'solid' } as const

export const GHOST = {
  bg: 'transparent',
  color: '$quiet',
  hoverStyle: { bg: '$hover', color: '$ink' },
  pressStyle: { bg: '$hover', color: '$ink' },
  transition: 'quickest',
} as const

export const GLYPH = 20

export const STROKE = 1.75
