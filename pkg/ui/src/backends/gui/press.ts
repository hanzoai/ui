/**
 * A pressable that is not a `<button>`: focusable, a button to assistive tech,
 * and run by Enter and Space as well as by a press.
 *
 * gui does not activate `role="button"` on Enter. Measured: a keydown Enter on
 * an `XStack` with `onPress` fires nothing, and a click fires once. So a control
 * drawn from a stack handles the two keys itself — which cannot double-fire, for
 * the same reason. One helper, so no call site forgets Space or the
 * `preventDefault` that keeps Space from scrolling the page.
 *
 * Spread it first; a call site's own `aria-*` and style props follow it.
 */
export const press = (run?: () => void) => ({
  role: 'button' as const,
  tabIndex: 0,
  onPress: run,
  onKeyDown: (e: { key?: string; preventDefault?: () => void }) => {
    if (e?.key !== 'Enter' && e?.key !== ' ') return
    e.preventDefault?.()
    run?.()
  },
})

/** The keyboard focus ring every control in the package draws. */
export const RING = { outlineColor: '$outlineColor', outlineWidth: 2, outlineStyle: 'solid' } as const
