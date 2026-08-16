/**
 * What the ⌘K bar shows for what you typed, as one pure function.
 *
 * The bar's list is not hand-written any more. hanzo.app's cloud publishes
 * `GET /v1/commands` — every operation the API answers, projected from the same
 * route table the OpenAPI document, the MCP tools and the `hanzo` CLI come from —
 * so a surface hands the whole list in and this decides what survives a search.
 *
 * That list is 2,323 operations, and that number is what makes the rule below
 * more than a preference.
 */
import type { ReactNode } from 'react'

import { score } from '../backends/gui/command.logic'

/**
 * One runnable thing in the bar.
 *
 * A command that names a route and a command that runs in the page are the SAME
 * type here; only the surface's `onRun` tells them apart. `method` is what says
 * which — it is present exactly when the command is an HTTP operation, and it is
 * the only field the matching rule reads.
 */
export interface Op {
  /** Stable identity. The registry's operationId, or a surface-local name. */
  id: string
  /** The heading it files under — a service ("projects"), or a surface's own. */
  group: string
  /** What it is called: the operation token ("deployments-list"), or a phrase. */
  label: string
  /** One line of help. The operation's summary, when it has one. */
  hint?: string
  /** The HTTP method, when this names a route. Absent means it runs in the page. */
  method?: string
  /** Drawn at the start of the row. */
  icon?: ReactNode
  /** Drawn at the end of the row — a status dot, a shortcut. */
  end?: ReactNode
}

/** The one method that is safe to stumble onto: no side effect, idempotent. */
export const SAFE = 'GET'

/**
 * The row that makes a question the answer when nothing else is.
 *
 * A command list is finite and a question is not, so "no results" is never the
 * right end of a palette — the AI is the one thing that can take a query nobody
 * indexed. Every Hanzo palette ends this way, and it must LOOK the same in all
 * of them, so the label is built here rather than typed out per surface.
 *
 * It is a plain `Op`, which is why it needs nothing else: it files under its own
 * group, carries no method (it runs in the page, not against a route), and
 * reaches the host through the same `onRun` every other row uses.
 *
 * `@hanzogui/shell` states this same rule for the palettes it draws. The two
 * cannot import from each other — shell is deliberately dependency-free so it
 * drops into a Vite app with no provider, which is the whole reason it exists —
 * so the string is asserted equal by test rather than shared by import.
 */
export const ASK = 'ask'
export const ASK_GROUP = 'Ask'
export const askOp = (question: string): Op => ({
  id: ASK,
  group: ASK_GROUP,
  label: `Ask AI: ${question}`,
})


/**
 * Whether `op` survives `search`, and how well. `0` hides it.
 *
 * # Safe methods browse; unsafe methods must be named
 *
 * Typing "delete" into a bar holding 2,323 operations offers four dozen
 * destructive fleet operations to somebody who wanted to delete a project. The
 * rule that fixes it needs no second list and no curation, because the method is
 * already in the registry and already means exactly this:
 *
 *   - GET matches fuzzily. It is safe and idempotent; browsing costs nothing.
 *   - every other method needs an exact PREFIX of `group label` — the same
 *     "service operation" a CLI would type. You cannot stumble onto
 *     `platform apps-rollback`; you have to name it.
 *
 * One rule, over data already present, mapping onto the semantics the methods
 * already carry.
 *
 * # An empty search hides every route, and that is not a shortcut
 *
 * With no query a fuzzy matcher matches everything, and everything is 2,323 rows
 * the moment the dialog opens — which is not a list, it is a stalled browser and
 * a scroll bar nobody can use. So the Run group is a SEARCH, not a browse: it is
 * empty until you type, and what remains on open is the surface's own handful of
 * local commands, which is what a person opening ⌘K with no query wants anyway.
 *
 * A local command has no method and is therefore always reachable — it is one of
 * a few, declared by the surface, and there is nothing to protect anyone from.
 */
export const match = (op: Op, search: string): number => {
  const q = search.trim().toLowerCase()
  const route = op.method !== undefined
  if (!q) return route ? 0 : 1

  const named = `${op.group} ${op.label}`.toLowerCase()
  if (route && op.method !== SAFE) return named.startsWith(q) ? 1 : 0
  return score(named, q, op.hint ? [op.hint] : undefined)
}

/**
 * The ops that survive `search`, grouped for rendering: headings in the order the
 * caller listed them, rows ranked within each, empty groups dropped.
 *
 * `limit` caps each group. A GET search for "list" still matches hundreds, and a
 * palette that renders hundreds is the same stalled browser the empty query would
 * be — the cap is what keeps one keystroke's cost bounded whatever was typed.
 */
export const survivors = (ops: Op[], search: string, limit = 50): Array<[string, Op[]]> => {
  const groups = new Map<string, Array<[Op, number]>>()
  for (const op of ops) {
    const rank = match(op, search)
    if (rank <= 0) continue
    const got = groups.get(op.group)
    if (got) got.push([op, rank])
    else groups.set(op.group, [[op, rank]])
  }
  const out: Array<[string, Op[]]> = []
  for (const [group, ranked] of groups) {
    // Sort by rank, ties keeping the caller's order — a surface that ordered its
    // projects by recency must not have that undone by a scoring tie.
    ranked.sort((a, b) => b[1] - a[1])
    out.push([group, ranked.slice(0, limit).map(([op]) => op)])
  }
  return out
}

/**
 * What the bar actually shows: what survived the search, then the way out.
 *
 * The ask row is APPENDED rather than filtered. It answers the query by
 * definition — its own label contains it — so putting it through `survivors`
 * would score a row against itself, and the one row that must be present
 * exactly when nothing else is would be at the mercy of the ranker.
 *
 * It lives here rather than in the component for the same reason every other
 * rule about which rows exist does: `Palette` renders into a portal, so no test
 * can read its rows, and a rule that cannot be tested is a rule that drifts.
 */
export const rows = (
  ops: Op[],
  search: string,
  limit?: number,
  canAsk = false
): Array<[string, Op[]]> => {
  const found = survivors(ops, search, limit)
  const question = search.trim()
  return canAsk && question ? [...found, [ASK_GROUP, [askOp(question)]]] : found
}
