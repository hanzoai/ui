"use client"

/**
 * Custom `@xyflow/react` workflow node card built on `@hanzo/gui` (`XStack` /
 * `YStack` / `Text`). Renders monochrome kind icon, label, model/trigger badge,
 * typed input/output handles (including true/false handles for `condition`
 * nodes), active execution ring (`idle` | `running` | `succeeded` | `failed` |
 * `skipped`), and step latency in milliseconds.
 */
import { createContext, memo, useContext } from "react"
import type { CSSProperties, ReactNode } from "react"
import { Text, View, XStack, YStack } from "@hanzo/gui"
import { Handle, Position, type NodeProps } from "@xyflow/react"

import { AlertGlyph, nodeGlyph } from "./glyphs"
import { FLOW_KIND_META } from "./pure"
import { executionColor, FLOW_THEME, MONO_FONT } from "./theme"
import type {
  FlowNodeData,
  FlowNodeExecutionStatus,
  FlowTheme,
  FlowValidationIssue,
} from "./types"

export interface FlowNodeConfigContextValue {
  theme: FlowTheme
  executionStatusByNode?: Record<string, FlowNodeExecutionStatus>
  latencyByNode?: Record<string, number>
  issuesByNode?: Record<string, FlowValidationIssue[]>
  renderIcon?: (node: FlowNodeData) => ReactNode
  reducedMotion?: boolean
  nodeWidth?: number
}

const FlowNodeConfigCtx =
  /* @__PURE__ */ createContext<FlowNodeConfigContextValue>({
    theme: "dark",
  })

export const FlowNodeConfigProvider = FlowNodeConfigCtx.Provider

export interface FlowNodeCardProps {
  data: FlowNodeData
  selected?: boolean
  theme?: FlowTheme
  executionStatus?: FlowNodeExecutionStatus
  latencyMs?: number
  issues?: FlowValidationIssue[]
  renderIcon?: (node: FlowNodeData) => ReactNode
  reducedMotion?: boolean
  width?: number
  onPress?: (node: FlowNodeData) => void
}

function primaryBadge(data: FlowNodeData): string | null {
  if (data.badge) return data.badge
  const cfg = data.config ?? {}
  if (data.kind === "agent" && cfg.model) return String(cfg.model)
  if (data.kind === "trigger") {
    if (data.subtype === "schedule" && cfg.cron) return String(cfg.cron)
    if (data.subtype === "crm_event" && cfg.eventType)
      return String(cfg.eventType)
    if (data.subtype === "webhook" && cfg.webhookPath)
      return String(cfg.webhookPath)
    return data.subtype ?? "trigger"
  }
  if (data.kind === "memory") {
    return String(cfg.embeddingModel ?? cfg.collection ?? "rag")
  }
  if (data.kind === "action") {
    if (data.subtype === "http") return String(cfg.method ?? "HTTP")
    if (data.subtype === "wait" && typeof cfg.delayMs === "number") {
      const s = Math.round(cfg.delayMs / 1000)
      return s >= 60 ? `${Math.round(s / 60)}m` : `${s}s`
    }
    return String(cfg.channel ?? data.subtype ?? "action")
  }
  if (data.kind === "condition" && cfg.expression) {
    return String(cfg.expression)
  }
  if (data.kind === "output" && cfg.channel) {
    return String(cfg.channel)
  }
  return null
}

function secondaryPreview(data: FlowNodeData): string | null {
  const cfg = data.config ?? {}
  if (data.kind === "agent" && cfg.prompt) return String(cfg.prompt)
  if (data.kind === "action" && cfg.url) return String(cfg.url)
  if (data.kind === "action" && cfg.prompt) return String(cfg.prompt)
  if (data.kind === "memory" && cfg.collection)
    return `collection: ${cfg.collection}`
  if (data.description) return data.description
  return null
}

export function FlowNodeCard({
  data,
  selected = false,
  theme = "dark",
  executionStatus = "idle",
  latencyMs,
  issues,
  renderIcon,
  reducedMotion = false,
  width = 248,
  onPress,
}: FlowNodeCardProps) {
  const t = FLOW_THEME[theme]
  const meta = FLOW_KIND_META[data.kind]
  const Glyph = nodeGlyph(data.kind, data.subtype)
  const icon = renderIcon ? renderIcon(data) : <Glyph size={14} />
  const badge = primaryBadge(data)
  const preview = secondaryPreview(data)
  const execColor = executionColor(executionStatus, t)
  const hasError = Boolean(issues?.some((i) => i.severity === "error"))
  const hasWarning = Boolean(
    !hasError && issues?.some((i) => i.severity === "warning")
  )

  const borderColor =
    executionStatus === "failed"
      ? t.statusFailed
      : executionStatus === "succeeded"
        ? t.statusSucceeded
        : executionStatus === "running"
          ? t.statusRunning
          : selected
            ? t.borderSelected
            : hasError
              ? t.statusFailed
              : t.border

  const boxShadow =
    executionStatus === "succeeded"
      ? `0 0 0 1px ${t.statusSucceeded}, ${t.shadow}`
      : executionStatus === "failed"
        ? `0 0 0 1px ${t.statusFailed}, ${t.shadow}`
        : selected
          ? t.shadowSelected
          : t.shadow

  const className =
    executionStatus === "running" && !reducedMotion
      ? "hz-flow-node hz-flow-node--running"
      : "hz-flow-node"

  return (
    <YStack
      className={className}
      width={width}
      overflow="hidden"
      onPress={onPress ? () => onPress(data) : undefined}
      style={{
        backgroundColor: t.cardBg,
        borderWidth: 1,
        borderStyle:
          executionStatus === "skipped" || data.disabled ? "dashed" : "solid",
        borderColor,
        borderRadius: 10,
        boxShadow,
        opacity: executionStatus === "skipped" || data.disabled ? 0.55 : 1,
        cursor: onPress ? "pointer" : "grab",
      }}
    >
      {/* Top header */}
      <XStack
        items="center"
        gap={8}
        px={10}
        py={9}
        style={{
          borderBottomWidth: preview ? 1 : 0,
          borderBottomStyle: "solid",
          borderBottomColor: t.border,
        }}
      >
        <YStack
          width={26}
          height={26}
          items="center"
          justify="center"
          style={{
            borderRadius: 6,
            backgroundColor: t.pillBg,
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: t.border,
            color: t.fg,
            flexShrink: 0,
          }}
        >
          <View style={{ display: "inline-flex" }}>{icon}</View>
        </YStack>

        <YStack flex={1} minW={0} gap={1}>
          <XStack items="center" justify="space-between" gap={6} minW={0}>
            <Text
              numberOfLines={1}
              style={{
                fontSize: 12.5,
                fontWeight: "600",
                color: t.fg,
                lineHeight: "16px",
              }}
            >
              {data.label}
            </Text>
            {execColor ? (
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 999,
                  backgroundColor: execColor,
                  flexShrink: 0,
                }}
              />
            ) : hasError || hasWarning ? (
              <View
                style={{
                  display: "inline-flex",
                  color: hasError ? t.statusFailed : t.statusWarning,
                  flexShrink: 0,
                }}
              >
                <AlertGlyph size={12} />
              </View>
            ) : null}
          </XStack>

          <XStack items="center" gap={6} minW={0}>
            <Text
              numberOfLines={1}
              style={{
                fontSize: 10,
                fontWeight: "500",
                color: t.fgSubtle,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                fontFamily: MONO_FONT,
                flexShrink: 0,
              }}
            >
              {meta.shortLabel}
            </Text>
            {badge ? (
              <XStack
                px={5}
                py={1}
                minW={0}
                style={{
                  borderRadius: 4,
                  backgroundColor: t.pillBg,
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderColor: t.border,
                  maxWidth: 140,
                }}
              >
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 10,
                    color: t.fgMuted,
                    fontFamily: MONO_FONT,
                  }}
                >
                  {badge}
                </Text>
              </XStack>
            ) : null}
          </XStack>
        </YStack>
      </XStack>

      {/* Body preview + execution footer */}
      {preview || latencyMs !== undefined || executionStatus !== "idle" ? (
        <YStack px={10} py={7} gap={5}>
          {preview ? (
            <Text
              numberOfLines={2}
              style={{
                fontSize: 11,
                lineHeight: "15px",
                color: t.fgMuted,
              }}
            >
              {preview}
            </Text>
          ) : null}

          {executionStatus !== "idle" || latencyMs !== undefined ? (
            <XStack items="center" justify="space-between" gap={6}>
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: MONO_FONT,
                  color: execColor ?? t.fgSubtle,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {executionStatus}
              </Text>
              {latencyMs !== undefined ? (
                <Text
                  style={{
                    fontSize: 10,
                    fontFamily: MONO_FONT,
                    color: t.fgSubtle,
                  }}
                >
                  {latencyMs}ms
                </Text>
              ) : null}
            </XStack>
          ) : null}
        </YStack>
      ) : null}
    </YStack>
  )
}

function handleStyle(theme: FlowTheme): CSSProperties {
  const t = FLOW_THEME[theme]
  return {
    width: 9,
    height: 9,
    background: t.handleBg,
    border: `1.5px solid ${t.handleBorder}`,
    borderRadius: 999,
  }
}

export const FlowCanvasNode = /* @__PURE__ */ memo(function FlowCanvasNode({
  data,
  selected,
}: NodeProps) {
  const cfg = useContext(FlowNodeConfigCtx)
  const nodeData = data as unknown as FlowNodeData
  const meta = FLOW_KIND_META[nodeData.kind]
  const t = FLOW_THEME[cfg.theme]
  const hStyle = handleStyle(cfg.theme)

  const executionStatus = cfg.executionStatusByNode?.[nodeData.id] ?? "idle"
  const latencyMs = cfg.latencyByNode?.[nodeData.id]
  const issues = cfg.issuesByNode?.[nodeData.id]

  return (
    <View style={{ position: "relative" }}>
      {meta.hasInput ? (
        <Handle type="target" id="in" position={Position.Left} style={hStyle} />
      ) : null}

      <FlowNodeCard
        data={nodeData}
        selected={selected}
        theme={cfg.theme}
        executionStatus={executionStatus}
        latencyMs={latencyMs}
        issues={issues}
        renderIcon={cfg.renderIcon}
        reducedMotion={cfg.reducedMotion}
        width={cfg.nodeWidth}
      />

      {nodeData.kind === "condition" ? (
        <>
          <Handle
            type="source"
            id="true"
            position={Position.Right}
            style={{ ...hStyle, top: "34%" }}
          />
          <Text
            style={{
              position: "absolute",
              right: 12,
              top: "26%",
              fontSize: 9,
              fontFamily: MONO_FONT,
              color: t.fgSubtle,
              pointerEvents: "none",
            }}
          >
            T
          </Text>
          <Handle
            type="source"
            id="false"
            position={Position.Right}
            style={{ ...hStyle, top: "70%" }}
          />
          <Text
            style={{
              position: "absolute",
              right: 12,
              top: "62%",
              fontSize: 9,
              fontFamily: MONO_FONT,
              color: t.fgSubtle,
              pointerEvents: "none",
            }}
          >
            F
          </Text>
        </>
      ) : meta.hasOutput ? (
        <Handle
          type="source"
          id="out"
          position={Position.Right}
          style={hStyle}
        />
      ) : null}
    </View>
  )
})

/** Stable module-level React Flow node types map (never constructed inline). */
export const FLOW_NODE_TYPES = { flowNode: FlowCanvasNode } as const
