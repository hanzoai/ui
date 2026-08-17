/**
 * The field ladder — ONE description of the box, read by all three fields.
 *
 * A Select, an Input and a Textarea are one control in three shapes, and they
 * sit side by side in every form, so they read one spec rather than three copies
 * of four numbers. They had drifted on every one of them. Measured on a live
 * form before this file existed:
 *
 *   Select    50px tall · 10px radius · alpha edge · 12px gutter
 *   Input     36px tall ·  8px radius · solid edge · 12px gutter
 *   Textarea            ·  8px radius · solid edge · 20px gutter
 *
 * Only the Input was right, and none of the three was wrong at its call site —
 * each was overruled somewhere it could not see. The Select renders through
 * gui's `Select.Trigger`, which renders a `ListItem`, and `ListItem` destructures
 * `unstyled` into a local it never forwards to its frame; the frame therefore
 * falls back to `unstyled: false`, whose branch sets `size: '$true'`, whose size
 * variant writes `paddingVertical: $3.5`. With `height: auto` above it, 14 + a
 * 20px line + 14 + 2px of border IS 50, and the `minHeight: 36` beneath it is
 * satisfied and never bites. The Textarea's gutter arrived the same way, from
 * gui's `textAreaSizeVariant`, because the file simply never named one.
 *
 * So the spec states the values a field must not inherit. A number that is
 * merely correct today, written in three files, is three chances to drift.
 */

/**
 * The control box.
 *
 * A FLOOR wherever the control holds content that can outgrow it, a pin only on
 * `<input>`, which is single-line and cannot.
 */
export const CONTROL_H = 36

/** The gutter, as the space rung — 12px. */
export const GUTTER = 12

/**
 * The edge, the gutter and the radius every field wears.
 *
 * Spread FIRST, so a call site can still say otherwise where it has a reason to:
 * `Input` widens the gutter to seat an adornment, `Textarea` reddens the edge
 * when the value is invalid.
 */
export const FIELD = {
  px: '$3',
  rounded: '$3',
  borderWidth: 1,
  borderColor: '$borderColor',
  bg: 'transparent',
} as const

/**
 * Focus is @hanzo/design's, and a field says nothing about it.
 *
 * design draws ONE indicator for everything focusable —
 * `:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px }` — and
 * `gui-config.ts` re-bases `$outlineColor` onto that same `--ring` in every
 * theme. So the outline gui already draws on a field IS that ring, and design's
 * offset lands on top of it, because gui emits no `outline-offset` of its own.
 *
 * A field cannot abstain by writing a prop. gui carries the outline in its
 * variant defaults, and a prop REPLACES that atomic class rather than dropping
 * it — `focusVisibleStyle={{}}` emits the same three rules as no prop at all.
 * Whatever a call site writes is compiled to
 * `:root:root:root:root … :focus-visible { … !important }`, which outranks every
 * stylesheet in the document, so `outlineWidth: 0` does not hand the decision
 * back to the sheet: it deletes the indicator on every surface at once, and no
 * consuming app can argue with it.
 *
 * A field that should ring differently from a button says so in @hanzo/design,
 * where the rule lives. `focus.test.tsx` holds this.
 */
