/**
 * Pure resource-tree topology — folds an application's resource tree into a
 * positioned graph, reusing @hanzo/canvas's deterministic layered layout
 * (`layoutGraph`) so there is no separate graph dependency and the same tree
 * always yields byte-identical positions. No React, no DOM — unit-tested.
 *
 * Owned Kubernetes objects link to their owners through `parentRefs`; a node with
 * no present parent is a root (the Application itself, or an orphan). Layout runs
 * left-to-right by depth: Application → Service → Deployment → ReplicaSet → Pod,
 * with Ingress/ConfigMap/certificates hanging off whatever references them.
 */
import { layoutGraph, type XYPosition } from '@hanzo/canvas/pure'

import type { AppTreeNode, ResourceRef, ResourceTree } from './types'

/** Stable id for a resource — its uid, else a synthesized group/kind/ns/name key. */
export function resourceId(ref: ResourceRef): string {
  return ref.uid ?? `${ref.group ?? ''}/${ref.kind}/${ref.namespace ?? ''}/${ref.name}`
}

/** A laid-out tree node — the source node plus its resolved position and shape. */
export interface ResourceGraphNode {
  id: string
  node: AppTreeNode
  /** Top-left anchor, normalized so the graph's min corner is `(0, 0)`. */
  x: number
  y: number
  /** Depth from its root (root = 0), useful for indentation/emphasis. */
  depth: number
  /** Whether the node has children in the full tree (drives the collapse toggle). */
  hasChildren: boolean
  /** Whether the node is currently collapsed (its subtree hidden). */
  collapsed: boolean
}

export interface ResourceGraphEdge {
  id: string
  source: string
  target: string
}

export interface ResourceGraph {
  nodes: ResourceGraphNode[]
  edges: ResourceGraphEdge[]
  /** Bounding size (top-left origin) for the host's scroll/zoom surface. */
  width: number
  height: number
}

export interface ResourceGraphOptions {
  /** Center-to-center horizontal distance between depth columns. */
  columnGap?: number
  /** Center-to-center vertical distance between stacked nodes. */
  rowGap?: number
  /** Node box size (used to normalize the origin and compute bounds). */
  nodeWidth?: number
  nodeHeight?: number
  /** Ids whose subtrees are collapsed (descendants are omitted from the graph). */
  collapsed?: ReadonlySet<string>
}

const DEFAULTS = { columnGap: 260, rowGap: 92, nodeWidth: 200, nodeHeight: 62 } as const

/**
 * Build the positioned resource graph. Collapsed subtrees are pruned before
 * layout so the visible graph stays compact. Roots are nodes whose parents are
 * absent from the tree (the Application and any orphans).
 */
export function buildResourceGraph(
  tree: ResourceTree,
  opts: ResourceGraphOptions = {},
): ResourceGraph {
  const columnGap = opts.columnGap ?? DEFAULTS.columnGap
  const rowGap = opts.rowGap ?? DEFAULTS.rowGap
  const nodeWidth = opts.nodeWidth ?? DEFAULTS.nodeWidth
  const nodeHeight = opts.nodeHeight ?? DEFAULTS.nodeHeight
  const collapsed = opts.collapsed ?? new Set<string>()

  const all: AppTreeNode[] = [...tree.nodes, ...(tree.orphanedNodes ?? [])]
  const byId = new Map<string, AppTreeNode>()
  for (const n of all) byId.set(resourceId(n), n)

  // Parent → children (only edges whose endpoints are both present).
  const children = new Map<string, string[]>()
  const parentOf = new Map<string, string[]>()
  for (const n of all) {
    const id = resourceId(n)
    if (!children.has(id)) children.set(id, [])
    for (const p of n.parentRefs ?? []) {
      const pid = resourceId(p)
      if (!byId.has(pid) || pid === id) continue
      children.get(pid)!.push(id)
      const parents = parentOf.get(id)
      if (parents) parents.push(pid)
      else parentOf.set(id, [pid])
    }
  }

  // Roots: no present parent. Sorted for deterministic traversal.
  const roots = [...byId.keys()].filter((id) => !(parentOf.get(id)?.length)).sort()

  // Visible set + depth via BFS from roots; a collapsed node keeps its own row but
  // its descendants are hidden.
  const depth = new Map<string, number>()
  const visible: string[] = []
  const queue: Array<{ id: string; d: number }> = roots.map((id) => ({ id, d: 0 }))
  const seen = new Set<string>()
  while (queue.length) {
    const { id, d } = queue.shift()!
    if (seen.has(id)) continue
    seen.add(id)
    visible.push(id)
    depth.set(id, d)
    if (collapsed.has(id)) continue
    for (const c of (children.get(id) ?? []).slice().sort()) {
      if (!seen.has(c)) queue.push({ id: c, d: d + 1 })
    }
  }

  const visibleSet = new Set(visible)
  const layoutNodes = visible.map((id) => ({ id }))
  const layoutEdges: ResourceGraphEdge[] = []
  for (const [pid, kids] of children) {
    if (!visibleSet.has(pid) || collapsed.has(pid)) continue
    for (const cid of kids) {
      if (!visibleSet.has(cid)) continue
      layoutEdges.push({ id: `${pid}=>${cid}`, source: pid, target: cid })
    }
  }

  const positions = layoutGraph(layoutNodes, layoutEdges, { columnGap, rowGap })
  const posById = new Map<string, XYPosition>(positions.map((p) => [p.id, p.position]))

  // Normalize so the min corner is (0, 0).
  let minX = Infinity
  let minY = Infinity
  for (const p of positions) {
    if (p.position.x < minX) minX = p.position.x
    if (p.position.y < minY) minY = p.position.y
  }
  if (!isFinite(minX)) minX = 0
  if (!isFinite(minY)) minY = 0

  let maxX = 0
  let maxY = 0
  const nodes: ResourceGraphNode[] = visible.map((id) => {
    const p = posById.get(id) ?? { x: 0, y: 0 }
    const x = p.x - minX
    const y = p.y - minY
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
    return {
      id,
      node: byId.get(id)!,
      x,
      y,
      depth: depth.get(id) ?? 0,
      hasChildren: (children.get(id)?.length ?? 0) > 0,
      collapsed: collapsed.has(id),
    }
  })

  return {
    nodes,
    edges: layoutEdges,
    width: maxX + nodeWidth,
    height: maxY + nodeHeight,
  }
}
