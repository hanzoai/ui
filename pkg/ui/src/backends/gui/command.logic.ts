/**
 * The Command palette's decisions, as pure functions over plain values.
 *
 * cmdk shipped its matcher and its cursor welded to a DOM store. They are neither
 * DOM nor React: `score` answers "does this item survive the search", `step`
 * answers "where does the cursor land". Keeping them here means they are testable
 * in the node env (this module imports no @hanzo/gui runtime), and `command.tsx`
 * is left holding only the view.
 */

/** `0` hides the item; anything higher keeps it and ranks it. */
export type CommandFilter = (value: string, search: string, keywords?: string[]) => number

/** Exact › prefix › substring (earlier wins) › subsequence › no match. */
export const score: CommandFilter = (value, search, keywords) => {
  const needle = search.trim().toLowerCase()
  if (!needle) return 1
  const hay = (keywords?.length ? `${value} ${keywords.join(' ')}` : value).toLowerCase()
  if (hay === needle) return 1
  if (hay.startsWith(needle)) return 0.9
  const at = hay.indexOf(needle)
  if (at > -1) return 0.8 - at / (hay.length * 100)
  let i = 0
  for (let j = 0; j < hay.length && i < needle.length; j++) if (hay[j] === needle[i]) i++
  return i === needle.length ? 0.4 : 0
}

/**
 * Where the cursor goes. `from` is -1 when nothing is selected yet; `count` is
 * the number of REACHABLE (visible, enabled) items, so skipping disabled rows is
 * the caller's filter rather than a second concept in here. Returns -1 for an
 * empty list.
 */
export const step = (count: number, from: number, delta: number, loop = false): number => {
  if (count <= 0) return -1
  const next = from + delta
  if (next < 0) return loop ? count - 1 : 0
  if (next >= count) return loop ? 0 : count - 1
  return next
}
