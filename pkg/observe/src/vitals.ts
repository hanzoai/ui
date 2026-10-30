// How fast the page loaded and answered, as the browser measured it: the Core Web
// Vitals and the two timings under them. Read for the page as LOADED — a soft
// navigation repaints nothing the browser times — and carried on that view's
// `$pageleave` segments, each holding the values as they stand.
//
//   $ttfb_ms  navigation start → first byte of the document
//   $fcp_ms   → first contentful paint
//   $lcp_ms   → largest contentful paint (final once the visitor first interacts)
//   $cls      cumulative layout shift: the worst session window (gaps < 1 s,
//             windows ≤ 5 s), shifts right after input excluded
//   $inp_ms   the slowest interaction's input-to-paint duration (40 ms floor);
//             the 98th percentile the metric names is the slowest below 50
//
// A browser that times none of these (Safari has no LCP, CLS or INP) reports
// what it has; nothing is estimated.

export interface Vitals {
  read(): Record<string, number>
  stop(): void
}

type Shift = PerformanceEntry & { value: number; hadRecentInput: boolean }
type Timed = PerformanceEntry & { interactionId?: number; duration: number }

export function vitals(): Vitals {
  const out: Record<string, number> = {}
  const observers: PerformanceObserver[] = []
  let windowValue = 0
  let windowStart = 0
  let windowLast = 0

  const watch = (type: string, take: (list: PerformanceEntryList) => void, extra?: Record<string, unknown>) => {
    try {
      if (typeof PerformanceObserver === 'undefined') return
      if (!PerformanceObserver.supportedEntryTypes?.includes(type)) return
      const po = new PerformanceObserver((l) => {
        try {
          take(l.getEntries())
        } catch {
          /* fail-soft */
        }
      })
      po.observe({ type, buffered: true, ...extra } as PerformanceObserverInit)
      observers.push(po)
    } catch {
      /* this browser does not time it */
    }
  }

  try {
    const nav = performance.getEntriesByType?.('navigation')?.[0] as PerformanceNavigationTiming | undefined
    if (nav && nav.responseStart > 0) out.$ttfb_ms = Math.round(nav.responseStart)
  } catch {
    /* no navigation timing */
  }

  watch('paint', (entries) => {
    for (const e of entries) if (e.name === 'first-contentful-paint') out.$fcp_ms = Math.round(e.startTime)
  })
  watch('largest-contentful-paint', (entries) => {
    const e = entries[entries.length - 1]
    if (e) out.$lcp_ms = Math.round(e.startTime)
  })
  watch('layout-shift', (entries) => {
    for (const e of entries as Shift[]) {
      if (e.hadRecentInput) continue
      if (windowValue && (e.startTime - windowLast > 1000 || e.startTime - windowStart > 5000)) windowValue = 0
      if (!windowValue) windowStart = e.startTime
      windowValue += e.value
      windowLast = e.startTime
      if (windowValue > (out.$cls ?? 0)) out.$cls = Math.round(windowValue * 1000) / 1000
    }
  })
  watch(
    'event',
    (entries) => {
      for (const e of entries as Timed[]) {
        if (!e.interactionId) continue
        if (e.duration > (out.$inp_ms ?? 0)) out.$inp_ms = Math.round(e.duration)
      }
    },
    { durationThreshold: 40 },
  )

  return {
    read: () => ({ ...out }),
    stop() {
      for (const o of observers) o.disconnect()
      observers.length = 0
    },
  }
}
