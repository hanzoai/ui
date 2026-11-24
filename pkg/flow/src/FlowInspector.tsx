"use client"

/**
 * Right-side inspector drawer for `@hanzo/flow`, built on `@hanzo/gui`.
 * Two tabs:
 *  - `Config`: edit selected node properties (label, description, Enso/Zen
 *    model, prompt/template, action config, schedule cron, delete node) OR
 *    flow-level settings & schedule when no node is selected.
 *  - `Run & Trace`: execute the flow with custom JSON/text input and inspect
 *    step-by-step execution timing, inputs, outputs, and recent run history.
 */
import { useState } from "react"
import type { CSSProperties } from "react"
import { Text, View, XStack, YStack } from "@hanzo/gui"

import { AlertGlyph, nodeGlyph, PlayGlyph, TrashGlyph } from "./glyphs"
import { EMBEDDING_MODELS, ENSO_MODELS, FLOW_KIND_META } from "./pure"
import { executionColor, FLOW_THEME, MONO_FONT } from "./theme"
import type {
  FlowDefinition,
  FlowEmbeddingModel,
  FlowEnsoModel,
  FlowNodeConfig,
  FlowNodeData,
  FlowRun,
  FlowTheme,
  FlowValidationResult,
} from "./types"

export type FlowInspectorTab = "config" | "run"

export interface FlowInspectorProps {
  flow: FlowDefinition
  selectedNode: FlowNodeData | null
  onUpdateNode: (nodeId: string, patch: Partial<FlowNodeData>) => void
  onDeleteNode: (nodeId: string) => void
  onUpdateFlow: (patch: Partial<FlowDefinition>) => void
  onSelectNode?: (nodeId: string | null) => void
  validation?: FlowValidationResult
  runs?: FlowRun[]
  activeRun?: FlowRun | null
  onSelectRun?: (run: FlowRun) => void
  onRunFlow: (input: unknown) => Promise<void> | void
  isRunning?: boolean
  activeTab?: FlowInspectorTab
  onTabChange?: (tab: FlowInspectorTab) => void
  models?: readonly FlowEnsoModel[]
  embeddingModels?: readonly FlowEmbeddingModel[]
  theme?: FlowTheme
  width?: number
}

function fieldInputStyle(theme: FlowTheme, mono = false): CSSProperties {
  const t = FLOW_THEME[theme]
  return {
    width: "100%",
    padding: "6px 8px",
    borderRadius: 6,
    border: `1px solid ${t.border}`,
    background: t.inputBg,
    color: t.fg,
    fontSize: 12,
    lineHeight: "17px",
    fontFamily: mono ? MONO_FONT : "inherit",
  }
}

function formatJson(val: unknown): string {
  if (val === undefined) return "—"
  if (typeof val === "string") return val
  try {
    return JSON.stringify(val, null, 2)
  } catch {
    return String(val)
  }
}

function parseRunInput(raw: string): unknown {
  const trimmed = raw.trim()
  if (!trimmed) return {}
  try {
    return JSON.parse(trimmed)
  } catch {
    return trimmed
  }
}

export function FlowInspector({
  flow,
  selectedNode,
  onUpdateNode,
  onDeleteNode,
  onUpdateFlow,
  onSelectNode,
  validation,
  runs = [],
  activeRun = null,
  onSelectRun,
  onRunFlow,
  isRunning = false,
  activeTab,
  onTabChange,
  models = ENSO_MODELS,
  embeddingModels = EMBEDDING_MODELS,
  theme = "dark",
  width = 312,
}: FlowInspectorProps) {
  const t = FLOW_THEME[theme]
  const [internalTab, setInternalTab] = useState<FlowInspectorTab>("config")
  const [runInputText, setRunInputText] = useState(
    '{\n  "name": "Alex Rivera",\n  "email": "alex@example.com",\n  "phone": "+15550109999",\n  "score": 88\n}'
  )
  const [expandedStep, setExpandedStep] = useState<string | null>(null)

  const tab = activeTab ?? internalTab
  const setTab = (next: FlowInspectorTab) => {
    setInternalTab(next)
    onTabChange?.(next)
  }

  const updateConfig = (patch: Partial<FlowNodeConfig>) => {
    if (!selectedNode) return
    onUpdateNode(selectedNode.id, {
      config: { ...(selectedNode.config ?? {}), ...patch },
    })
  }

  const nodeIssues = selectedNode
    ? (validation?.issues ?? []).filter((i) => i.nodeId === selectedNode.id)
    : []

  const displayedRun = activeRun ?? runs[0] ?? null
  const inputStyle = fieldInputStyle(theme)
  const monoInputStyle = fieldInputStyle(theme, true)

  return (
    <YStack
      width={width}
      height="100%"
      style={{
        backgroundColor: t.railBg,
        borderLeftWidth: 1,
        borderLeftStyle: "solid",
        borderLeftColor: t.border,
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {/* Tab bar */}
      <XStack
        p={6}
        gap={4}
        style={{
          borderBottomWidth: 1,
          borderBottomStyle: "solid",
          borderBottomColor: t.border,
          flexShrink: 0,
        }}
      >
        {(
          [
            {
              id: "config",
              label: selectedNode ? "Node Config" : "Flow Config",
            },
            { id: "run", label: "Run & Trace" },
          ] as const
        ).map((item) => {
          const on = tab === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              style={{
                flex: 1,
                height: 28,
                borderRadius: 6,
                border: `1px solid ${on ? t.borderStrong : "transparent"}`,
                background: on ? t.pillActiveBg : "transparent",
                color: on ? t.fg : t.fgMuted,
                fontSize: 11.5,
                fontWeight: on ? 600 : 500,
                cursor: "pointer",
              }}
            >
              {item.label}
            </button>
          )
        })}
      </XStack>

      {/* Body */}
      <YStack flex={1} p={12} gap={12} style={{ overflowY: "auto" }}>
        {tab === "config" ? (
          selectedNode ? (
            <>
              {/* Selected node header */}
              <XStack items="center" justify="space-between" gap={8}>
                <XStack items="center" gap={8} minW={0} flex={1}>
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
                    {(() => {
                      const Glyph = nodeGlyph(
                        selectedNode.kind,
                        selectedNode.subtype
                      )
                      return <Glyph size={14} />
                    })()}
                  </YStack>
                  <YStack minW={0} flex={1}>
                    <Text
                      numberOfLines={1}
                      style={{ fontSize: 12.5, fontWeight: "600", color: t.fg }}
                    >
                      {selectedNode.label}
                    </Text>
                    <Text
                      style={{
                        fontSize: 10.5,
                        color: t.fgSubtle,
                        fontFamily: MONO_FONT,
                      }}
                    >
                      {FLOW_KIND_META[selectedNode.kind].label}
                      {selectedNode.subtype ? ` · ${selectedNode.subtype}` : ""}
                    </Text>
                  </YStack>
                </XStack>

                <button
                  type="button"
                  onClick={() => onDeleteNode(selectedNode.id)}
                  aria-label="Delete node"
                  title="Delete node"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    border: `1px solid ${t.border}`,
                    background: "transparent",
                    color: t.fgMuted,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  <TrashGlyph size={13} />
                </button>
              </XStack>

              {/* Node label */}
              <YStack gap={4}>
                <Text
                  style={{ fontSize: 11, color: t.fgMuted, fontWeight: "500" }}
                >
                  Label
                </Text>
                <input
                  className="hz-flow-input"
                  type="text"
                  value={selectedNode.label}
                  onChange={(e) =>
                    onUpdateNode(selectedNode.id, { label: e.target.value })
                  }
                  style={inputStyle}
                />
              </YStack>

              {/* Node description */}
              <YStack gap={4}>
                <Text
                  style={{ fontSize: 11, color: t.fgMuted, fontWeight: "500" }}
                >
                  Description
                </Text>
                <textarea
                  className="hz-flow-input"
                  rows={2}
                  value={selectedNode.description ?? ""}
                  onChange={(e) =>
                    onUpdateNode(selectedNode.id, {
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe what this step does..."
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </YStack>

              {/* Agent fields */}
              {selectedNode.kind === "agent" ? (
                <>
                  <YStack gap={4}>
                    <Text
                      style={{
                        fontSize: 11,
                        color: t.fgMuted,
                        fontWeight: "500",
                      }}
                    >
                      Model
                    </Text>
                    <select
                      className="hz-flow-input"
                      value={selectedNode.config?.model ?? "enso"}
                      onChange={(e) => updateConfig({ model: e.target.value })}
                      style={monoInputStyle}
                    >
                      {models.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </YStack>

                  <YStack gap={4}>
                    <Text
                      style={{
                        fontSize: 11,
                        color: t.fgMuted,
                        fontWeight: "500",
                      }}
                    >
                      Prompt / Instructions
                    </Text>
                    <textarea
                      className="hz-flow-input"
                      rows={5}
                      value={selectedNode.config?.prompt ?? ""}
                      onChange={(e) => updateConfig({ prompt: e.target.value })}
                      placeholder="Write instructions using {{input}} placeholders..."
                      style={{ ...monoInputStyle, resize: "vertical" }}
                    />
                  </YStack>

                  <YStack gap={4}>
                    <Text
                      style={{
                        fontSize: 11,
                        color: t.fgMuted,
                        fontWeight: "500",
                      }}
                    >
                      System Prompt (optional)
                    </Text>
                    <textarea
                      className="hz-flow-input"
                      rows={2}
                      value={selectedNode.config?.systemPrompt ?? ""}
                      onChange={(e) =>
                        updateConfig({ systemPrompt: e.target.value })
                      }
                      placeholder="Role or policy constraints..."
                      style={{ ...inputStyle, resize: "vertical" }}
                    />
                  </YStack>
                </>
              ) : null}

              {/* Trigger fields */}
              {selectedNode.kind === "trigger" ? (
                <>
                  <YStack gap={4}>
                    <Text
                      style={{
                        fontSize: 11,
                        color: t.fgMuted,
                        fontWeight: "500",
                      }}
                    >
                      Trigger Type
                    </Text>
                    <select
                      className="hz-flow-input"
                      value={selectedNode.subtype ?? "webhook"}
                      onChange={(e) =>
                        onUpdateNode(selectedNode.id, {
                          subtype: e.target.value,
                        })
                      }
                      style={inputStyle}
                    >
                      <option value="webhook">Webhook (/v1)</option>
                      <option value="schedule">Schedule (Cron)</option>
                      <option value="crm_event">CRM Event</option>
                      <option value="manual">Manual</option>
                    </select>
                  </YStack>

                  {selectedNode.subtype === "schedule" ? (
                    <>
                      <YStack gap={4}>
                        <Text
                          style={{
                            fontSize: 11,
                            color: t.fgMuted,
                            fontWeight: "500",
                          }}
                        >
                          Cron Expression
                        </Text>
                        <input
                          className="hz-flow-input"
                          type="text"
                          value={selectedNode.config?.cron ?? ""}
                          onChange={(e) =>
                            updateConfig({ cron: e.target.value })
                          }
                          placeholder="0 9 * * 1-5"
                          style={monoInputStyle}
                        />
                      </YStack>
                      <YStack gap={4}>
                        <Text
                          style={{
                            fontSize: 11,
                            color: t.fgMuted,
                            fontWeight: "500",
                          }}
                        >
                          Timezone
                        </Text>
                        <input
                          className="hz-flow-input"
                          type="text"
                          value={selectedNode.config?.timezone ?? "UTC"}
                          onChange={(e) =>
                            updateConfig({ timezone: e.target.value })
                          }
                          placeholder="America/Los_Angeles"
                          style={monoInputStyle}
                        />
                      </YStack>
                    </>
                  ) : null}

                  {selectedNode.subtype === "webhook" ? (
                    <YStack gap={4}>
                      <Text
                        style={{
                          fontSize: 11,
                          color: t.fgMuted,
                          fontWeight: "500",
                        }}
                      >
                        Webhook Path
                      </Text>
                      <input
                        className="hz-flow-input"
                        type="text"
                        value={selectedNode.config?.webhookPath ?? ""}
                        onChange={(e) =>
                          updateConfig({ webhookPath: e.target.value })
                        }
                        placeholder="/v1/hooks/inbound"
                        style={monoInputStyle}
                      />
                    </YStack>
                  ) : null}

                  {selectedNode.subtype === "crm_event" ? (
                    <YStack gap={4}>
                      <Text
                        style={{
                          fontSize: 11,
                          color: t.fgMuted,
                          fontWeight: "500",
                        }}
                      >
                        Event Name
                      </Text>
                      <input
                        className="hz-flow-input"
                        type="text"
                        value={selectedNode.config?.eventType ?? ""}
                        onChange={(e) =>
                          updateConfig({ eventType: e.target.value })
                        }
                        placeholder="lead.created"
                        style={monoInputStyle}
                      />
                    </YStack>
                  ) : null}
                </>
              ) : null}

              {/* Action fields */}
              {selectedNode.kind === "action" ? (
                <>
                  <YStack gap={4}>
                    <Text
                      style={{
                        fontSize: 11,
                        color: t.fgMuted,
                        fontWeight: "500",
                      }}
                    >
                      Action Kind
                    </Text>
                    <select
                      className="hz-flow-input"
                      value={selectedNode.subtype ?? "http"}
                      onChange={(e) =>
                        onUpdateNode(selectedNode.id, {
                          subtype: e.target.value,
                        })
                      }
                      style={inputStyle}
                    >
                      <option value="sms">Send SMS</option>
                      <option value="voice_call">Voice Call</option>
                      <option value="email">Send Email</option>
                      <option value="http">HTTP Request</option>
                      <option value="wait">Wait / Delay</option>
                      <option value="crm_update">CRM Update</option>
                    </select>
                  </YStack>

                  {selectedNode.subtype === "http" ? (
                    <>
                      <XStack gap={6}>
                        <YStack gap={4} width={88}>
                          <Text
                            style={{
                              fontSize: 11,
                              color: t.fgMuted,
                              fontWeight: "500",
                            }}
                          >
                            Method
                          </Text>
                          <select
                            className="hz-flow-input"
                            value={selectedNode.config?.method ?? "POST"}
                            onChange={(e) =>
                              updateConfig({
                                method: e.target
                                  .value as FlowNodeConfig["method"],
                              })
                            }
                            style={monoInputStyle}
                          >
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="PATCH">PATCH</option>
                            <option value="DELETE">DELETE</option>
                          </select>
                        </YStack>
                        <YStack gap={4} flex={1} minW={0}>
                          <Text
                            style={{
                              fontSize: 11,
                              color: t.fgMuted,
                              fontWeight: "500",
                            }}
                          >
                            URL
                          </Text>
                          <input
                            className="hz-flow-input"
                            type="text"
                            value={selectedNode.config?.url ?? ""}
                            onChange={(e) =>
                              updateConfig({ url: e.target.value })
                            }
                            placeholder="https://api.hanzo.ai/v1/..."
                            style={monoInputStyle}
                          />
                        </YStack>
                      </XStack>
                      <YStack gap={4}>
                        <Text
                          style={{
                            fontSize: 11,
                            color: t.fgMuted,
                            fontWeight: "500",
                          }}
                        >
                          Body Template
                        </Text>
                        <textarea
                          className="hz-flow-input"
                          rows={3}
                          value={selectedNode.config?.body ?? ""}
                          onChange={(e) =>
                            updateConfig({ body: e.target.value })
                          }
                          style={{ ...monoInputStyle, resize: "vertical" }}
                        />
                      </YStack>
                    </>
                  ) : selectedNode.subtype === "wait" ? (
                    <YStack gap={4}>
                      <Text
                        style={{
                          fontSize: 11,
                          color: t.fgMuted,
                          fontWeight: "500",
                        }}
                      >
                        Delay (ms)
                      </Text>
                      <input
                        className="hz-flow-input"
                        type="number"
                        min={0}
                        value={selectedNode.config?.delayMs ?? 0}
                        onChange={(e) =>
                          updateConfig({ delayMs: Number(e.target.value) || 0 })
                        }
                        style={monoInputStyle}
                      />
                    </YStack>
                  ) : selectedNode.subtype === "crm_update" ? (
                    <>
                      <YStack gap={4}>
                        <Text
                          style={{
                            fontSize: 11,
                            color: t.fgMuted,
                            fontWeight: "500",
                          }}
                        >
                          Field
                        </Text>
                        <input
                          className="hz-flow-input"
                          type="text"
                          value={selectedNode.config?.field ?? ""}
                          onChange={(e) =>
                            updateConfig({ field: e.target.value })
                          }
                          placeholder="stage"
                          style={monoInputStyle}
                        />
                      </YStack>
                      <YStack gap={4}>
                        <Text
                          style={{
                            fontSize: 11,
                            color: t.fgMuted,
                            fontWeight: "500",
                          }}
                        >
                          Value
                        </Text>
                        <input
                          className="hz-flow-input"
                          type="text"
                          value={selectedNode.config?.value ?? ""}
                          onChange={(e) =>
                            updateConfig({ value: e.target.value })
                          }
                          placeholder="qualified"
                          style={monoInputStyle}
                        />
                      </YStack>
                    </>
                  ) : (
                    <>
                      <YStack gap={4}>
                        <Text
                          style={{
                            fontSize: 11,
                            color: t.fgMuted,
                            fontWeight: "500",
                          }}
                        >
                          Recipient (`to`)
                        </Text>
                        <input
                          className="hz-flow-input"
                          type="text"
                          value={selectedNode.config?.to ?? ""}
                          onChange={(e) => updateConfig({ to: e.target.value })}
                          placeholder="{{input.email}} or {{input.phone}}"
                          style={monoInputStyle}
                        />
                      </YStack>
                      {selectedNode.subtype === "email" ? (
                        <YStack gap={4}>
                          <Text
                            style={{
                              fontSize: 11,
                              color: t.fgMuted,
                              fontWeight: "500",
                            }}
                          >
                            Subject
                          </Text>
                          <input
                            className="hz-flow-input"
                            type="text"
                            value={selectedNode.config?.subject ?? ""}
                            onChange={(e) =>
                              updateConfig({ subject: e.target.value })
                            }
                            style={inputStyle}
                          />
                        </YStack>
                      ) : null}
                      <YStack gap={4}>
                        <Text
                          style={{
                            fontSize: 11,
                            color: t.fgMuted,
                            fontWeight: "500",
                          }}
                        >
                          Message / Script Template
                        </Text>
                        <textarea
                          className="hz-flow-input"
                          rows={4}
                          value={selectedNode.config?.prompt ?? ""}
                          onChange={(e) =>
                            updateConfig({ prompt: e.target.value })
                          }
                          style={{ ...monoInputStyle, resize: "vertical" }}
                        />
                      </YStack>
                    </>
                  )}
                </>
              ) : null}

              {/* Condition fields */}
              {selectedNode.kind === "condition" ? (
                <>
                  <YStack gap={4}>
                    <Text
                      style={{
                        fontSize: 11,
                        color: t.fgMuted,
                        fontWeight: "500",
                      }}
                    >
                      Expression
                    </Text>
                    <input
                      className="hz-flow-input"
                      type="text"
                      value={selectedNode.config?.expression ?? ""}
                      onChange={(e) =>
                        updateConfig({ expression: e.target.value })
                      }
                      placeholder="score >= 70 or contains:qualified"
                      style={monoInputStyle}
                    />
                    <Text style={{ fontSize: 10.5, color: t.fgSubtle }}>
                      Supports comparisons (`score &gt;= 70`), `contains:word`,
                      `equals:val`, or field paths.
                    </Text>
                  </YStack>
                  <XStack gap={6}>
                    <YStack gap={4} flex={1}>
                      <Text
                        style={{
                          fontSize: 11,
                          color: t.fgMuted,
                          fontWeight: "500",
                        }}
                      >
                        True Branch Label
                      </Text>
                      <input
                        className="hz-flow-input"
                        type="text"
                        value={selectedNode.config?.trueLabel ?? "True"}
                        onChange={(e) =>
                          updateConfig({ trueLabel: e.target.value })
                        }
                        style={inputStyle}
                      />
                    </YStack>
                    <YStack gap={4} flex={1}>
                      <Text
                        style={{
                          fontSize: 11,
                          color: t.fgMuted,
                          fontWeight: "500",
                        }}
                      >
                        False Branch Label
                      </Text>
                      <input
                        className="hz-flow-input"
                        type="text"
                        value={selectedNode.config?.falseLabel ?? "False"}
                        onChange={(e) =>
                          updateConfig({ falseLabel: e.target.value })
                        }
                        style={inputStyle}
                      />
                    </YStack>
                  </XStack>
                </>
              ) : null}

              {/* Memory / RAG fields */}
              {selectedNode.kind === "memory" ? (
                <>
                  <YStack gap={4}>
                    <Text
                      style={{
                        fontSize: 11,
                        color: t.fgMuted,
                        fontWeight: "500",
                      }}
                    >
                      Collection
                    </Text>
                    <input
                      className="hz-flow-input"
                      type="text"
                      value={selectedNode.config?.collection ?? ""}
                      onChange={(e) =>
                        updateConfig({ collection: e.target.value })
                      }
                      placeholder="workspace-knowledge"
                      style={monoInputStyle}
                    />
                  </YStack>
                  <XStack gap={6}>
                    <YStack gap={4} flex={1}>
                      <Text
                        style={{
                          fontSize: 11,
                          color: t.fgMuted,
                          fontWeight: "500",
                        }}
                      >
                        Embedding Model
                      </Text>
                      <select
                        className="hz-flow-input"
                        value={
                          selectedNode.config?.embeddingModel ??
                          "zen-embedding-3"
                        }
                        onChange={(e) =>
                          updateConfig({ embeddingModel: e.target.value })
                        }
                        style={monoInputStyle}
                      >
                        {embeddingModels.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </YStack>
                    <YStack gap={4} width={72}>
                      <Text
                        style={{
                          fontSize: 11,
                          color: t.fgMuted,
                          fontWeight: "500",
                        }}
                      >
                        Top-K
                      </Text>
                      <input
                        className="hz-flow-input"
                        type="number"
                        min={1}
                        max={50}
                        value={selectedNode.config?.topK ?? 5}
                        onChange={(e) =>
                          updateConfig({
                            topK: Math.max(1, Number(e.target.value) || 1),
                          })
                        }
                        style={monoInputStyle}
                      />
                    </YStack>
                  </XStack>
                  <YStack gap={4}>
                    <Text
                      style={{
                        fontSize: 11,
                        color: t.fgMuted,
                        fontWeight: "500",
                      }}
                    >
                      Query Template
                    </Text>
                    <textarea
                      className="hz-flow-input"
                      rows={3}
                      value={selectedNode.config?.prompt ?? ""}
                      onChange={(e) => updateConfig({ prompt: e.target.value })}
                      style={{ ...monoInputStyle, resize: "vertical" }}
                    />
                  </YStack>
                </>
              ) : null}

              {/* Output fields */}
              {selectedNode.kind === "output" ? (
                <>
                  <YStack gap={4}>
                    <Text
                      style={{
                        fontSize: 11,
                        color: t.fgMuted,
                        fontWeight: "500",
                      }}
                    >
                      Output Channel
                    </Text>
                    <select
                      className="hz-flow-input"
                      value={selectedNode.config?.channel ?? "notify"}
                      onChange={(e) =>
                        updateConfig({ channel: e.target.value })
                      }
                      style={inputStyle}
                    >
                      <option value="notify">In-App Notify</option>
                      <option value="webhook">Webhook</option>
                      <option value="email">Email</option>
                      <option value="slack">Slack</option>
                    </select>
                  </YStack>
                  <YStack gap={4}>
                    <Text
                      style={{
                        fontSize: 11,
                        color: t.fgMuted,
                        fontWeight: "500",
                      }}
                    >
                      Subject / Title
                    </Text>
                    <input
                      className="hz-flow-input"
                      type="text"
                      value={selectedNode.config?.subject ?? ""}
                      onChange={(e) =>
                        updateConfig({ subject: e.target.value })
                      }
                      style={inputStyle}
                    />
                  </YStack>
                  <YStack gap={4}>
                    <Text
                      style={{
                        fontSize: 11,
                        color: t.fgMuted,
                        fontWeight: "500",
                      }}
                    >
                      Output Template
                    </Text>
                    <textarea
                      className="hz-flow-input"
                      rows={3}
                      value={selectedNode.config?.prompt ?? ""}
                      onChange={(e) => updateConfig({ prompt: e.target.value })}
                      style={{ ...monoInputStyle, resize: "vertical" }}
                    />
                  </YStack>
                </>
              ) : null}

              {/* Inline node validation issues */}
              {nodeIssues.length > 0 ? (
                <YStack
                  p={8}
                  gap={4}
                  style={{
                    borderRadius: 7,
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderColor: t.borderStrong,
                    backgroundColor: t.cardBg,
                  }}
                >
                  {nodeIssues.map((issue, idx) => (
                    <XStack key={idx} items="flex-start" gap={6}>
                      <View
                        style={{
                          display: "inline-flex",
                          marginTop: 2,
                          color:
                            issue.severity === "error"
                              ? t.statusFailed
                              : t.statusWarning,
                        }}
                      >
                        <AlertGlyph size={12} />
                      </View>
                      <Text style={{ fontSize: 11, color: t.fgMuted, flex: 1 }}>
                        {issue.message}
                      </Text>
                    </XStack>
                  ))}
                </YStack>
              ) : null}
            </>
          ) : (
            /* Flow-level settings when no node is selected */
            <>
              <YStack gap={4}>
                <Text
                  style={{ fontSize: 11, color: t.fgMuted, fontWeight: "500" }}
                >
                  Flow Name
                </Text>
                <input
                  className="hz-flow-input"
                  type="text"
                  value={flow.name}
                  onChange={(e) => onUpdateFlow({ name: e.target.value })}
                  style={inputStyle}
                />
              </YStack>

              <YStack gap={4}>
                <Text
                  style={{ fontSize: 11, color: t.fgMuted, fontWeight: "500" }}
                >
                  Description
                </Text>
                <textarea
                  className="hz-flow-input"
                  rows={3}
                  value={flow.description ?? ""}
                  onChange={(e) =>
                    onUpdateFlow({ description: e.target.value })
                  }
                  placeholder="Describe this workflow..."
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </YStack>

              {/* Schedule config */}
              <YStack
                p={10}
                gap={8}
                style={{
                  borderRadius: 8,
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderColor: t.border,
                  backgroundColor: t.cardBg,
                }}
              >
                <XStack items="center" justify="space-between">
                  <Text
                    style={{ fontSize: 11.5, fontWeight: "600", color: t.fg }}
                  >
                    Schedule
                  </Text>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={Boolean(flow.schedule?.enabled)}
                    onClick={() =>
                      onUpdateFlow({
                        schedule: {
                          cron: flow.schedule?.cron ?? "0 9 * * 1-5",
                          timezone: flow.schedule?.timezone ?? "UTC",
                          label: flow.schedule?.label,
                          enabled: !flow.schedule?.enabled,
                        },
                      })
                    }
                    style={{
                      width: 30,
                      height: 17,
                      borderRadius: 999,
                      border: `1px solid ${flow.schedule?.enabled ? t.fg : t.borderStrong}`,
                      background: flow.schedule?.enabled ? t.fg : "transparent",
                      padding: 2,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: flow.schedule?.enabled
                        ? "flex-end"
                        : "flex-start",
                      cursor: "pointer",
                    }}
                  >
                    <span
                      style={{
                        width: 11,
                        height: 11,
                        borderRadius: 999,
                        background: flow.schedule?.enabled
                          ? t.primaryFg
                          : t.fgMuted,
                      }}
                    />
                  </button>
                </XStack>

                <YStack gap={4}>
                  <Text style={{ fontSize: 11, color: t.fgMuted }}>Cron</Text>
                  <input
                    className="hz-flow-input"
                    type="text"
                    value={flow.schedule?.cron ?? ""}
                    onChange={(e) =>
                      onUpdateFlow({
                        schedule: {
                          cron: e.target.value,
                          timezone: flow.schedule?.timezone ?? "UTC",
                          enabled: flow.schedule?.enabled ?? true,
                          label: flow.schedule?.label,
                        },
                      })
                    }
                    placeholder="0 9 * * 1-5"
                    style={monoInputStyle}
                  />
                </YStack>

                <YStack gap={4}>
                  <Text style={{ fontSize: 11, color: t.fgMuted }}>
                    Timezone
                  </Text>
                  <input
                    className="hz-flow-input"
                    type="text"
                    value={flow.schedule?.timezone ?? "UTC"}
                    onChange={(e) =>
                      onUpdateFlow({
                        schedule: {
                          cron: flow.schedule?.cron ?? "0 9 * * 1-5",
                          timezone: e.target.value,
                          enabled: flow.schedule?.enabled ?? true,
                          label: flow.schedule?.label,
                        },
                      })
                    }
                    placeholder="UTC"
                    style={monoInputStyle}
                  />
                </YStack>
              </YStack>

              {/* Validation summary */}
              {validation && validation.issues.length > 0 ? (
                <YStack gap={6}>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "600",
                      color: t.fgMuted,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Graph Checks ({validation.issues.length})
                  </Text>
                  {validation.issues.map((issue, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        issue.nodeId && onSelectNode?.(issue.nodeId)
                      }
                      style={{
                        textAlign: "left",
                        padding: "7px 9px",
                        borderRadius: 7,
                        border: `1px solid ${t.border}`,
                        background: t.cardBg,
                        color: t.fgMuted,
                        fontSize: 11.5,
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 6,
                        cursor: issue.nodeId ? "pointer" : "default",
                      }}
                    >
                      <span
                        style={{
                          marginTop: 2,
                          color:
                            issue.severity === "error"
                              ? t.statusFailed
                              : t.statusWarning,
                          flexShrink: 0,
                        }}
                      >
                        <AlertGlyph size={12} />
                      </span>
                      <span>{issue.message}</span>
                    </button>
                  ))}
                </YStack>
              ) : (
                <Text style={{ fontSize: 11.5, color: t.fgSubtle }}>
                  Click any node on the canvas to configure its model, prompt,
                  or action parameters.
                </Text>
              )}
            </>
          )
        ) : (
          /* Run & Trace tab */
          <>
            <YStack gap={4}>
              <Text
                style={{ fontSize: 11, color: t.fgMuted, fontWeight: "500" }}
              >
                Run Input (JSON or plain text)
              </Text>
              <textarea
                className="hz-flow-input"
                rows={5}
                value={runInputText}
                onChange={(e) => setRunInputText(e.target.value)}
                style={{ ...monoInputStyle, resize: "vertical" }}
              />
            </YStack>

            <button
              type="button"
              disabled={isRunning}
              onClick={() => void onRunFlow(parseRunInput(runInputText))}
              style={{
                height: 32,
                borderRadius: 7,
                border: "none",
                background: t.primaryBg,
                color: t.primaryFg,
                fontSize: 12,
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                cursor: isRunning ? "wait" : "pointer",
                opacity: isRunning ? 0.65 : 1,
              }}
            >
              <PlayGlyph size={12} />
              <span>{isRunning ? "Running..." : "Execute Flow"}</span>
            </button>

            {displayedRun ? (
              <YStack gap={8}>
                {/* Run summary */}
                <YStack
                  p={9}
                  gap={4}
                  style={{
                    borderRadius: 8,
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderColor: t.border,
                    backgroundColor: t.cardBg,
                  }}
                >
                  <XStack items="center" justify="space-between">
                    <XStack items="center" gap={6}>
                      <View
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: 999,
                          backgroundColor:
                            executionColor(displayedRun.status, t) ?? t.fgMuted,
                        }}
                      />
                      <Text
                        style={{
                          fontSize: 11.5,
                          fontWeight: "600",
                          color: t.fg,
                          textTransform: "uppercase",
                          fontFamily: MONO_FONT,
                        }}
                      >
                        {displayedRun.status}
                      </Text>
                    </XStack>
                    <Text
                      style={{
                        fontSize: 11,
                        color: t.fgSubtle,
                        fontFamily: MONO_FONT,
                      }}
                    >
                      {displayedRun.durationMs}ms · {displayedRun.steps.length}{" "}
                      steps
                    </Text>
                  </XStack>

                  {displayedRun.error ? (
                    <Text style={{ fontSize: 11, color: t.statusFailed }}>
                      {displayedRun.error}
                    </Text>
                  ) : null}
                </YStack>

                {/* Step trace */}
                <YStack gap={4}>
                  <Text
                    style={{
                      fontSize: 10.5,
                      fontWeight: "600",
                      color: t.fgSubtle,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Execution Trace
                  </Text>
                  {displayedRun.steps.map((step) => {
                    const expanded = expandedStep === step.nodeId
                    const dotColor =
                      executionColor(
                        step.status === "pending" ? "idle" : step.status,
                        t
                      ) ?? t.fgSubtle
                    return (
                      <YStack
                        key={step.nodeId}
                        style={{
                          borderRadius: 7,
                          borderWidth: 1,
                          borderStyle: "solid",
                          borderColor: expanded ? t.borderStrong : t.border,
                          backgroundColor: t.cardBg,
                          overflow: "hidden",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setExpandedStep(expanded ? null : step.nodeId)
                            onSelectNode?.(step.nodeId)
                          }}
                          style={{
                            width: "100%",
                            padding: "7px 9px",
                            border: "none",
                            background: "transparent",
                            color: t.fg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 8,
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              minWidth: 0,
                              flex: 1,
                            }}
                          >
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: 999,
                                background: dotColor,
                                flexShrink: 0,
                              }}
                            />
                            <span
                              style={{
                                fontSize: 11.5,
                                fontWeight: 500,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {step.nodeLabel}
                            </span>
                          </span>
                          <span
                            style={{
                              fontSize: 10.5,
                              color: t.fgSubtle,
                              fontFamily: MONO_FONT,
                              flexShrink: 0,
                            }}
                          >
                            {step.status === "skipped"
                              ? "skipped"
                              : `${step.durationMs}ms`}
                          </span>
                        </button>

                        {expanded ? (
                          <YStack
                            p={8}
                            gap={6}
                            style={{
                              borderTopWidth: 1,
                              borderTopStyle: "solid",
                              borderTopColor: t.border,
                              backgroundColor: t.inputBg,
                            }}
                          >
                            {step.error ? (
                              <Text
                                style={{
                                  fontSize: 11,
                                  color: t.statusFailed,
                                  fontFamily: MONO_FONT,
                                }}
                              >
                                {step.error}
                              </Text>
                            ) : (
                              <pre
                                style={{
                                  margin: 0,
                                  fontSize: 10.5,
                                  lineHeight: "15px",
                                  color: t.fgMuted,
                                  fontFamily: MONO_FONT,
                                  whiteSpace: "pre-wrap",
                                  wordBreak: "break-word",
                                }}
                              >
                                {formatJson(step.output)}
                              </pre>
                            )}
                          </YStack>
                        ) : null}
                      </YStack>
                    )
                  })}
                </YStack>

                {/* Recent runs switcher */}
                {runs.length > 1 ? (
                  <YStack gap={4}>
                    <Text
                      style={{
                        fontSize: 10.5,
                        fontWeight: "600",
                        color: t.fgSubtle,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      Recent Runs ({runs.length})
                    </Text>
                    {runs.slice(0, 8).map((r) => {
                      const isCur = r.id === displayedRun.id
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => onSelectRun?.(r)}
                          style={{
                            padding: "5px 8px",
                            borderRadius: 6,
                            border: `1px solid ${isCur ? t.borderStrong : t.border}`,
                            background: isCur ? t.pillActiveBg : "transparent",
                            color: isCur ? t.fg : t.fgMuted,
                            fontSize: 11,
                            fontFamily: MONO_FONT,
                            display: "flex",
                            justifyContent: "space-between",
                            cursor: "pointer",
                          }}
                        >
                          <span>{r.status}</span>
                          <span>{r.durationMs}ms</span>
                        </button>
                      )
                    })}
                  </YStack>
                ) : null}
              </YStack>
            ) : (
              <Text style={{ fontSize: 11.5, color: t.fgSubtle }}>
                Execute the workflow to inspect per-step inputs, outputs, and
                latency.
              </Text>
            )}
          </>
        )}
      </YStack>
    </YStack>
  )
}
