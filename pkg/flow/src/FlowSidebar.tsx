"use client"

/**
 * Left rail for `@hanzo/flow` built strictly on `@hanzo/gui` (`#000000` OLED
 * dark / `#fafafa` light):
 *  - Active & scheduled flows list with monochrome toggle switch, schedule /
 *    trigger summary, `+ New`, and Templates selector.
 *  - Searchable, draggable AND click-to-add Node Palette grouped by category
 *    (`Triggers`, `Enso AI`, `Actions`, `Logic`, `Output`).
 */
import { useMemo, useState } from "react"
import type { DragEvent, ReactNode } from "react"
import { Text, View, XStack, YStack } from "@hanzo/gui"

import {
  ClockGlyph,
  LayersGlyph,
  nodeGlyph,
  PlusGlyph,
  SearchGlyph,
  TrashGlyph,
} from "./glyphs"
import {
  DEFAULT_FLOW_PALETTE,
  DEFAULT_FLOW_TEMPLATES,
  FLOW_PALETTE_CATEGORIES,
} from "./pure"
import { FLOW_THEME, MONO_FONT } from "./theme"
import type {
  FlowDefinition,
  FlowPaletteCategory,
  FlowPaletteItem,
  FlowTemplate,
  FlowTheme,
} from "./types"

export const FLOW_DRAG_MIME = "application/hanzo-flow-node"

export interface FlowSidebarProps {
  flows: FlowDefinition[]
  activeFlowId: string | null
  onSelectFlow: (id: string) => void
  onCreateFlow: () => void
  onCreateFromTemplate: (template: FlowTemplate) => void
  onToggleFlow: (id: string, enabled: boolean) => void
  onDeleteFlow?: (id: string) => void
  onAddNode: (item: FlowPaletteItem) => void
  palette?: readonly FlowPaletteItem[]
  templates?: readonly FlowTemplate[]
  theme?: FlowTheme
  width?: number
  footer?: ReactNode
}

function flowSubtitle(flow: FlowDefinition): string {
  if (flow.schedule?.enabled && flow.schedule.cron) {
    return flow.schedule.label ?? flow.schedule.cron
  }
  const trigger = flow.nodes.find((n) => n.kind === "trigger")
  if (trigger?.subtype === "schedule" && trigger.config?.cron) {
    return String(trigger.config.cron)
  }
  if (trigger?.subtype === "crm_event" && trigger.config?.eventType) {
    return String(trigger.config.eventType)
  }
  if (trigger?.subtype === "webhook" && trigger.config?.webhookPath) {
    return String(trigger.config.webhookPath)
  }
  return `${flow.nodes.length} nodes`
}

export function FlowSidebar({
  flows,
  activeFlowId,
  onSelectFlow,
  onCreateFlow,
  onCreateFromTemplate,
  onToggleFlow,
  onDeleteFlow,
  onAddNode,
  palette = DEFAULT_FLOW_PALETTE,
  templates = DEFAULT_FLOW_TEMPLATES,
  theme = "dark",
  width = 256,
  footer,
}: FlowSidebarProps) {
  const t = FLOW_THEME[theme]
  const [showTemplates, setShowTemplates] = useState(false)
  const [query, setQuery] = useState("")

  const groupedPalette = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q
      ? palette.filter(
          (item) =>
            item.label.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q)
        )
      : palette

    const groups = new Map<FlowPaletteCategory, FlowPaletteItem[]>()
    for (const cat of FLOW_PALETTE_CATEGORIES) groups.set(cat, [])
    for (const item of filtered) {
      const list = groups.get(item.category)
      if (list) list.push(item)
      else groups.set(item.category, [item])
    }
    return [...groups.entries()].filter(([, items]) => items.length > 0)
  }, [palette, query])

  const handleDragStart = (
    e: DragEvent<HTMLDivElement>,
    item: FlowPaletteItem
  ) => {
    e.dataTransfer.setData(FLOW_DRAG_MIME, JSON.stringify(item))
    e.dataTransfer.effectAllowed = "copy"
  }

  return (
    <YStack
      width={width}
      height="100%"
      style={{
        backgroundColor: t.railBg,
        borderRightWidth: 1,
        borderRightStyle: "solid",
        borderRightColor: t.border,
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {/* Flows section */}
      <YStack
        style={{
          borderBottomWidth: 1,
          borderBottomStyle: "solid",
          borderBottomColor: t.border,
          maxHeight: "42%",
          minHeight: 140,
        }}
      >
        <XStack
          items="center"
          justify="space-between"
          px={12}
          py={9}
          style={{
            borderBottomWidth: 1,
            borderBottomStyle: "solid",
            borderBottomColor: t.border,
            flexShrink: 0,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: "600",
              color: t.fgMuted,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Flows ({flows.length})
          </Text>

          <XStack items="center" gap={4}>
            {templates.length > 0 ? (
              <button
                type="button"
                onClick={() => setShowTemplates((v) => !v)}
                aria-expanded={showTemplates}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  height: 24,
                  padding: "0 7px",
                  borderRadius: 6,
                  border: `1px solid ${showTemplates ? t.borderStrong : t.border}`,
                  background: showTemplates ? t.pillActiveBg : "transparent",
                  color: showTemplates ? t.fg : t.fgMuted,
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                <LayersGlyph size={12} />
                <span>Templates</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={onCreateFlow}
              aria-label="New flow"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                height: 24,
                padding: "0 7px",
                borderRadius: 6,
                border: `1px solid ${t.border}`,
                background: t.pillBg,
                color: t.fg,
                fontSize: 11,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              <PlusGlyph size={12} />
              <span>New</span>
            </button>
          </XStack>
        </XStack>

        {showTemplates ? (
          <YStack p={8} gap={6} style={{ overflowY: "auto" }}>
            <Text style={{ fontSize: 11, color: t.fgSubtle, paddingLeft: 4 }}>
              Start from a template
            </Text>
            {templates.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => {
                  onCreateFromTemplate(tpl)
                  setShowTemplates(false)
                }}
                style={{
                  textAlign: "left",
                  padding: "8px 9px",
                  borderRadius: 7,
                  border: `1px solid ${t.border}`,
                  background: t.cardBg,
                  color: t.fg,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 600 }}>
                  {tpl.name}
                </span>
                <span
                  style={{ fontSize: 11, color: t.fgMuted, lineHeight: "15px" }}
                >
                  {tpl.description}
                </span>
              </button>
            ))}
          </YStack>
        ) : (
          <YStack p={6} gap={3} style={{ overflowY: "auto" }}>
            {flows.length === 0 ? (
              <Text style={{ fontSize: 12, color: t.fgSubtle, padding: 8 }}>
                No flows yet. Click New or choose a template.
              </Text>
            ) : (
              flows.map((flow) => {
                const active = flow.id === activeFlowId
                const isScheduled = Boolean(
                  flow.schedule?.enabled ||
                  flow.nodes.some(
                    (n) => n.kind === "trigger" && n.subtype === "schedule"
                  )
                )
                return (
                  <XStack
                    key={flow.id}
                    items="center"
                    gap={6}
                    px={8}
                    py={6}
                    onPress={() => onSelectFlow(flow.id)}
                    style={{
                      borderRadius: 7,
                      backgroundColor: active ? t.pillActiveBg : "transparent",
                      borderWidth: 1,
                      borderStyle: "solid",
                      borderColor: active ? t.borderStrong : "transparent",
                      cursor: "pointer",
                    }}
                  >
                    <YStack flex={1} minW={0} gap={2}>
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: 12,
                          fontWeight: active ? "600" : "500",
                          color: active ? t.fg : t.fgMuted,
                        }}
                      >
                        {flow.name}
                      </Text>
                      <XStack items="center" gap={4} minW={0}>
                        {isScheduled ? (
                          <View
                            style={{
                              display: "inline-flex",
                              color: t.fgSubtle,
                            }}
                          >
                            <ClockGlyph size={10} />
                          </View>
                        ) : null}
                        <Text
                          numberOfLines={1}
                          style={{
                            fontSize: 10.5,
                            color: t.fgSubtle,
                            fontFamily: MONO_FONT,
                          }}
                        >
                          {flowSubtitle(flow)}
                        </Text>
                      </XStack>
                    </YStack>

                    {/* Monochrome active toggle switch */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={flow.enabled}
                      aria-label={`Toggle ${flow.name}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleFlow(flow.id, !flow.enabled)
                      }}
                      style={{
                        width: 28,
                        height: 16,
                        borderRadius: 999,
                        border: `1px solid ${flow.enabled ? t.fg : t.borderStrong}`,
                        background: flow.enabled ? t.fg : "transparent",
                        padding: 2,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: flow.enabled
                          ? "flex-end"
                          : "flex-start",
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 999,
                          background: flow.enabled ? t.primaryFg : t.fgMuted,
                        }}
                      />
                    </button>

                    {onDeleteFlow && flows.length > 1 ? (
                      <button
                        type="button"
                        aria-label={`Delete ${flow.name}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteFlow(flow.id)
                        }}
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 5,
                          border: "none",
                          background: "transparent",
                          color: t.fgSubtle,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          flexShrink: 0,
                        }}
                      >
                        <TrashGlyph size={12} />
                      </button>
                    ) : null}
                  </XStack>
                )
              })
            )}
          </YStack>
        )}
      </YStack>

      {/* Node Palette section */}
      <YStack flex={1} minH={0}>
        <YStack
          px={12}
          py={8}
          gap={6}
          style={{
            borderBottomWidth: 1,
            borderBottomStyle: "solid",
            borderBottomColor: t.border,
            flexShrink: 0,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: "600",
              color: t.fgMuted,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Nodes
          </Text>
          <XStack
            items="center"
            gap={6}
            px={8}
            style={{
              height: 28,
              borderRadius: 6,
              backgroundColor: t.inputBg,
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: t.border,
            }}
          >
            <View style={{ display: "inline-flex", color: t.fgSubtle }}>
              <SearchGlyph size={12} />
            </View>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter nodes..."
              aria-label="Filter palette nodes"
              style={{
                flex: 1,
                minWidth: 0,
                background: "transparent",
                border: "none",
                outline: "none",
                color: t.fg,
                fontSize: 12,
              }}
            />
          </XStack>
        </YStack>

        <YStack flex={1} p={8} gap={12} style={{ overflowY: "auto" }}>
          {groupedPalette.map(([category, items]) => (
            <YStack key={category} gap={4}>
              <Text
                style={{
                  fontSize: 10.5,
                  fontWeight: "600",
                  color: t.fgSubtle,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  paddingLeft: 4,
                }}
              >
                {category}
              </Text>
              {items.map((item) => {
                const Glyph = nodeGlyph(item.kind, item.subtype)
                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    onClick={() => onAddNode(item)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        onAddNode(item)
                      }
                    }}
                    title={`${item.label} — click or drag onto canvas`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 8px",
                      borderRadius: 7,
                      border: `1px solid ${t.border}`,
                      background: t.cardBg,
                      cursor: "grab",
                    }}
                  >
                    <span
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 5,
                        background: t.pillBg,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: t.fg,
                        flexShrink: 0,
                      }}
                    >
                      <Glyph size={13} />
                    </span>
                    <span
                      style={{
                        flex: 1,
                        minWidth: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: t.fg,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.label}
                      </span>
                      <span
                        style={{
                          fontSize: 10.5,
                          color: t.fgSubtle,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.description}
                      </span>
                    </span>
                  </div>
                )
              })}
            </YStack>
          ))}
        </YStack>
      </YStack>

      {footer ? (
        <YStack
          p={10}
          style={{
            borderTopWidth: 1,
            borderTopStyle: "solid",
            borderTopColor: t.border,
            flexShrink: 0,
          }}
        >
          {footer}
        </YStack>
      ) : null}
    </YStack>
  )
}
