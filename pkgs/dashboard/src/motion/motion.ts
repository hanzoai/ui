/**
 * LivingOverview motion — the PURE math behind the "videogame-like" feel, kept
 * out of the React components so it is unit-testable in the node env (no jsdom).
 * The `.tsx` tiles are thin wrappers that drive `requestAnimationFrame` with these
 * functions.
 *
 * Three primitives, one law each:
 *   - `easeOutCubic` / `countUpValue` — a number animates from a→b on an eased
 *     curve; at `t>=1` it lands EXACTLY on `b` (no float drift, no fabricated
 *     overshoot). Reduced-motion callers pass `t=1` and get `b` immediately.
 *   - `pushSample` — a live sparkline is a bounded ring of the most-recent real
 *     samples; a new reading appends and evicts the oldest past `cap`. It never
 *     invents points — an empty history stays empty (the tile shows no trend).
 *   - `shouldTick` — a self-correcting poll clock: given the last tick and now, it
 *     answers whether it is time to refetch, so a throttled live loop can't drift
 *     or stack overlapping fetches.
 *
 * Honesty: none of these create data. Count-up interpolates BETWEEN two real
 * values the caller already has; the sparkline ring holds only real samples.
 */

/** Ease-out cubic — fast then settling, the house count-up curve. Clamps to [0,1]. */
export const easeOutCubic = (t: number): number => {
  const x = t <= 0 ? 0 : t >= 1 ? 1 : t
  return 1 - Math.pow(1 - x, 3)
}

/**
 * The displayed value at normalized progress `t` (0..1) animating `from`→`to`.
 * Lands exactly on `to` at t>=1 (and returns `to` for a non-finite `from`, so a
 * first-ever value counts up from 0 only when the caller seeds `from=0`).
 */
export function countUpValue(from: number, to: number, t: number): number {
  if (!Number.isFinite(to)) return Number.isFinite(from) ? from : 0
  if (t >= 1) return to
  const base = Number.isFinite(from) ? from : to
  return base + (to - base) * easeOutCubic(t)
}

/** Normalized progress for an animation started at `startedAt`, now `now`, over `durationMs`. */
export function progress(startedAt: number, now: number, durationMs: number): number {
  if (durationMs <= 0) return 1
  return Math.min(1, Math.max(0, (now - startedAt) / durationMs))
}

/**
 * Append `sample` to a live-sparkline ring, evicting oldest beyond `cap`. Returns
 * a NEW array (never mutates) so React state updates cleanly. A non-finite sample
 * is dropped — the trend only ever holds real readings.
 */
export function pushSample(history: readonly number[], sample: number, cap: number): number[] {
  if (!Number.isFinite(sample)) return history.slice()
  const next = [...history, sample]
  return next.length > cap ? next.slice(next.length - cap) : next
}

/**
 * Poll clock. `true` when `now - lastTickAt >= everyMs` (time to refetch). A
 * non-positive interval disables polling (always `false`) so a config can turn
 * live updates off without a special case.
 */
export function shouldTick(lastTickAt: number, now: number, everyMs: number): boolean {
  if (everyMs <= 0) return false
  return now - lastTickAt >= everyMs
}

/**
 * Effective poll interval given a requested `everyMs`, a floor, and whether the
 * document is hidden. Returns 0 (paused) when hidden — a background tab must not
 * burn the backend — and never goes below `floorMs` (throttle guard) when active.
 */
export function effectiveInterval(everyMs: number, floorMs: number, hidden: boolean): number {
  if (everyMs <= 0) return 0
  if (hidden) return 0
  return Math.max(floorMs, everyMs)
}
