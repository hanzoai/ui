/**
 * ChipSelect's decisions, as pure functions over plain values.
 *
 * Paging, pinning and the cursor are the parts of a searchable list that are
 * easy to get subtly wrong and impossible to see wrong in a screenshot: a page
 * that arrives twice lists a row twice, a stale page lands under a newer search,
 * a cursor walks off the end. So they live here, importing nothing, and are
 * tested in node.
 */

/** Anything a ChipSelect lists: an id it is keyed by and a label it shows. */
export interface ChipItem {
  id: string
  label: string
  /** A quieter second word on the row — `private`, a count. */
  hint?: string
  disabled?: boolean
}

/** One answer from a loader. `next` is the cursor for the page after it; absent, there is none. */
export interface ChipPage<T> {
  items: T[]
  next?: string | null
}

/** Reads one page: the search, and the cursor a previous page handed back (none for the first). */
export type ChipLoad<T> = (q: string, after?: string | null) => Promise<ChipPage<T>>

/**
 * Append a page to what is listed, dropping anything already there.
 *
 * Cursor pagination over a list that moves under it (a repository pushed,
 * reordering by `pushed_at`) hands the same row back on two pages. Keyed by id,
 * the second copy is dropped and the first keeps its place.
 */
export function merge<T extends ChipItem>(listed: readonly T[], page: readonly T[]): T[] {
  const seen = new Set(listed.map((i) => i.id))
  const out = listed.slice()
  for (const item of page) {
    if (seen.has(item.id)) continue
    seen.add(item.id)
    out.push(item)
  }
  return out
}

/**
 * The rows in the order they are drawn: the chosen item first, then the rest
 * without it.
 *
 * The chosen item is pinned only while the search could have matched it — an
 * empty search, or one its label contains — so typing narrows the list instead
 * of leaving an unrelated row stuck on top.
 */
export function pin<T extends ChipItem>(items: readonly T[], chosen: T | null | undefined, q = ''): T[] {
  const rest = items.filter((i) => !chosen || i.id !== chosen.id)
  if (!chosen) return rest
  const needle = q.trim().toLowerCase()
  if (needle && !chosen.label.toLowerCase().includes(needle)) return rest
  return [chosen, ...rest]
}

/**
 * A literal, case-insensitive substring match on the label and hint — for a
 * list the caller hands over whole (no loader), where the search is ours to
 * apply. Never a compiled pattern: the needle is whatever was typed.
 */
export function narrow<T extends ChipItem>(items: readonly T[], q: string): T[] {
  const needle = q.trim().toLowerCase()
  if (!needle) return items.slice()
  return items.filter(
    (i) => i.label.toLowerCase().includes(needle) || (i.hint ?? '').toLowerCase().includes(needle),
  )
}

/** The keys the list answers, and nothing else. */
export type Move = 'ArrowDown' | 'ArrowUp' | 'Home' | 'End' | 'PageDown' | 'PageUp'

/** How far PageUp/PageDown travel — roughly what the list shows at once. */
export const PAGE = 10

/**
 * Where the cursor lands.
 *
 * `from` is -1 before anything is under the cursor; `count` is how many rows
 * are drawn. It stops at the ends rather than wrapping: the list pages in more
 * rows at its end, and a cursor that wrapped to the top would skip the load.
 * Disabled rows are stepped over in the direction of travel.
 */
export function move(
  key: Move,
  from: number,
  count: number,
  disabled: (index: number) => boolean = () => false,
): number {
  if (count <= 0) return -1
  const clamp = (n: number) => Math.max(0, Math.min(count - 1, n))
  let at: number
  let dir: 1 | -1
  switch (key) {
    case 'ArrowDown':
      at = clamp(from + 1)
      dir = 1
      break
    case 'ArrowUp':
      at = from < 0 ? 0 : clamp(from - 1)
      dir = -1
      break
    case 'Home':
      at = 0
      dir = 1
      break
    case 'End':
      at = count - 1
      dir = -1
      break
    case 'PageDown':
      at = clamp((from < 0 ? 0 : from) + PAGE)
      dir = 1
      break
    case 'PageUp':
      at = clamp((from < 0 ? 0 : from) - PAGE)
      dir = -1
      break
  }
  // Step over disabled rows; if the whole remaining direction is disabled, try
  // the other way; if everything is, nothing is under the cursor.
  for (const d of [dir, -dir as 1 | -1]) {
    for (let i = at; i >= 0 && i < count; i += d) if (!disabled(i)) return i
  }
  return -1
}

/**
 * Whether the list should ask for the next page: there is one, nothing is in
 * flight, and the reader is within `slack` rows of the end — by the cursor, or
 * by having scrolled there.
 */
export function wants(opts: { next?: string | null; loading: boolean; at: number; count: number; slack?: number }): boolean {
  const { next, loading, at, count, slack = 3 } = opts
  if (!next || loading) return false
  return at >= count - 1 - slack
}

/** Whether a scroll position is near the bottom of what is scrollable. */
export function near(top: number, height: number, content: number, slack = 48): boolean {
  return top + height >= content - slack
}
