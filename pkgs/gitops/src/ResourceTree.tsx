'use client'

/**
 * The resource-tree topology — a pannable/zoomable board of the application's
 * owned Kubernetes objects, laid out left-to-right by parent references using
 * @hanzo/canvas's deterministic layout (via `buildResourceGraph`). Edges are
 * drawn as SVG S-curves; nodes are `ResourceNode` cards color-coded by health and
 * sync. No graph dependency — pan is a CSS transform, zoom a scale factor.
 *
 * Read-only: positions are computed, nodes are selectable and their subtrees
 * collapsible, but the user never draws the graph.
 */
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode, WheelEvent } from 'react'

import { buildResourceGraph, resourceId } from './tree'
import { Chevron } from './glyphs'
import { GitopsStyles, themeStyle } from './styles'
import { ResourceNode } from './ResourceNode'
import type { AppTreeNode, HealthStatus, ResourceTree, StatusPalette, SyncStatus } from './types'

export interface GitopsAppTreeProps {
  tree: ResourceTree
  theme?: 'light' | 'dark'
  /** Controlled selection by resource id (`resourceId(node)`); else internal. */
  selectedId?: string | null
  onSelect?: (node: AppTreeNode | null) => void
  healthPalette?: Partial<Record<HealthStatus, StatusPalette>>
  syncPalette?: Partial<Record<SyncStatus, StatusPalette>>
  nodeWidth?: number
  nodeHeight?: number
  columnGap?: number
  rowGap?: number
  /** Container height (default 480). */
  height?: number | string
  minZoom?: number
  maxZoom?: number
  empty?: ReactNode
  style?: CSSProperties
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

export function GitopsAppTree({
  tree,
  theme = 'dark',
  selectedId,
  onSelect,
  healthPalette,
  syncPalette,
  nodeWidth = 200,
  nodeHeight = 62,
  columnGap = 260,
  rowGap = 92,
  height = 480,
  minZoom = 0.3,
  maxZoom = 2,
  empty,
  style,
}: GitopsAppTreeProps) {
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set())
  const [internalSel, setInternalSel] = useState<string | null>(null)
  const sel = selectedId !== undefined ? selectedId : internalSel

  const graph = useMemo(
    () => buildResourceGraph(tree, { nodeWidth, nodeHeight, columnGap, rowGap, collapsed }),
    [tree, nodeWidth, nodeHeight, columnGap, rowGap, collapsed],
  )

  const viewportRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState({ x: 24, y: 24, z: 1 })
  const fittedFor = useRef<string>('')

  const fit = useCallback(() => {
    const el = viewportRef.current
    if (!el) return
    const cw = el.clientWidth
    const ch = el.clientHeight
    if (!cw || !ch) return
    const pad = 32
    const z = clamp(Math.min((cw - pad) / graph.width, (ch - pad) / graph.height, 1), minZoom, maxZoom)
    setView({ x: (cw - graph.width * z) / 2, y: (ch - graph.height * z) / 2, z })
  }, [graph.width, graph.height, minZoom, maxZoom])

  // Auto-fit once the viewport has a size, and again whenever the visible node set
  // changes shape. Guarded by a key so a user's pan/zoom is never overridden.
  useLayoutEffect(() => {
    const key = `${graph.nodes.length}:${Math.round(graph.width)}x${Math.round(graph.height)}`
    if (fittedFor.current === key) return
    if (!viewportRef.current?.clientWidth) return
    fittedFor.current = key
    fit()
  }, [graph, fit])

  const select = useCallback(
    (node: AppTreeNode | null) => {
      if (selectedId === undefined) setInternalSel(node ? resourceId(node) : null)
      onSelect?.(node)
    },
    [onSelect, selectedId],
  )

  const toggle = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const onWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault()
      const el = viewportRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const px = e.clientX - rect.left
      const py = e.clientY - rect.top
      setView((v) => {
        const z = clamp(v.z * (e.deltaY < 0 ? 1.1 : 1 / 1.1), minZoom, maxZoom)
        const k = z / v.z
        return { z, x: px - (px - v.x) * k, y: py - (py - v.y) * k }
      })
    },
    [minZoom, maxZoom],
  )

  const drag = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null)
  const onPointerDown = useCallback((e: ReactPointerEvent) => {
    if (e.button !== 0) return
    drag.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y }
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
  }, [view.x, view.y])
  const onPointerMove = useCallback((e: ReactPointerEvent) => {
    const d = drag.current
    if (!d) return
    setView((v) => ({ ...v, x: d.vx + (e.clientX - d.x), y: d.vy + (e.clientY - d.y) }))
  }, [])
  const onPointerUp = useCallback(() => {
    drag.current = null
  }, [])

  const zoomBy = useCallback((f: number) => setView((v) => ({ ...v, z: clamp(v.z * f, minZoom, maxZoom) })), [minZoom, maxZoom])

  if (!graph.nodes.length) {
    return (
      <div className="hz-gitops hz-gitops-tree" style={themeStyle(theme, { height, ...style })}>
        <GitopsStyles />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {empty ?? <span className="hz-gitops-muted">No resources.</span>}
        </div>
      </div>
    )
  }

  const half = nodeHeight / 2
  return (
    <div className="hz-gitops hz-gitops-tree" style={themeStyle(theme, { height, ...style })}>
      <GitopsStyles />
      <div
        ref={viewportRef}
        className="hz-gitops-tree-viewport"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onClick={(e) => {
          if (e.target === e.currentTarget) select(null)
        }}
      >
        <div
          className="hz-gitops-tree-world"
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})`, width: graph.width, height: graph.height }}
        >
          <svg
            width={graph.width}
            height={graph.height}
            style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible', pointerEvents: 'none' }}
          >
            {graph.edges.map((e) => {
              const s = graph.nodes.find((n) => n.id === e.source)
              const t = graph.nodes.find((n) => n.id === e.target)
              if (!s || !t) return null
              const sx = s.x + nodeWidth
              const sy = s.y + half
              const tx = t.x
              const ty = t.y + half
              const mx = (sx + tx) / 2
              return (
                <path
                  key={e.id}
                  d={`M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${tx} ${ty}`}
                  fill="none"
                  stroke="var(--hz-edge)"
                  strokeWidth={1.5}
                />
              )
            })}
          </svg>

          {graph.nodes.map((n) => (
            <div key={n.id} style={{ position: 'absolute', left: n.x, top: n.y }}>
              <ResourceNode
                data={n.node}
                width={nodeWidth}
                height={nodeHeight}
                selected={sel === n.id}
                onSelect={select}
                healthPalette={healthPalette}
                syncPalette={syncPalette}
              />
              {n.hasChildren ? (
                <button
                  type="button"
                  className="hz-gitops-collapse"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggle(n.id)
                  }}
                  title={n.collapsed ? 'Expand' : 'Collapse'}
                >
                  <Chevron open={!n.collapsed} />
                </button>
              ) : null}
            </div>
          ))}
        </div>

        <div className="hz-gitops-zoom">
          <button type="button" className="hz-gitops-btn" onClick={() => zoomBy(1.2)} title="Zoom in">+</button>
          <button type="button" className="hz-gitops-btn" onClick={() => zoomBy(1 / 1.2)} title="Zoom out">−</button>
          <button type="button" className="hz-gitops-btn" onClick={fit} title="Fit">
            Fit
          </button>
        </div>
      </div>
    </div>
  )
}
