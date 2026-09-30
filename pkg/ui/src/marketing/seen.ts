'use client'

import { useEffect, type RefObject } from 'react'

/**
 * Calls `onSeen` once, the first time half of the element is on screen. The
 * callback is the host's and may be a new function every render; the view is
 * counted once, so the effect does not depend on it.
 */
export function useSeen(ref: RefObject<Element | null>, onSeen?: () => void): void {
  useEffect(() => {
    const el = ref.current
    if (!el || !onSeen || typeof IntersectionObserver === 'undefined') return
    const seen = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return
        onSeen()
        seen.disconnect()
      },
      { threshold: 0.5 },
    )
    seen.observe(el)
    return () => seen.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
