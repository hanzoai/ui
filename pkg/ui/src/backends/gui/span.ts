'use client'

// A column's width the reader chose, kept in this browser, and drawn through a
// CSS custom property so a drag repaints one box instead of re-rendering the
// column's contents sixty times a second. Moved here from @hanzo/rooms, beside
// the Grip that drives it.
//
//   const col = useSpan('hanzo.app.column', 272, 220, 420)
//   <YStack ref={col.ref} {...col.props} width="var(--span)">
//   <Grip side="left" span={col.span} onSpan={col.move} onKeep={col.keep} … />
//
// `props` carries the width React knows as gui's own class (`--span: 272px`), so
// a prerendered column is drawn at it before a script runs and the host spreads no
// style. `move` writes the property on the element and nothing else; `keep` writes
// it there too, so the element and the class say one width, and is where React and
// storage learn it, once per drag, key or double-click.
//
// Storage is read in a layout effect, not during render: the rooms are
// prerendered, and a render that reads storage draws different HTML on the
// server and the client. A layout effect runs before the browser paints, so a
// kept width is on screen from the first frame and the column never jumps.

import { useCallback, useLayoutEffect, useRef, useState } from 'react'

export interface Span {
  /** The width React knows, px: the kept one, or `initial`. */
  span: number
  /** The element whose `--span` is the width. */
  ref: (node: unknown) => void
  /**
   * Spread on that element: gui props that carry `--span`. gui emits a custom
   * property from `$platform-web` as its own class; its types name only CSS
   * properties, so the props are handed over as a bag.
   */
  props: object
  /** The width while a drag moves it, px. */
  move: (n: number) => void
  /** The width it settled on, px: drawn, known and kept. */
  keep: (n: number) => void
}

export function useSpan(store: string, initial: number, floor: number, ceil: number): Span {
  const [span, setSpan] = useState(initial)
  const el = useRef<HTMLElement | null>(null)
  useLayoutEffect(() => {
    try {
      const kept = Number(localStorage.getItem(store))
      if (kept >= floor && kept <= ceil) setSpan(kept)
    } catch {
      // No store is the default width, which is a state and not a failure.
    }
  }, [store, floor, ceil])
  // Typed loosely because a gui stack hands its host element through a ref
  // typed for native too; on the web it is the element.
  const ref = useCallback((node: unknown) => {
    el.current = node instanceof HTMLElement ? node : null
  }, [])
  const move = useCallback((n: number) => {
    el.current?.style.setProperty('--span', `${n}px`)
  }, [])
  const keep = useCallback(
    (n: number) => {
      el.current?.style.setProperty('--span', `${n}px`)
      setSpan(n)
      try {
        localStorage.setItem(store, String(n))
      } catch {
        // A browser that stores nothing still resizes; it just forgets.
      }
    },
    [store],
  )
  return { span, ref, props: { '$platform-web': { '--span': `${span}px` } }, move, keep }
}
