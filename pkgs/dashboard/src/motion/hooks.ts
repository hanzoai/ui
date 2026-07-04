'use client'

/**
 * LivingOverview React hooks — the thin rAF/interval drivers on top of the pure
 * `motion.ts` math. Each hook owns exactly one browser concern (animation frames,
 * the poll clock, reduced-motion, tab visibility) and cleans itself up on unmount
 * (no leaked intervals/frames).
 */
import { useEffect, useRef, useState } from 'react'

import { countUpValue, progress } from './motion'

/** `true` when the user asked for reduced motion — every animation short-circuits to its end state. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduced(mq.matches)
    on()
    // addEventListener is the modern API; older Safari uses addListener.
    if (mq.addEventListener) mq.addEventListener('change', on)
    else mq.addListener(on)
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', on)
      else mq.removeListener(on)
    }
  }, [])
  return reduced
}

/** `true` when the document is hidden (background tab) — the poll clock pauses. */
export function usePageHidden(): boolean {
  const [hidden, setHidden] = useState(false)
  useEffect(() => {
    if (typeof document === 'undefined') return
    const on = () => setHidden(document.visibilityState === 'hidden')
    on()
    document.addEventListener('visibilitychange', on)
    return () => document.removeEventListener('visibilitychange', on)
  }, [])
  return hidden
}

/**
 * Animate a number from its previous value to `target` on the eased count-up curve.
 * Returns the value to display right now. When `enabled` is false (reduced motion,
 * or count-up turned off in config), it snaps to `target` — the tile still shows the
 * real number, just without the tween. Cleans up its rAF on unmount/retarget.
 */
export function useCountUp(target: number, enabled: boolean, durationMs = 700): number {
  const [value, setValue] = useState(target)
  // The value currently ON SCREEN, tracked every frame. A retarget mid-flight
  // animates from HERE (not the previous target), so a new poll never snaps the
  // digits back before easing — smooth all the way.
  const shownRef = useRef(target)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    const from = shownRef.current
    if (!enabled || from === target) {
      shownRef.current = target
      setValue(target)
      return
    }
    const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now()
    const tick = () => {
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
      const t = progress(startedAt, now, durationMs)
      const v = countUpValue(from, target, t)
      shownRef.current = v
      setValue(v)
      if (t < 1) frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => {
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current)
    }
  }, [target, enabled, durationMs])

  return value
}

/**
 * A monotonic tick that fires every `everyMs` while the tab is visible, paused when
 * `everyMs <= 0`. The consumer refetches on each tick. Self-clearing on unmount and
 * on interval change — no stacked timers. Returns the tick count (a dependency the
 * caller can watch) and a `bump()` to force an immediate refetch (e.g. range change).
 */
export function usePoll(everyMs: number): { tick: number; bump: () => void } {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (everyMs <= 0) return
    const id = setInterval(() => setTick((n) => n + 1), everyMs)
    return () => clearInterval(id)
  }, [everyMs])
  return { tick, bump: () => setTick((n) => n + 1) }
}
