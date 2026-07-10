"use client"

/**
 * The React Flow node type that renders a `ServiceNode` card. Per-render config
 * (icon override, palette, reduced-motion, `now`) rides a context so the
 * `nodeTypes` map stays a stable module-level identity — React Flow re-creates
 * the graph if `nodeTypes` changes, so it must never be built inline. Handles are
 * invisible and non-interactive: the graph is derived, never drawn by the user.
 */
import { createContext, memo, useContext } from "react"
import type { CSSProperties, ReactNode } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"

import { ServiceNode } from "./ServiceNode"
import type { ServiceNodeData, ServiceStatus, StatusPalette } from "./types"

export interface CanvasNodeConfig {
  renderIcon?: (d: ServiceNodeData) => ReactNode
  statusPalette?: Partial<Record<ServiceStatus, StatusPalette>>
  reducedMotion?: boolean
  now?: number
  nodeWidth?: number
}

const Ctx = createContext<CanvasNodeConfig>({})
export const CanvasNodeConfigProvider = Ctx.Provider

const HANDLE: CSSProperties = {
  opacity: 0,
  width: 1,
  height: 1,
  minWidth: 1,
  border: "none",
  background: "transparent",
  pointerEvents: "none",
}

const ServiceFlowNode = memo(function ServiceFlowNode({
  data,
  selected,
}: NodeProps) {
  const cfg = useContext(Ctx)
  const d = data as unknown as ServiceNodeData
  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        style={HANDLE}
        isConnectable={false}
      />
      <ServiceNode
        data={d}
        selected={selected}
        reducedMotion={cfg.reducedMotion}
        statusPalette={cfg.statusPalette}
        renderIcon={cfg.renderIcon}
        now={cfg.now}
        width={cfg.nodeWidth}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={HANDLE}
        isConnectable={false}
      />
    </>
  )
})

/** Stable module-level node-type map — one card renders every service. */
export const CANVAS_NODE_TYPES = { service: ServiceFlowNode } as const
