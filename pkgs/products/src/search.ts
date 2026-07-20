/**
 * Catalog search — the sidebar filter predicate + a ranked scorer for a command
 * palette / docs search. ONE scorer, no dependency: an exact substring beats a
 * subsequence, an earlier/contiguous match beats a scattered one, and fields are
 * weighted (name > id > category > gcp). Ported from console2 `match-core`/`search`,
 * adapted to the shared `CatalogEntry` fields. Pure + React-free.
 */
import type { CatalogEntry } from "./types"

/**
 * Does an entry contain the query across name/id/category/gcp? Empty query → true
 * (everything shows). The per-entry predicate for a filtered, still-grouped nav.
 */
export function entryMatches(entry: CatalogEntry, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return `${entry.name} ${entry.id} ${entry.category} ${entry.gcp ?? ""}`.toLowerCase().includes(q)
}

/** Score one field; 0 = no match, higher = better. */
function fuzzy(q: string, text: string): number {
  if (!q) return 1
  const t = text.toLowerCase()
  const idx = t.indexOf(q)
  if (idx === 0) return 1000
  if (idx > 0) return 600 - Math.min(idx, 100)

  // Subsequence: every char of q appears in order. Reward contiguity + early hits.
  let ti = 0
  let score = 0
  let streak = 0
  for (const ch of q) {
    const found = t.indexOf(ch, ti)
    if (found === -1) return 0
    streak = found === ti ? streak + 1 : 0
    score += 10 + streak * 5 - Math.min(found - ti, 8)
    ti = found + 1
  }
  return Math.max(score, 1)
}

/** Best weighted field score for an entry. */
function scoreEntry(q: string, e: CatalogEntry): number {
  return Math.max(
    fuzzy(q, e.name) * 3,
    fuzzy(q, e.id) * 2,
    fuzzy(q, e.category),
    fuzzy(q, e.gcp ?? ""),
  )
}

/**
 * The catalog ranked for `query`. Empty query → the entries in natural order.
 * Deterministic; a tie keeps input order (stable).
 */
export function searchCatalog(entries: CatalogEntry[], query: string): CatalogEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) return entries
  return entries
    .map((e, i) => ({ e, i, s: scoreEntry(q, e) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((x) => x.e)
}
