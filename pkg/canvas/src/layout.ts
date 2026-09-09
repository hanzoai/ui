/**
 * Deterministic layered graph layout — pure, no React, no DOM, unit-tested.
 *
 * Nodes are assigned to columns by longest-path layering over the edges (a
 * source with no incoming edge sits in column 0; every other node sits one
 * column right of its deepest parent), then stacked and vertically centered
 * within each column on a shared axis so tiers read as clean columns in a
 * left-to-right dependency flow. Isolated nodes (no edges) fall into column 0.
 * The same graph always yields byte-identical positions.
 */

export interface XYPosition {
  x: number
  y: number
}

export interface PositionedId {
  id: string
  position: XYPosition
}

export interface LayoutOptions {
  /** Center-to-center horizontal distance between columns. */
  columnGap?: number
  /** Center-to-center vertical distance between stacked nodes. */
  rowGap?: number
}

const DEFAULTS = { columnGap: 384, rowGap: 168 } as const

interface Edgeish {
  source: string
  target: string
}
interface Nodeish {
  id: string
}

/**
 * Assign each node a column via longest-path layering. Processes nodes in
 * topological order (Kahn); an edge into a node with an unknown/cyclic parent
 * degrades gracefully (the child simply keeps the max column seen so far), so a
 * cycle can never wedge the layout.
 */
function assignColumns(ids: string[], edges: Edgeish[]): Map<string, number> {
  const present = new Set(ids)
  const outgoing = new Map<string, string[]>()
  const indeg = new Map<string, number>()
  for (const id of ids) {
    outgoing.set(id, [])
    indeg.set(id, 0)
  }
  for (const e of edges) {
    if (
      !present.has(e.source) ||
      !present.has(e.target) ||
      e.source === e.target
    )
      continue
    outgoing.get(e.source)!.push(e.target)
    indeg.set(e.target, (indeg.get(e.target) ?? 0) + 1)
  }

  const column = new Map<string, number>()
  for (const id of ids) column.set(id, 0)

  // Kahn queue seeded with roots (indeg 0), stable by id order.
  const remaining = new Map(indeg)
  const queue = ids.filter((id) => (remaining.get(id) ?? 0) === 0).sort()
  const seen = new Set<string>()
  while (queue.length) {
    const u = queue.shift()!
    if (seen.has(u)) continue
    seen.add(u)
    const cu = column.get(u) ?? 0
    for (const v of outgoing.get(u) ?? []) {
      if (cu + 1 > (column.get(v) ?? 0)) column.set(v, cu + 1)
      const left = (remaining.get(v) ?? 0) - 1
      remaining.set(v, left)
      if (left <= 0 && !seen.has(v)) queue.push(v)
    }
    queue.sort()
  }
  // Any node left unprocessed (part of a cycle) keeps its best-known column.
  return column
}

/**
 * Position nodes into centered columns. Returns one `{ id, position }` per input
 * node (input order preserved), with `x` by column and `y` centered per column.
 */
export function layoutGraph(
  nodes: Nodeish[],
  edges: Edgeish[],
  opts: LayoutOptions = {}
): PositionedId[] {
  const columnGap = opts.columnGap ?? DEFAULTS.columnGap
  const rowGap = opts.rowGap ?? DEFAULTS.rowGap
  const ids = nodes.map((n) => n.id)
  const column = assignColumns(ids, edges)

  // Group node ids by column, sorted within a column for stable stacking.
  const byColumn = new Map<number, string[]>()
  for (const id of ids) {
    const c = column.get(id) ?? 0
    const list = byColumn.get(c)
    if (list) list.push(id)
    else byColumn.set(c, [id])
  }
  for (const list of byColumn.values()) list.sort()

  const maxRows = Math.max(1, ...Array.from(byColumn.values(), (l) => l.length))
  const axis = ((maxRows - 1) * rowGap) / 2

  const pos = new Map<string, XYPosition>()
  for (const [c, list] of byColumn) {
    const top = axis - ((list.length - 1) * rowGap) / 2
    list.forEach((id, i) =>
      pos.set(id, { x: c * columnGap, y: top + i * rowGap })
    )
  }

  return nodes.map((n) => ({
    id: n.id,
    position: pos.get(n.id) ?? { x: 0, y: 0 },
  }))
}
