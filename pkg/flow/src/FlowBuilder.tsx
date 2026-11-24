"use client"

/**
 * `<FlowBuilder>` — the canonical OSS visual AI workflow builder for Hanzo
 * (`flow.hanzo.ai`, `hanzo.app/flow`, Hanzo Desktop, and CRM applications).
 *
 * Composes `FlowSidebar` + interactive `@xyflow/react` drag-and-drop canvas +
 * compact 40px topbar + `FlowInspector`, strictly on `@hanzo/gui` primitives
 * (zero Tailwind, zero Radix). Supports both controlled (`flows`/`onChange`)
 * and `backend: FlowBackend` modes.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { CSSProperties, DragEvent, ReactNode } from "react"
import { Text, View, XStack, YStack } from "@hanzo/gui"
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from "@xyflow/react"

import "@xyflow/react/dist/style.css"

import { FlowInspector, type FlowInspectorTab } from "./FlowInspector"
import { FLOW_NODE_TYPES, FlowNodeConfigProvider } from "./FlowNode"
import { FLOW_DRAG_MIME, FlowSidebar } from "./FlowSidebar"
import {
  AlertGlyph,
  CheckGlyph,
  FitGlyph,
  LayoutGlyph,
  PanelLeftGlyph,
  PanelRightGlyph,
  PlayGlyph,
  SaveGlyph,
} from "./glyphs"
import {
  applyLayoutToFlow,
  createEmptyFlow,
  createFlowFromTemplate,
  createFlowNodeFromPalette,
  DEFAULT_FLOW_PALETTE,
  DEFAULT_FLOW_TEMPLATES,
  EMBEDDING_MODELS,
  ENSO_MODELS,
  executeFlowGraph,
  FLOW_KIND_META,
  layoutFlowGraph,
  validateFlowGraph,
} from "./pure"
import { FlowStyles } from "./styles"
import { FLOW_THEME, flowThemeCssVars, MONO_FONT, SANS_FONT } from "./theme"
import type {
  FlowBackend,
  FlowDefinition,
  FlowEdgeData,
  FlowEmbeddingModel,
  FlowEnsoModel,
  FlowNodeData,
  FlowNodeExecutionStatus,
  FlowNodeExecutor,
  FlowPaletteItem,
  FlowRun,
  FlowTemplate,
  FlowTheme,
  FlowValidationIssue,
} from "./types"

export interface FlowBuilderProps {
  /** Controlled workflow list. Omit to use `backend` or built-in local state. */
  flows?: FlowDefinition[]
  /** Controlled state callback invoked whenever any flow changes. */
  onChange?: (flows: FlowDefinition[]) => void
  /** Controlled active flow ID. */
  activeFlowId?: string
  /** Callback when user switches active flow. */
  onActiveFlowChange?: (id: string) => void
  /** Optional REST or memory backend adapter (`createHttpFlowBackend` / `createMemoryFlowBackend`). */
  backend?: FlowBackend
  /** Starter templates shown in the sidebar template picker. */
  templates?: readonly FlowTemplate[]
  /** Draggable / click-to-add palette items. */
  palette?: readonly FlowPaletteItem[]
  /** Available chat/reasoning models for agent nodes (defaults to live `/v1/models` list). */
  models?: readonly FlowEnsoModel[]
  /** Available embedding models for Knowledge/RAG nodes. */
  embeddingModels?: readonly FlowEmbeddingModel[]
  /** Pure monochrome OLED dark (default) or light theme. */
  theme?: FlowTheme
  /** Workspace label rendered in the 40px topbar. */
  title?: string
  /** Optional custom action controls injected into the topbar. */
  headerActions?: ReactNode
  /** Optional custom footer content rendered at the bottom of the left sidebar. */
  sidebarFooter?: ReactNode
  /** Optional custom icon renderer for node cards. */
  renderIcon?: (node: FlowNodeData) => ReactNode
  /** Optional custom node executor when running locally without `backend.runFlow`. */
  executor?: FlowNodeExecutor
  /** Respect reduced motion animations. */
  reducedMotion?: boolean
  showMiniMap?: boolean
  showControls?: boolean
  defaultSidebarOpen?: boolean
  defaultInspectorOpen?: boolean
  onSave?: (flow: FlowDefinition) => void
  onRunComplete?: (run: FlowRun) => void
  onSelectNode?: (node: FlowNodeData | null) => void
  style?: CSSProperties
}

function toReactFlowGraph(
  flow: FlowDefinition,
  theme: FlowTheme,
  activeRun: FlowRun | null,
  selectedNodeId: string | null,
  reducedMotion: boolean
): { nodes: Node[]; edges: Edge[] } {
  const t = FLOW_THEME[theme]
  const fallbackPos = new Map(
    layoutFlowGraph(flow.nodes, flow.edges).map((p) => [p.id, p.position])
  )

  const stepById = new Map((activeRun?.steps ?? []).map((s) => [s.nodeId, s]))

  const nodes: Node[] = flow.nodes.map((n) => ({
    id: n.id,
    type: "flowNode",
    position: n.position ?? fallbackPos.get(n.id) ?? { x: 48, y: 48 },
    data: n as unknown as Record<string, unknown>,
    selected: n.id === selectedNodeId,
  }))

  const edges: Edge[] = flow.edges.map((e) => {
    const srcStep = stepById.get(e.source)
    const dstStep = stepById.get(e.target)
    const traversed =
      srcStep?.status === "succeeded" &&
      dstStep !== undefined &&
      dstStep.status !== "skipped"

    return {
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      label: e.label,
      animated: !reducedMotion && Boolean(e.animated || traversed),
      labelStyle: {
        fill: t.fgMuted,
        fontSize: 10,
        fontFamily: MONO_FONT,
      },
      labelBgStyle: {
        fill: t.canvasBg,
        fillOpacity: 0.9,
      },
      style: {
        stroke: traversed ? t.edgeSelected : t.edge,
        strokeWidth: traversed ? 2 : 1.5,
      },
    }
  })

  return { nodes, edges }
}

interface InnerCanvasProps {
  flow: FlowDefinition
  theme: FlowTheme
  activeRun: FlowRun | null
  runningNodeIds: Set<string>
  selectedNodeId: string | null
  onSelectNodeId: (id: string | null) => void
  onUpdateFlow: (updater: (prev: FlowDefinition) => FlowDefinition) => void
  issuesByNode: Record<string, FlowValidationIssue[]>
  renderIcon?: (node: FlowNodeData) => ReactNode
  reducedMotion: boolean
  showMiniMap: boolean
  showControls: boolean
  fitSignal: number
}

function FlowCanvasSurface({
  flow,
  theme,
  activeRun,
  runningNodeIds,
  selectedNodeId,
  onSelectNodeId,
  onUpdateFlow,
  issuesByNode,
  renderIcon,
  reducedMotion,
  showMiniMap,
  showControls,
  fitSignal,
}: InnerCanvasProps) {
  const t = FLOW_THEME[theme]
  const rf = useReactFlow()
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (fitSignal > 0) {
      rf.fitView({ padding: 0.22, duration: reducedMotion ? 0 : 220 })
    }
  }, [fitSignal, rf, reducedMotion])

  const { nodes: rfNodes, edges: rfEdges } = useMemo(
    () =>
      toReactFlowGraph(flow, theme, activeRun, selectedNodeId, reducedMotion),
    [flow, theme, activeRun, selectedNodeId, reducedMotion]
  )

  const executionStatusByNode = useMemo(() => {
    const map: Record<string, FlowNodeExecutionStatus> = {}
    for (const id of runningNodeIds) map[id] = "running"
    for (const step of activeRun?.steps ?? []) {
      map[step.nodeId] = step.status === "pending" ? "idle" : step.status
    }
    return map
  }, [activeRun, runningNodeIds])

  const latencyByNode = useMemo(() => {
    const map: Record<string, number> = {}
    for (const step of activeRun?.steps ?? []) {
      if (step.status === "succeeded" || step.status === "failed") {
        map[step.nodeId] = step.durationMs
      }
    }
    return map
  }, [activeRun])

  const nodeConfig = useMemo(
    () => ({
      theme,
      executionStatusByNode,
      latencyByNode,
      issuesByNode,
      renderIcon,
      reducedMotion,
    }),
    [
      theme,
      executionStatusByNode,
      latencyByNode,
      issuesByNode,
      renderIcon,
      reducedMotion,
    ]
  )

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const posUpdates = new Map<string, { x: number; y: number }>()
      const removedIds = new Set<string>()

      for (const ch of changes) {
        if (ch.type === "position" && ch.position) {
          posUpdates.set(ch.id, {
            x: Math.round(ch.position.x),
            y: Math.round(ch.position.y),
          })
        } else if (ch.type === "remove") {
          removedIds.add(ch.id)
        } else if (ch.type === "select" && ch.selected) {
          onSelectNodeId(ch.id)
        }
      }

      if (posUpdates.size === 0 && removedIds.size === 0) return

      onUpdateFlow((prev) => ({
        ...prev,
        nodes: prev.nodes
          .filter((n) => !removedIds.has(n.id))
          .map((n) => {
            const p = posUpdates.get(n.id)
            return p ? { ...n, position: p } : n
          }),
        edges:
          removedIds.size > 0
            ? prev.edges.filter(
                (e) => !removedIds.has(e.source) && !removedIds.has(e.target)
              )
            : prev.edges,
      }))

      if (selectedNodeId && removedIds.has(selectedNodeId)) {
        onSelectNodeId(null)
      }
    },
    [onUpdateFlow, onSelectNodeId, selectedNodeId]
  )

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const removedIds = new Set<string>()
      for (const ch of changes) {
        if (ch.type === "remove") removedIds.add(ch.id)
      }
      if (removedIds.size === 0) return
      onUpdateFlow((prev) => ({
        ...prev,
        edges: prev.edges.filter((e) => !removedIds.has(e.id)),
      }))
    },
    [onUpdateFlow]
  )

  const handleConnect = useCallback(
    (conn: Connection) => {
      if (!conn.source || !conn.target || conn.source === conn.target) return
      onUpdateFlow((prev) => {
        const dup = prev.edges.some(
          (e) =>
            e.source === conn.source &&
            e.target === conn.target &&
            (e.sourceHandle ?? "") === (conn.sourceHandle ?? "")
        )
        if (dup) return prev

        const srcNode = prev.nodes.find((n) => n.id === conn.source)
        const isCond = srcNode?.kind === "condition"
        const handle = conn.sourceHandle ?? undefined
        const condLabel =
          isCond && handle === "true"
            ? (srcNode.config?.trueLabel ?? "True")
            : isCond && handle === "false"
              ? (srcNode.config?.falseLabel ?? "False")
              : undefined

        const nextEdge: FlowEdgeData = {
          id: `e-${conn.source}-${handle ?? "out"}-${conn.target}-${Date.now().toString(36)}`,
          source: conn.source!,
          target: conn.target!,
          sourceHandle: handle,
          targetHandle: conn.targetHandle ?? undefined,
          condition:
            handle === "true" || handle === "false" ? handle : undefined,
          label: condLabel,
        }
        return { ...prev, edges: [...prev.edges, nextEdge] }
      })
    },
    [onUpdateFlow]
  )

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const raw = e.dataTransfer.getData(FLOW_DRAG_MIME)
      if (!raw) return
      try {
        const item = JSON.parse(raw) as FlowPaletteItem
        const pos = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY })
        const node = createFlowNodeFromPalette(item, {
          x: Math.round(pos.x),
          y: Math.round(pos.y),
        })
        onUpdateFlow((prev) => ({
          ...prev,
          nodes: [...prev.nodes, node],
        }))
        onSelectNodeId(node.id)
      } catch {
        // Ignore non-palette drop payloads
      }
    },
    [rf, onUpdateFlow, onSelectNodeId]
  )

  return (
    <div
      ref={wrapperRef}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{
        position: "relative",
        flex: 1,
        height: "100%",
        minWidth: 0,
        backgroundColor: t.canvasBg,
      }}
    >
      <FlowNodeConfigProvider value={nodeConfig}>
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          nodeTypes={FLOW_NODE_TYPES}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={handleConnect}
          onNodeClick={(_e, node) => onSelectNodeId(node.id)}
          onPaneClick={() => onSelectNodeId(null)}
          deleteKeyCode={["Backspace", "Delete"]}
          fitView
          fitViewOptions={{ padding: 0.22, maxZoom: 1 }}
          minZoom={0.2}
          maxZoom={1.75}
          elementsSelectable
          nodesDraggable
          nodesConnectable
          proOptions={{ hideAttribution: true }}
          colorMode={theme}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={18}
            size={1}
            color="var(--hz-flow-dots)"
          />
          {showMiniMap ? (
            <MiniMap
              pannable
              zoomable
              nodeStrokeWidth={0}
              nodeColor={() => t.minimapNode}
              maskColor="var(--hz-flow-minimap-mask)"
              style={{ background: "var(--hz-flow-minimap)" }}
            />
          ) : null}
          {showControls ? <Controls showInteractive={false} /> : null}
        </ReactFlow>
      </FlowNodeConfigProvider>
    </div>
  )
}

function topbarButtonStyle(
  theme: FlowTheme,
  variant: "ghost" | "outline" | "primary" = "outline"
): CSSProperties {
  const t = FLOW_THEME[theme]
  if (variant === "primary") {
    return {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      height: 26,
      padding: "0 10px",
      borderRadius: 6,
      border: "none",
      background: t.primaryBg,
      color: t.primaryFg,
      fontSize: 11.5,
      fontWeight: 600,
      cursor: "pointer",
      whiteSpace: "nowrap",
    }
  }
  if (variant === "ghost") {
    return {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 26,
      height: 26,
      borderRadius: 6,
      border: `1px solid transparent`,
      background: "transparent",
      color: t.fgMuted,
      cursor: "pointer",
      flexShrink: 0,
    }
  }
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    height: 26,
    padding: "0 8px",
    borderRadius: 6,
    border: `1px solid ${t.border}`,
    background: "transparent",
    color: t.fgMuted,
    fontSize: 11.5,
    fontWeight: 500,
    cursor: "pointer",
    whiteSpace: "nowrap",
  }
}

export function FlowBuilder({
  flows: controlledFlows,
  onChange,
  activeFlowId: controlledActiveId,
  onActiveFlowChange,
  backend,
  templates = DEFAULT_FLOW_TEMPLATES,
  palette = DEFAULT_FLOW_PALETTE,
  models = ENSO_MODELS,
  embeddingModels = EMBEDDING_MODELS,
  theme = "dark",
  title = "Flow",
  headerActions,
  sidebarFooter,
  renderIcon,
  executor,
  reducedMotion = false,
  showMiniMap = true,
  showControls = true,
  defaultSidebarOpen = true,
  defaultInspectorOpen = true,
  onSave,
  onRunComplete,
  onSelectNode,
  style,
}: FlowBuilderProps) {
  const t = FLOW_THEME[theme]
  const isControlled = controlledFlows !== undefined

  const [internalFlows, setInternalFlows] = useState<FlowDefinition[]>(() => {
    if (controlledFlows) return controlledFlows
    if (backend) return []
    const first = templates[0]
    return [first ? createFlowFromTemplate(first) : createEmptyFlow()]
  })

  const flows = isControlled ? controlledFlows : internalFlows

  const [internalActiveId, setInternalActiveId] = useState<string | null>(
    () => controlledActiveId ?? flows[0]?.id ?? null
  )
  const activeFlowId =
    controlledActiveId !== undefined
      ? controlledActiveId
      : flows.some((f) => f.id === internalActiveId)
        ? internalActiveId
        : (flows[0]?.id ?? null)

  const activeFlow = useMemo(
    () => flows.find((f) => f.id === activeFlowId) ?? flows[0] ?? null,
    [flows, activeFlowId]
  )

  const [sidebarOpen, setSidebarOpen] = useState(defaultSidebarOpen)
  const [inspectorOpen, setInspectorOpen] = useState(defaultInspectorOpen)
  const [inspectorTab, setInspectorTab] = useState<FlowInspectorTab>("config")
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [runningNodeIds, setRunningNodeIds] = useState<Set<string>>(new Set())
  const [runsByFlow, setRunsByFlow] = useState<Record<string, FlowRun[]>>({})
  const [activeRun, setActiveRun] = useState<FlowRun | null>(null)
  const [fitSignal, setFitSignal] = useState(0)

  // Hydrate from backend if supplied
  useEffect(() => {
    if (!backend || isControlled) return
    let cancelled = false
    void backend.listFlows().then((list) => {
      if (cancelled) return
      if (list.length > 0) {
        setInternalFlows(list)
        setInternalActiveId((cur) =>
          cur && list.some((f) => f.id === cur) ? cur : list[0].id
        )
      } else {
        const starter = templates[0]
          ? createFlowFromTemplate(templates[0])
          : createEmptyFlow()
        setInternalFlows([starter])
        setInternalActiveId(starter.id)
      }
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backend, isControlled])

  // Load recent runs from backend when active flow changes
  useEffect(() => {
    if (!backend || !activeFlow?.id) return
    let cancelled = false
    const id = activeFlow.id
    void backend
      .listRuns(id)
      .then((list) => {
        if (cancelled) return
        setRunsByFlow((prev) => ({ ...prev, [id]: list }))
        setActiveRun(list[0] ?? null)
      })
      .catch(() => {
        // Ignore run-history errors for unsaved drafts
      })
    return () => {
      cancelled = true
    }
  }, [backend, activeFlow?.id])

  const commitFlows = useCallback(
    (next: FlowDefinition[]) => {
      if (!isControlled) setInternalFlows(next)
      onChange?.(next)
    },
    [isControlled, onChange]
  )

  const selectFlow = useCallback(
    (id: string) => {
      setInternalActiveId(id)
      onActiveFlowChange?.(id)
      setSelectedNodeId(null)
      setActiveRun(runsByFlow[id]?.[0] ?? null)
      setDirty(false)
    },
    [onActiveFlowChange, runsByFlow]
  )

  const handleSelectNodeId = useCallback(
    (id: string | null) => {
      setSelectedNodeId(id)
      if (onSelectNode) {
        const node = id
          ? (activeFlow?.nodes.find((n) => n.id === id) ?? null)
          : null
        onSelectNode(node)
      }
    },
    [activeFlow, onSelectNode]
  )

  const updateActiveFlow = useCallback(
    (updater: (prev: FlowDefinition) => FlowDefinition) => {
      if (!activeFlow) return
      const updated = {
        ...updater(activeFlow),
        updatedAt: new Date().toISOString(),
      }
      commitFlows(flows.map((f) => (f.id === activeFlow.id ? updated : f)))
      setDirty(true)
    },
    [activeFlow, commitFlows, flows]
  )

  const handleCreateFlow = useCallback(() => {
    const created = createEmptyFlow(`Workflow ${flows.length + 1}`)
    commitFlows([created, ...flows])
    selectFlow(created.id)
    setDirty(true)
    if (backend) void backend.saveFlow(created)
  }, [flows, commitFlows, selectFlow, backend])

  const handleCreateFromTemplate = useCallback(
    (tpl: FlowTemplate) => {
      const created = createFlowFromTemplate(tpl)
      commitFlows([created, ...flows])
      selectFlow(created.id)
      setDirty(true)
      setFitSignal((s) => s + 1)
      if (backend) void backend.saveFlow(created)
    },
    [flows, commitFlows, selectFlow, backend]
  )

  const handleToggleFlow = useCallback(
    (id: string, enabled: boolean) => {
      commitFlows(
        flows.map((f) =>
          f.id === id
            ? { ...f, enabled, updatedAt: new Date().toISOString() }
            : f
        )
      )
      if (backend) {
        void backend.toggleFlow(id, enabled).catch(() => {
          const target = flows.find((f) => f.id === id)
          if (target) void backend.saveFlow({ ...target, enabled })
        })
      }
    },
    [flows, commitFlows, backend]
  )

  const handleDeleteFlow = useCallback(
    (id: string) => {
      const remaining = flows.filter((f) => f.id !== id)
      commitFlows(remaining)
      if (activeFlowId === id) {
        selectFlow(remaining[0]?.id ?? "")
      }
      if (backend) void backend.deleteFlow(id)
    },
    [flows, activeFlowId, commitFlows, selectFlow, backend]
  )

  const handleAddNode = useCallback(
    (item: FlowPaletteItem) => {
      if (!activeFlow) return
      const anchor =
        activeFlow.nodes.find((n) => n.id === selectedNodeId) ??
        activeFlow.nodes[activeFlow.nodes.length - 1]
      const basePos = anchor?.position ?? { x: 48, y: 120 }
      const newNode = createFlowNodeFromPalette(item, {
        x: Math.round(basePos.x + 300),
        y: Math.round(basePos.y),
      })

      updateActiveFlow((prev) => {
        const shouldConnect =
          anchor &&
          FLOW_KIND_META[anchor.kind].hasOutput &&
          FLOW_KIND_META[newNode.kind].hasInput
        const nextEdges = shouldConnect
          ? [
              ...prev.edges,
              {
                id: `e-${anchor.id}-${newNode.id}-${Date.now().toString(36)}`,
                source: anchor.id,
                target: newNode.id,
                sourceHandle: anchor.kind === "condition" ? "true" : undefined,
                condition: anchor.kind === "condition" ? "true" : undefined,
                label:
                  anchor.kind === "condition"
                    ? (anchor.config?.trueLabel ?? "True")
                    : undefined,
              },
            ]
          : prev.edges
        return {
          ...prev,
          nodes: [...prev.nodes, newNode],
          edges: nextEdges,
        }
      })
      handleSelectNodeId(newNode.id)
      setInspectorOpen(true)
      setInspectorTab("config")
    },
    [activeFlow, selectedNodeId, updateActiveFlow, handleSelectNodeId]
  )

  const handleUpdateNode = useCallback(
    (nodeId: string, patch: Partial<FlowNodeData>) => {
      updateActiveFlow((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) =>
          n.id === nodeId ? { ...n, ...patch } : n
        ),
      }))
    },
    [updateActiveFlow]
  )

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      updateActiveFlow((prev) => ({
        ...prev,
        nodes: prev.nodes.filter((n) => n.id !== nodeId),
        edges: prev.edges.filter(
          (e) => e.source !== nodeId && e.target !== nodeId
        ),
      }))
      if (selectedNodeId === nodeId) handleSelectNodeId(null)
    },
    [updateActiveFlow, selectedNodeId, handleSelectNodeId]
  )

  const handleAutoLayout = useCallback(() => {
    updateActiveFlow((prev) => applyLayoutToFlow(prev))
    setFitSignal((s) => s + 1)
  }, [updateActiveFlow])

  const handleSave = useCallback(async () => {
    if (!activeFlow) return
    setSaving(true)
    try {
      let saved = activeFlow
      if (backend) {
        saved = await backend.saveFlow(activeFlow)
        commitFlows(flows.map((f) => (f.id === saved.id ? saved : f)))
      }
      setDirty(false)
      onSave?.(saved)
    } finally {
      setSaving(false)
    }
  }, [activeFlow, backend, commitFlows, flows, onSave])

  const handleRun = useCallback(
    async (input?: unknown) => {
      if (!activeFlow || isRunning) return
      setIsRunning(true)
      setInspectorOpen(true)
      setInspectorTab("run")
      setRunningNodeIds(new Set(activeFlow.nodes.map((n) => n.id)))
      try {
        let run: FlowRun
        if (backend) {
          if (dirty) await backend.saveFlow(activeFlow)
          run = await backend.runFlow(activeFlow.id, input)
        } else {
          run = await executeFlowGraph(activeFlow, input, executor)
        }
        setActiveRun(run)
        setRunsByFlow((prev) => ({
          ...prev,
          [activeFlow.id]: [run, ...(prev[activeFlow.id] ?? [])].slice(0, 50),
        }))
        setDirty(false)
        onRunComplete?.(run)
      } finally {
        setRunningNodeIds(new Set())
        setIsRunning(false)
      }
    },
    [activeFlow, isRunning, backend, dirty, executor, onRunComplete]
  )

  const validation = useMemo(
    () => (activeFlow ? validateFlowGraph(activeFlow) : undefined),
    [activeFlow]
  )

  const issuesByNode = useMemo(() => {
    const map: Record<string, FlowValidationIssue[]> = {}
    for (const issue of validation?.issues ?? []) {
      if (!issue.nodeId) continue
      if (!map[issue.nodeId]) map[issue.nodeId] = []
      map[issue.nodeId].push(issue)
    }
    return map
  }, [validation])

  const selectedNode = useMemo(
    () =>
      activeFlow && selectedNodeId
        ? (activeFlow.nodes.find((n) => n.id === selectedNodeId) ?? null)
        : null,
    [activeFlow, selectedNodeId]
  )

  const currentRuns = activeFlow ? (runsByFlow[activeFlow.id] ?? []) : []

  return (
    <YStack
      className="hz-flow"
      width="100%"
      height="100%"
      overflow="hidden"
      style={{
        backgroundColor: t.canvasBg,
        color: t.fg,
        fontFamily: SANS_FONT,
        ...(flowThemeCssVars(theme) as CSSProperties),
        ...style,
      }}
    >
      <FlowStyles />

      {/* Compact 40px Hanzo Dev topbar */}
      <XStack
        height={40}
        px={10}
        items="center"
        justify="space-between"
        gap={8}
        style={{
          backgroundColor: t.topbarBg,
          borderBottomWidth: 1,
          borderBottomStyle: "solid",
          borderBottomColor: t.border,
          flexShrink: 0,
        }}
      >
        {/* Left: sidebar toggle + title / flow name + validation pill */}
        <XStack items="center" gap={8} minW={0} flex={1}>
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle flows sidebar"
            title="Toggle sidebar"
            style={topbarButtonStyle(theme, "ghost")}
          >
            <PanelLeftGlyph size={15} />
          </button>

          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: t.fgMuted,
              flexShrink: 0,
            }}
          >
            {title}
          </Text>
          <Text style={{ fontSize: 12, color: t.fgSubtle, flexShrink: 0 }}>
            /
          </Text>

          {activeFlow ? (
            <input
              type="text"
              value={activeFlow.name}
              onChange={(e) =>
                updateActiveFlow((prev) => ({ ...prev, name: e.target.value }))
              }
              aria-label="Flow name"
              style={{
                minWidth: 80,
                maxWidth: 240,
                height: 26,
                padding: "0 6px",
                borderRadius: 5,
                border: "1px solid transparent",
                background: "transparent",
                color: t.fg,
                fontSize: 12.5,
                fontWeight: 600,
                outline: "none",
              }}
            />
          ) : null}

          {dirty ? (
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                backgroundColor: t.fgMuted,
                flexShrink: 0,
              }}
            />
          ) : null}

          {validation ? (
            <XStack
              items="center"
              gap={4}
              px={7}
              py={2}
              style={{
                borderRadius: 999,
                backgroundColor: t.pillBg,
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: t.border,
                flexShrink: 0,
              }}
            >
              <View
                style={{
                  display: "inline-flex",
                  color:
                    validation.errors.length > 0
                      ? t.statusFailed
                      : validation.warnings.length > 0
                        ? t.statusWarning
                        : t.statusSucceeded,
                }}
              >
                {validation.errors.length > 0 ||
                validation.warnings.length > 0 ? (
                  <AlertGlyph size={11} />
                ) : (
                  <CheckGlyph size={11} />
                )}
              </View>
              <Text
                style={{
                  fontSize: 10.5,
                  color: t.fgMuted,
                  fontFamily: MONO_FONT,
                }}
              >
                {validation.errors.length > 0
                  ? `${validation.errors.length} err`
                  : validation.warnings.length > 0
                    ? `${validation.warnings.length} warn`
                    : "valid"}
              </Text>
            </XStack>
          ) : null}
        </XStack>

        {/* Right: Auto-Layout, Fit View, Active toggle, Save, Run, slot, inspector toggle */}
        <XStack items="center" gap={6} style={{ flexShrink: 0 }}>
          <button
            type="button"
            onClick={handleAutoLayout}
            disabled={!activeFlow}
            title="Auto-layout graph left-to-right"
            style={topbarButtonStyle(theme, "outline")}
          >
            <LayoutGlyph size={12} />
            <span>Layout</span>
          </button>

          <button
            type="button"
            onClick={() => setFitSignal((s) => s + 1)}
            disabled={!activeFlow}
            title="Fit view"
            style={topbarButtonStyle(theme, "outline")}
          >
            <FitGlyph size={12} />
            <span>Fit</span>
          </button>

          {activeFlow ? (
            <button
              type="button"
              role="switch"
              aria-checked={activeFlow.enabled}
              onClick={() =>
                handleToggleFlow(activeFlow.id, !activeFlow.enabled)
              }
              style={{
                ...topbarButtonStyle(theme, "outline"),
                borderColor: activeFlow.enabled ? t.borderStrong : t.border,
                background: activeFlow.enabled ? t.pillActiveBg : "transparent",
                color: activeFlow.enabled ? t.fg : t.fgMuted,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: activeFlow.enabled
                    ? t.statusSucceeded
                    : t.fgSubtle,
                }}
              />
              <span>{activeFlow.enabled ? "Active" : "Paused"}</span>
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={!activeFlow || saving}
            style={topbarButtonStyle(theme, "outline")}
          >
            <SaveGlyph size={12} />
            <span>{saving ? "Saving..." : "Save"}</span>
          </button>

          <button
            type="button"
            onClick={() => void handleRun({})}
            disabled={!activeFlow || isRunning}
            style={topbarButtonStyle(theme, "primary")}
          >
            <PlayGlyph size={11} />
            <span>{isRunning ? "Running" : "Run"}</span>
          </button>

          {headerActions}

          <button
            type="button"
            onClick={() => setInspectorOpen((v) => !v)}
            aria-label="Toggle inspector"
            title="Toggle inspector"
            style={topbarButtonStyle(theme, "ghost")}
          >
            <PanelRightGlyph size={15} />
          </button>
        </XStack>
      </XStack>

      {/* Main 3-pane body */}
      <XStack flex={1} minH={0} minW={0}>
        {sidebarOpen ? (
          <FlowSidebar
            flows={flows}
            activeFlowId={activeFlow?.id ?? null}
            onSelectFlow={selectFlow}
            onCreateFlow={handleCreateFlow}
            onCreateFromTemplate={handleCreateFromTemplate}
            onToggleFlow={handleToggleFlow}
            onDeleteFlow={handleDeleteFlow}
            onAddNode={handleAddNode}
            palette={palette}
            templates={templates}
            theme={theme}
            footer={sidebarFooter}
          />
        ) : null}

        {activeFlow ? (
          <ReactFlowProvider>
            <FlowCanvasSurface
              flow={activeFlow}
              theme={theme}
              activeRun={activeRun}
              runningNodeIds={runningNodeIds}
              selectedNodeId={selectedNodeId}
              onSelectNodeId={handleSelectNodeId}
              onUpdateFlow={updateActiveFlow}
              issuesByNode={issuesByNode}
              renderIcon={renderIcon}
              reducedMotion={reducedMotion}
              showMiniMap={showMiniMap}
              showControls={showControls}
              fitSignal={fitSignal}
            />
          </ReactFlowProvider>
        ) : (
          <YStack
            flex={1}
            items="center"
            justify="center"
            gap={10}
            style={{ backgroundColor: t.canvasBg }}
          >
            <Text style={{ fontSize: 13, color: t.fgMuted }}>
              No workflow selected.
            </Text>
            <button
              type="button"
              onClick={handleCreateFlow}
              style={topbarButtonStyle(theme, "primary")}
            >
              Create Workflow
            </button>
          </YStack>
        )}

        {inspectorOpen && activeFlow ? (
          <FlowInspector
            flow={activeFlow}
            selectedNode={selectedNode}
            onUpdateNode={handleUpdateNode}
            onDeleteNode={handleDeleteNode}
            onUpdateFlow={(patch) =>
              updateActiveFlow((prev) => ({ ...prev, ...patch }))
            }
            onSelectNode={handleSelectNodeId}
            validation={validation}
            runs={currentRuns}
            activeRun={activeRun}
            onSelectRun={setActiveRun}
            onRunFlow={handleRun}
            isRunning={isRunning}
            activeTab={inspectorTab}
            onTabChange={setInspectorTab}
            models={models}
            embeddingModels={embeddingModels}
            theme={theme}
          />
        ) : null}
      </XStack>
    </YStack>
  )
}
