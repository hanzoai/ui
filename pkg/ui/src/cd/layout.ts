/**
 * Deterministic layered graph layout — pure, no React, no DOM, unit-tested. This
 * is the dependency-free equivalent of the GitOps engine UI's dagre `rankdir:LR`
 * pass: resources flow left→right by ownership depth, each tier a clean column.
 *
 * Three folds:
 *   1. columns — longest-path layering (Kahn topological order). A root (no
 *      incoming edge) sits in column 0; every other node one column right of its
 *      deepest parent. Cycles degrade gracefully (a child keeps its best column),
 *      so a malformed graph can never wedge the layout.
 *   2. order — within a column, nodes are ordered by the barycentre of their
 *      parents' rows (then name), so children cluster under their owner and edge
 *      crossings stay low — dagre's crossing-reduction, cheaply.
 *   3. place — nodes stack top-to-bottom at their own height (pods are taller
 *      than controllers) with a fixed gap, and each column is vertically centred
 *      on a shared axis so tiers read as balanced columns.
 *
 * The same graph always yields byte-identical positions.
 */

export interface LayoutNode {
  id: string
  /** Rendered height in px (pods are taller than controllers). */
  h: number
}

export interface LayoutEdge {
  source: string
  target: string
}

export interface LayoutOptions {
  /** Uniform node width in px (x is placed on a fixed column pitch). */
  nodeWidth?: number
  /** Horizontal gap between a column's right edge and the next column. */
  columnGap?: number
  /** Vertical gap between stacked nodes in a column. */
  rowGap?: number
}

export interface PositionedNode {
  id: string
  /** Top-left corner, px. */
  x: number
  y: number
  w: number
  h: number
  col: number
}

export interface GraphLayout {
  nodes: PositionedNode[]
  /** Content bounds — the transformed layer's intrinsic size. */
  width: number
  height: number
}

const DEFAULTS = { nodeWidth: 260, columnGap: 68, rowGap: 22 } as const

/**
 * Assign each node a column via longest-path layering over the edges. Processes
 * nodes in Kahn topological order; an edge into an unknown/cyclic parent is
 * skipped so a cycle never wedges the pass.
 */
function assignColumns(ids: string[], edges: LayoutEdge[]): Map<string, number> {
  const present = new Set(ids)
  const outgoing = new Map<string, string[]>()
  const indeg = new Map<string, number>()
  for (const id of ids) {
    outgoing.set(id, [])
    indeg.set(id, 0)
  }
  for (const e of edges) {
    if (!present.has(e.source) || !present.has(e.target) || e.source === e.target) continue
    outgoing.get(e.source)!.push(e.target)
    indeg.set(e.target, (indeg.get(e.target) ?? 0) + 1)
  }

  const column = new Map<string, number>()
  for (const id of ids) column.set(id, 0)

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
  return column
}

/**
 * Lay a resource graph out into centred LR columns. Returns one positioned node
 * per input node (input order preserved in the result array) plus content bounds.
 */
export function layoutTree(
  nodes: LayoutNode[],
  edges: LayoutEdge[],
  opts: LayoutOptions = {}
): GraphLayout {
  const nodeWidth = opts.nodeWidth ?? DEFAULTS.nodeWidth
  const columnGap = opts.columnGap ?? DEFAULTS.columnGap
  const rowGap = opts.rowGap ?? DEFAULTS.rowGap

  const ids = nodes.map((n) => n.id)
  const heightOf = new Map(nodes.map((n) => [n.id, n.h]))
  const column = assignColumns(ids, edges)

  // Parents per node (for the barycentre ordering).
  const parents = new Map<string, string[]>()
  for (const id of ids) parents.set(id, [])
  const present = new Set(ids)
  for (const e of edges) {
    if (!present.has(e.source) || !present.has(e.target) || e.source === e.target) continue
    parents.get(e.target)!.push(e.source)
  }

  // Group ids by column, preserving input order as the stable tie-break.
  const inputOrder = new Map(ids.map((id, i) => [id, i]))
  const byColumn = new Map<number, string[]>()
  for (const id of ids) {
    const c = column.get(id) ?? 0
    const list = byColumn.get(c)
    if (list) list.push(id)
    else byColumn.set(c, [id])
  }

  // Order each column left→right by the barycentre of parents' rows in the
  // previous column, so children sit under their owner.
  const rowOrder = new Map<string, number>()
  const sortedColumns = Array.from(byColumn.keys()).sort((a, b) => a - b)
  for (const c of sortedColumns) {
    const list = byColumn.get(c)!
    list.sort((a, b) => {
      const key = (id: string): number => {
        const ps = parents.get(id) ?? []
        const rows = ps.map((p) => rowOrder.get(p)).filter((r): r is number => r != null)
        return rows.length ? rows.reduce((s, r) => s + r, 0) / rows.length : Number.POSITIVE_INFINITY
      }
      const ka = key(a)
      const kb = key(b)
      if (ka !== kb) return ka - kb
      return (inputOrder.get(a) ?? 0) - (inputOrder.get(b) ?? 0)
    })
    list.forEach((id, i) => rowOrder.set(id, i))
  }

  // Column heights → the shared vertical axis (tallest column centred).
  const columnHeight = new Map<number, number>()
  for (const [c, list] of byColumn) {
    const total = list.reduce((s, id) => s + (heightOf.get(id) ?? 0), 0) + Math.max(0, list.length - 1) * rowGap
    columnHeight.set(c, total)
  }
  const axis = Math.max(0, ...Array.from(columnHeight.values())) / 2

  const pos = new Map<string, { x: number; y: number }>()
  for (const c of sortedColumns) {
    const list = byColumn.get(c)!
    const x = c * (nodeWidth + columnGap)
    let y = axis - (columnHeight.get(c) ?? 0) / 2
    for (const id of list) {
      pos.set(id, { x, y })
      y += (heightOf.get(id) ?? 0) + rowGap
    }
  }

  const positioned: PositionedNode[] = nodes.map((n) => {
    const p = pos.get(n.id) ?? { x: 0, y: 0 }
    return { id: n.id, x: p.x, y: p.y, w: nodeWidth, h: n.h, col: column.get(n.id) ?? 0 }
  })

  const width = positioned.reduce((m, n) => Math.max(m, n.x + n.w), 0)
  const height = positioned.reduce((m, n) => Math.max(m, n.y + n.h), 0)
  return { nodes: positioned, width, height }
}
