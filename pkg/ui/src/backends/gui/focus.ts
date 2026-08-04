/**
 * How a text field says it has focus.
 *
 * A field already has an edge, so focus BRIGHTENS that edge — it never adds a
 * second shape around it. One rule, shared by every field, so `Input` and
 * `Textarea` cannot drift apart.
 *
 * `@hanzogui/input` ships the opposite of both halves, and each failure hides
 * the other:
 *
 *  - `focusVisibleStyle` draws `outline: 2px solid $outlineColor` at a 2px
 *    offset. Tamagui emits that as `:root:root:root:root ._outlineWidth-…
 *    :focus-visible { outline-width: 2px !important }`, which outranks any
 *    plain stylesheet — a consumer's `outline: none` cannot win, and one did
 *    try. Setting the width to 0 HERE is the only way to retract it, because
 *    a prop replaces the variant's atomic class rather than competing with it.
 *
 *  - `focusStyle` brightens to `$borderColorFocus`, which in this design
 *    system resolves to the SAME value as `$borderColor`. So the cue that was
 *    supposed to make the ring unnecessary rendered nothing at all, and the
 *    ring was the only feedback a focused field had.
 *
 * `$color06` against a `$borderColor` rest is ~5:1, so the edge alone carries
 * the indicator (WCAG 2.4.13) and nothing else needs to be drawn.
 *
 * Spread BEFORE a component's own `...props`, so a call site can still say
 * otherwise.
 */
const FOCUS = {
  focusStyle: { borderColor: '$color06' },
  focusVisibleStyle: { outlineWidth: 0, outlineStyle: 'none' },
} as const

export { FOCUS }
