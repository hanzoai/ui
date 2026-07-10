"use client"

/**
 * The project canvas — a pannable/zoomable board of service nodes and the honest
 * connections between them (Railway-style). Read-only: positions come from the
 * deterministic auto-layout (or explicit `positions`), nodes are draggable for
 * exploration but never connectable, edges are computed, not drawn.
 *
 * Browser-only (`@xyflow/react` touches globals at import) — a host should
 * dynamic-import this with SSR disabled. Theme-aware: the chrome + edge/dot hues
 * follow the `theme` prop (drive it off your app's resolved theme, not
 * `prefers-color-scheme`).
 */
import { useCallback, useMemo } from "react"
import type { CSSProperties } from "react"
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from "@xyflow/react"

import "@xyflow/react/dist/style.css"

import type { ReactNode } from "react"

import { CANVAS_NODE_TYPES, CanvasNodeConfigProvider } from "./canvas-node"
import { layoutGraph, type LayoutOptions, type XYPosition } from "./layout"
import { statusColors } from "./status"
import { CanvasStyles } from "./styles"
import type {
  ServiceEdgeData,
  ServiceNodeData,
  ServiceStatus,
  StatusPalette,
} from "./types"

export interface ProjectCanvasProps {
  nodes: ServiceNodeData[]
  edges?: ServiceEdgeData[]
  /** Explicit positions by node id; else the nodes are auto-laid-out. */
  positions?: Record<string, XYPosition>
  layoutOptions?: LayoutOptions
  reducedMotion?: boolean
  theme?: "light" | "dark"
  statusPalette?: Partial<Record<ServiceStatus, StatusPalette>>
  renderIcon?: (d: ServiceNodeData) => ReactNode
  onSelect?: (d: ServiceNodeData | null) => void
  onOpenDetail?: (d: ServiceNodeData) => void
  nodeWidth?: number
  showMiniMap?: boolean
  showControls?: boolean
  fitViewPadding?: number
  /** Rendered over the canvas when there are no nodes. */
  empty?: ReactNode
  now?: number
  style?: CSSProperties
}

const THEME_VARS = {
  dark: {
    "--hz-border": "#30363d",
    "--hz-surface": "#0d1117",
    "--hz-surface-2": "#161b22",
    "--hz-fg": "#c9d1d9",
    "--hz-edge": "#3d444d",
    "--hz-dots": "#21262d",
    "--hz-minimap": "rgba(1,4,9,0.6)",
  },
  light: {
    "--hz-border": "#d0d7de",
    "--hz-surface": "#ffffff",
    "--hz-surface-2": "#f6f8fa",
    "--hz-fg": "#57606a",
    "--hz-edge": "#afb8c1",
    "--hz-dots": "#d8dee4",
    "--hz-minimap": "rgba(255,255,255,0.6)",
  },
} as const

function toFlow(
  nodes: ServiceNodeData[],
  edges: ServiceEdgeData[],
  positions: Record<string, XYPosition>,
  animate: boolean
): { nodes: Node[]; edges: Edge[] } {
  const flowNodes: Node[] = nodes.map((n) => ({
    id: n.id,
    type: "service",
    position: positions[n.id] ?? { x: 0, y: 0 },
    data: n as unknown as Record<string, unknown>,
    connectable: false,
  }))
  const flowEdges: Edge[] = edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    animated: animate && (e.reason ?? "dependency") === "route",
    style: {
      stroke: "var(--hz-edge)",
      strokeWidth: 1.5,
      strokeDasharray: e.reason === "reference" ? "5 4" : undefined,
    },
  }))
  return { nodes: flowNodes, edges: flowEdges }
}

export function ProjectCanvas({
  nodes,
  edges = [],
  positions,
  layoutOptions,
  reducedMotion,
  theme = "dark",
  statusPalette,
  renderIcon,
  onSelect,
  onOpenDetail,
  nodeWidth,
  showMiniMap = true,
  showControls = true,
  fitViewPadding = 0.24,
  empty,
  now,
  style,
}: ProjectCanvasProps) {
  const pos = useMemo(() => {
    if (positions) return positions
    const laid = layoutGraph(nodes, edges, layoutOptions)
    return Object.fromEntries(laid.map((n) => [n.id, n.position]))
  }, [positions, nodes, edges, layoutOptions])

  const { nodes: flowNodes, edges: flowEdges } = useMemo(
    () => toFlow(nodes, edges, pos, !reducedMotion),
    [nodes, edges, pos, reducedMotion]
  )

  const onNodeClick = useCallback<NodeMouseHandler>(
    (_e, node) => {
      const d = node.data as unknown as ServiceNodeData
      onSelect?.(d)
      onOpenDetail?.(d)
    },
    [onSelect, onOpenDetail]
  )

  const cfg = useMemo(
    () => ({ renderIcon, statusPalette, reducedMotion, now, nodeWidth }),
    [renderIcon, statusPalette, reducedMotion, now, nodeWidth]
  )

  const isEmpty = nodes.length === 0

  return (
    <div
      className="hz-canvas"
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        ...(THEME_VARS[theme] as CSSProperties),
        ...style,
      }}
    >
      <CanvasStyles />
      {isEmpty && empty ? (
        <div style={{ position: "absolute", inset: 0, zIndex: 2 }}>{empty}</div>
      ) : (
        <CanvasNodeConfigProvider value={cfg}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={flowNodes}
              edges={flowEdges}
              nodeTypes={CANVAS_NODE_TYPES}
              onNodeClick={onNodeClick}
              onPaneClick={() => onSelect?.(null)}
              fitView
              fitViewOptions={{ padding: fitViewPadding, maxZoom: 1 }}
              minZoom={0.2}
              maxZoom={1.6}
              nodesConnectable={false}
              elementsSelectable
              proOptions={{ hideAttribution: true }}
              colorMode={theme}
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={18}
                size={1}
                color="var(--hz-dots)"
              />
              {showMiniMap ? (
                <MiniMap
                  pannable
                  zoomable
                  nodeStrokeWidth={0}
                  nodeColor={(n) =>
                    statusColors(
                      (n.data as unknown as ServiceNodeData).status,
                      statusPalette
                    ).dot
                  }
                  maskColor="var(--hz-minimap)"
                  style={{ background: "var(--hz-surface)" }}
                />
              ) : null}
              {showControls ? <Controls showInteractive={false} /> : null}
            </ReactFlow>
          </ReactFlowProvider>
        </CanvasNodeConfigProvider>
      )}
    </div>
  )
}
