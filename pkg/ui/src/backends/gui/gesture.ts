'use client'

/**
 * The ONE way this backend does a drag, and the ONE way it meets the 44px touch
 * floor — both of which are platform-split, and both of which were previously
 * open-coded per component (and wrong on web).
 *
 * `drag()`  — web/Tauri run on Pointer Events with pointer capture; native runs
 *             on the responder system. Same three callbacks either way.
 * `touch()` — native takes `hitSlop`. gui classes `hitSlop` as a native-only
 *             prop and DROPS it on web (helpers/nativeOnlyProps → skipProps →
 *             getSplitStyles), so on web the target is expanded by a transparent
 *             `::after` overlay driven from `data-touch-x`/`data-touch-y`
 *             (rules in theme.css). Zero layout impact, no padding hack.
 */
import { isWeb } from '@hanzo/gui'

export type DragEvent = {
  clientX?: number
  clientY?: number
  pointerId?: number
  currentTarget?: unknown
  nativeEvent?: { pageX?: number; pageY?: number }
}

/** Pointer position on one axis, from whichever event shape the platform sent. */
export const dragPos = (e: DragEvent, horizontal: boolean) =>
  ((horizontal ? (e.clientX ?? e.nativeEvent?.pageX) : (e.clientY ?? e.nativeEvent?.pageY)) ??
    0) as number

export const drag = ({
  begin,
  move,
  end,
  enabled = true,
}: {
  begin: (e: DragEvent) => void
  move: (e: DragEvent) => void
  end: () => void
  enabled?: boolean
}) =>
  isWeb
    ? {
        onPointerDown: (e: DragEvent) => {
          if (!enabled) return
          // Keeps the drag alive once the pointer leaves a thin handle, with no
          // window listener. Feature-detected, so this file never assumes a DOM.
          const target = e.currentTarget as
            | { setPointerCapture?: (id: number) => void }
            | undefined
          if (target?.setPointerCapture && e.pointerId != null)
            target.setPointerCapture(e.pointerId)
          begin(e)
        },
        onPointerMove: move,
        onPointerUp: end,
        onPointerCancel: end,
      }
    : {
        onStartShouldSetResponder: () => enabled,
        onMoveShouldSetResponder: () => enabled,
        onResponderTerminationRequest: () => false,
        onResponderGrant: begin,
        onResponderMove: move,
        onResponderRelease: end,
        onResponderTerminate: end,
      }

/** Largest expansion theme.css has a rule for. Keep in sync with that ladder. */
const MAX_PAD = 24

/**
 * Expand a `size`-px-thick target to `min` px on the given axes without moving
 * anything. `axis: 'y'` pads top/bottom (a 36px-tall button), `'x'` pads
 * left/right (a 4px-wide resize handle), `'both'` pads all four (a 16px checkbox).
 */
export const touch = (size: number, min = 44, axis: 'x' | 'y' | 'both' = 'both') => {
  const pad = Math.min(MAX_PAD, Math.ceil((min - size) / 2))
  if (pad <= 0) return {}
  if (!isWeb)
    return {
      hitSlop:
        axis === 'both'
          ? pad
          : axis === 'x'
            ? { left: pad, right: pad }
            : { top: pad, bottom: pad },
    }
  return {
    position: 'relative' as const,
    ...(axis !== 'y' && { 'data-touch-x': String(pad) }),
    ...(axis !== 'x' && { 'data-touch-y': String(pad) }),
  }
}
