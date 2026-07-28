/**
 * The panel-sizing math — pure values, no React and no @hanzo/gui, so the
 * boundary rules can be reasoned about and tested on their own.
 */
export type ResizeDirection = "horizontal" | "vertical"

/** Everything the boundary math needs to know about a panel. */
export type PanelSpec = {
  id: string
  defaultSize?: number
  minSize?: number
  maxSize?: number
  collapsible?: boolean
  collapsedSize?: number
  onResize?: (size: number) => void
}

const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(n, hi))

/** Smallest percentage a panel may take — collapsible panels may go to `collapsedSize`. */
const floorOf = (s: PanelSpec) =>
  s.collapsible ? (s.collapsedSize ?? 0) : (s.minSize ?? 0)
const ceilOf = (s: PanelSpec) => s.maxSize ?? 100

/** Starting percentages: honour every `defaultSize`, split the remainder evenly, normalise to 100. PURE. */
export function defaultLayout(specs: PanelSpec[]): number[] {
  if (specs.length === 0) return []
  const claimed = specs.reduce((n, s) => n + (s.defaultSize ?? 0), 0)
  const free = specs.filter((s) => s.defaultSize == null).length
  const each = free > 0 ? Math.max(0, 100 - claimed) / free : 0
  const raw = specs.map((s) => s.defaultSize ?? each)
  const sum = raw.reduce((a, b) => a + b, 0)
  return sum > 0
    ? raw.map((v) => (v / sum) * 100)
    : specs.map(() => 100 / specs.length)
}

/**
 * Move the boundary AFTER panel `i` by `delta` percent. Only the two adjacent
 * panels change, so their sum is invariant and the layout always totals 100.
 * Returns the original array when the move is fully clamped. PURE.
 */
export function resizeAt(
  sizes: number[],
  specs: PanelSpec[],
  i: number,
  delta: number
): number[] {
  const a = sizes[i]
  const b = sizes[i + 1]
  const sa = specs[i]
  const sb = specs[i + 1]
  if (a == null || b == null || !sa || !sb) return sizes
  const pair = a + b
  const lo = Math.max(floorOf(sa), pair - ceilOf(sb))
  const hi = Math.min(ceilOf(sa), pair - floorOf(sb))
  if (lo > hi) return sizes
  const next = clamp(a + delta, lo, hi)
  if (next === a) return sizes
  const out = sizes.slice()
  out[i] = next
  out[i + 1] = pair - next
  return out
}
