'use client'

/**
 * MOBILE-FIRST layout, measured from the CONTAINER — not the viewport.
 *
 * A viewport media query is the wrong question here: the DocType renderer is
 * mounted inside whatever pane a host gives it (a console with a 260px sidebar, a
 * split view, a modal), so "is the window narrow" and "is MY box narrow" are
 * different facts, and only the second one decides whether a table fits. `onLayout`
 * answers the second, works identically on web and native (no media config, no
 * `window`), and needs no host wiring.
 *
 * The first render has NO measurement, and the mobile-first answer to "I don't
 * know yet" is PHONE: a card list is usable at every width, a 12-column table is
 * not. So the first paint — including SSR — is the phone layout, and the desktop
 * layout is the enhancement applied after the box reports its size. That also
 * means server and client render the same tree: no hydration mismatch.
 */
import { useCallback, useState } from 'react'

/** The width at which a data TABLE starts being readable rather than a scroll trap. */
export const TABLE_MIN = 720

/** The width at which fixed-size cards can sit two-up. */
export const GRID_MIN = 560

/**
 * Minimum interactive target, in px. WCAG 2.5.5 (AAA) asks for 44×44 and the iOS
 * HIG for 44pt; Material asks 48. 44 is the floor every control in this layer
 * meets on a phone — a 28px icon button next to a 28px icon button is the single
 * most common reason a mobile admin surface is unusable.
 */
export const TAP = 44

export type Layout = 'phone' | 'desktop'

/**
 * The layout decision, as a pure function of the measured width — so the rule
 * ("unmeasured means phone") is testable without rendering anything.
 */
export function layoutFor(width: number, tableMin: number = TABLE_MIN): Layout {
  return width > 0 && width >= tableMin ? 'desktop' : 'phone'
}

export interface ContainerLayout {
  /** 'phone' until the box has been measured wide enough for a table. */
  layout: Layout
  /** Shorthand for `layout === 'phone'`. */
  phone: boolean
  /** True once the box is wide enough to sit fixed-size cards side by side. */
  wideEnoughForGrid: boolean
  /** Measured content width in px (0 before the first layout pass). */
  width: number
  /** Spread onto the container element: `<YStack {...layoutProps} />`. */
  onLayout: (e: { nativeEvent: { layout: { width: number } } }) => void
}

/**
 * Measure the container and derive the layout. Mobile-first: `phone` until proven
 * otherwise. The setter is width-guarded so a layout pass that reports the same
 * width does not re-render.
 */
export function useContainerLayout(tableMin: number = TABLE_MIN): ContainerLayout {
  const [width, setWidth] = useState(0)

  const onLayout = useCallback((e: { nativeEvent: { layout: { width: number } } }) => {
    const w = Math.round(e?.nativeEvent?.layout?.width ?? 0)
    setWidth((prev) => (w > 0 && w !== prev ? w : prev))
  }, [])

  const layout = layoutFor(width, tableMin)
  const phone = layout === 'phone'
  return {
    layout,
    phone,
    wideEnoughForGrid: width >= GRID_MIN,
    width,
    onLayout,
  }
}
