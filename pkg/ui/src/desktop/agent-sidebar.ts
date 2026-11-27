/**
 * Canonical Hanzo Dev Agent Sidebar Surface Contract — Pure TS / DOM & CSS Engine.
 *
 * Shared across `Hanzo Dev`, `Hanzo IDE`, `Hanzo Desktop`, `Hanzo Bot`, `Hanzo Studio`,
 * and `Hanzo Team`:
 *   - 37px `New thread` header (+ thread history switcher, `+` new thread, `×` close)
 *   - Empty state (30px 7-path `@hanzo/logo` mark, "Build what's next.", subtitle, pill suggestions)
 *   - Streaming message blocks, tool call & approval cards, inline code diff blocks
 *   - 16px-rounded #141414 composer (`Ask, build, or run anything…`, `+` attach,
 *     `zen6-coder ⌄`, `Fast ⌄`, `Auto ⌄`, circular `#EDEDED` `↑` send button)
 */

import { DESKTOP_DIMENSIONS, DESKTOP_MOTION } from "@hanzo/tokens/desktop"
import { renderDesktopIconSvg, renderHanzoMarkSvg } from "./icons"

export type AgentToolStatus = "running" | "completed" | "error" | "pending_approval"

export interface AgentToolCallItem {
  readonly id: string
  readonly title: string
  readonly commandOrArgs?: string
  readonly outputPreview?: string
  readonly status: AgentToolStatus
}

export interface AgentDiffBlock {
  readonly id: string
  readonly filePath: string
  readonly additions?: number
  readonly deletions?: number
  /** Unified diff lines (`+...`, `-...`, ` ...`, `@@ ... @@`). */
  readonly lines: ReadonlyArray<string>
  readonly applied?: boolean
}

export interface AgentMessageItem {
  readonly id: string
  readonly role: "user" | "assistant"
  readonly content: string
  readonly streaming?: boolean
  readonly toolCalls?: ReadonlyArray<AgentToolCallItem>
  readonly diffs?: ReadonlyArray<AgentDiffBlock>
}

export interface AgentThreadSummary {
  readonly id: string
  readonly title: string
  readonly updatedAtLabel?: string
}

export interface AgentSidebarState {
  readonly title?: string
  readonly activeThreadId?: string | null
  readonly threads?: ReadonlyArray<AgentThreadSummary>
  readonly messages?: ReadonlyArray<AgentMessageItem>
  readonly suggestions?: ReadonlyArray<string>
  readonly emptyHeadline?: string
  readonly emptySubtitle?: string
  readonly composerPlaceholder?: string
  readonly draft?: string
  readonly model?: string
  readonly modelOptions?: ReadonlyArray<string>
  readonly effort?: string
  readonly effortOptions?: ReadonlyArray<string>
  readonly mode?: string
  readonly modeOptions?: ReadonlyArray<string>
  readonly busy?: boolean
}

export interface AgentSidebarController extends AgentSidebarState {
  readonly onSend?: (prompt: string, meta: { model: string; effort: string; mode: string }) => void
  readonly onNewThread?: () => void
  readonly onSelectThread?: (threadId: string) => void
  readonly onClose?: () => void
  readonly onAttach?: () => void
  readonly onModelChange?: (model: string) => void
  readonly onEffortChange?: (effort: string) => void
  readonly onModeChange?: (mode: string) => void
  readonly onApproveToolCall?: (toolCallId: string) => void
  readonly onDenyToolCall?: (toolCallId: string) => void
  readonly onApplyDiff?: (diffId: string, filePath: string) => void
}

export interface MountedAgentSidebar {
  readonly element: HTMLElement
  readonly update: (nextState: Partial<AgentSidebarState>) => void
  readonly focusPrompt: () => void
  readonly destroy: () => void
}

export const DEFAULT_AGENT_SUGGESTIONS: ReadonlyArray<string> = [
  "Explain project architecture",
  "Find & fix failing tests",
  "Review current git changes",
]

export const DEFAULT_AGENT_MODELS: ReadonlyArray<string> = [
  "zen6-coder",
  "zen6",
  "zen6-flash",
  "zen6-max",
]

export const DEFAULT_AGENT_EFFORTS: ReadonlyArray<string> = ["Fast", "Medium", "High"]
export const DEFAULT_AGENT_MODES: ReadonlyArray<string> = ["Auto", "Ask", "Plan"]

export const DESKTOP_AGENT_SIDEBAR_STYLE_ID = "hanzo-desktop-agent-sidebar-styles"

export const DESKTOP_AGENT_SIDEBAR_CSS = `
[data-slot="agent-sidebar"] {
  box-sizing: border-box;
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  min-width: 0;
  background: var(--hz-panel, var(--app-theme-sidebar, #0C0C0C));
  color: var(--hz-fg, var(--app-theme-text, #EDEDED));
  font-family: var(--font-sans, "Zen", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
  font-size: var(--hz-ui-font-size, ${DESKTOP_DIMENSIONS.uiFontSizePx}px);
}
[data-slot="agent-sidebar"] *,
[data-slot="agent-sidebar"] *::before,
[data-slot="agent-sidebar"] *::after {
  box-sizing: border-box;
}
[data-slot="agent-header"] {
  height: 37px;
  min-height: 37px;
  flex: none;
  padding-block: 0;
  padding-inline: 13px 9px;
  display: flex;
  align-items: center;
  gap: 5px;
  border-bottom: 1px solid var(--hz-border, #222222);
  color: var(--hz-fg-secondary, #D2D2D2);
  font-size: 12px;
  font-weight: 500;
}
[data-slot="agent-title-btn"] {
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  padding: 3px 6px;
  margin-inline-start: -6px;
  border-radius: 5px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  min-width: 0;
  max-width: 210px;
  transition: background-color ${DESKTOP_MOTION.hoverTransition}, color ${DESKTOP_MOTION.hoverTransition};
}
[data-slot="agent-title-btn"]:hover {
  background: var(--hz-hover, #1B1B1B);
  color: var(--hz-fg, #EDEDED);
}
[data-slot="agent-title-text"] {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
[data-slot="agent-grow"] {
  flex: 1;
  min-width: 0;
}
[data-slot="agent-icon-btn"] {
  width: 25px;
  height: 25px;
  border: 0;
  padding: 0;
  border-radius: var(--hz-control-radius, 6px);
  background: transparent;
  color: var(--hz-muted, #A3A3A3);
  display: inline-grid;
  place-items: center;
  cursor: pointer;
  flex: none;
  transition: background-color ${DESKTOP_MOTION.hoverTransition}, color ${DESKTOP_MOTION.hoverTransition};
}
[data-slot="agent-icon-btn"]:hover:not(:disabled) {
  background: var(--hz-hover, #1B1B1B);
  color: var(--hz-fg, #EDEDED);
}
[data-slot="agent-icon-btn"]:disabled {
  opacity: 0.35;
  cursor: default;
}
[data-slot="agent-history-popover"] {
  position: absolute;
  top: 41px;
  inset-inline: 8px;
  max-height: 240px;
  overflow: auto;
  padding: 5px;
  border-radius: 8px;
  background: var(--hz-surface-overlay, #141414);
  border: 1px solid var(--hz-border-subtle, #262626);
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.72);
  z-index: 40;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
[data-slot="agent-history-popover"][hidden] {
  display: none !important;
}
[data-slot="agent-history-row"] {
  border: 0;
  background: transparent;
  color: var(--hz-fg-secondary, #D2D2D2);
  font: inherit;
  font-size: 12px;
  padding: 6px 9px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  text-align: start;
  cursor: pointer;
}
[data-slot="agent-history-row"]:hover,
[data-slot="agent-history-row"][aria-current="true"] {
  background: var(--hz-hover, #1B1B1B);
  color: var(--hz-fg, #EDEDED);
}
[data-slot="agent-history-meta"] {
  margin-inline-start: auto;
  font-size: 10.5px;
  color: var(--hz-subtle, #777777);
}
[data-slot="agent-empty"] {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 18px 16px;
  overflow: auto;
  text-align: center;
}
[data-slot="agent-empty"][hidden],
[data-slot="agent-messages"][hidden] {
  display: none !important;
}
[data-slot="agent-empty-logo"] {
  color: var(--hz-fg-secondary, #BDBDBD);
  margin-bottom: 14px;
  display: inline-flex;
}
[data-slot="agent-empty-title"] {
  font-size: 14px;
  font-weight: 560;
  margin: 0 0 5px;
  color: var(--hz-fg, #EDEDED);
}
[data-slot="agent-empty-sub"] {
  font-size: 12px;
  color: var(--hz-subtle, #888888);
  margin: 0 0 18px;
  max-width: 260px;
  line-height: 1.45;
}
[data-slot="agent-suggestions"] {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
}
[data-slot="agent-suggest"] {
  border: 1px solid var(--hz-border-subtle, #282828);
  border-radius: 999px;
  background: transparent;
  color: var(--hz-fg-secondary, #B7B7B7);
  font: inherit;
  font-size: 11px;
  padding: 5px 11px;
  cursor: pointer;
  transition: background-color ${DESKTOP_MOTION.hoverTransition}, border-color ${DESKTOP_MOTION.hoverTransition}, color ${DESKTOP_MOTION.hoverTransition};
}
[data-slot="agent-suggest"]:hover {
  background: var(--hz-hover, #1B1B1B);
  color: var(--hz-fg, #EDEDED);
}
[data-slot="agent-messages"] {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
[data-slot="agent-messages"] > [data-role] {
  font-size: 12.5px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}
[data-slot="agent-messages"] > [data-role="user"] {
  padding: 9px 12px;
  background: var(--hz-surface, var(--app-theme-message-surface, #141414));
  border: 1px solid var(--hz-border, #222222);
  border-radius: 10px;
  color: var(--hz-fg, #EDEDED);
}
[data-slot="agent-messages"] > [data-role="assistant"] {
  background: transparent;
  color: var(--hz-fg-secondary, #D5D5D5);
  display: flex;
  flex-direction: column;
  gap: 8px;
}
[data-slot="agent-caret"] {
  display: inline-block;
  width: 6px;
  height: 13px;
  margin-inline-start: 3px;
  vertical-align: text-bottom;
  background: var(--hz-fg, #EDEDED);
  opacity: 0.75;
}
[data-slot="agent-tool-card"] {
  border: 1px solid var(--hz-border, #222222);
  border-radius: 8px;
  background: var(--hz-surface, #141414);
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
[data-slot="agent-tool-head"] {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 11.5px;
  font-weight: 500;
  color: var(--hz-fg, #EDEDED);
}
[data-slot="agent-tool-badge"] {
  margin-inline-start: auto;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--hz-hover, #1B1B1B);
  color: var(--hz-muted, #A3A3A3);
}
[data-slot="agent-tool-card"][data-status="pending_approval"] [data-slot="agent-tool-badge"] {
  color: #fe9a00;
}
[data-slot="agent-tool-card"][data-status="error"] [data-slot="agent-tool-badge"] {
  color: #fb414a;
}
[data-slot="agent-tool-cmd"] {
  font-family: var(--font-mono, "Zen Mono", "JetBrains Mono", monospace);
  font-size: 11px;
  color: var(--hz-muted, #A3A3A3);
  background: var(--hz-canvas, #090909);
  padding: 5px 7px;
  border-radius: 5px;
  overflow-x: auto;
}
[data-slot="agent-tool-actions"] {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}
[data-slot="agent-btn-sm"] {
  border: 1px solid var(--hz-border-subtle, #262626);
  border-radius: 6px;
  padding: 3px 9px;
  font: inherit;
  font-size: 11px;
  font-weight: 500;
  background: var(--hz-hover, #1B1B1B);
  color: var(--hz-fg, #EDEDED);
  cursor: pointer;
}
[data-slot="agent-btn-sm"][data-primary="true"] {
  background: #EDEDED;
  color: #0A0A0A;
  border-color: #EDEDED;
}
[data-slot="agent-diff-block"] {
  border: 1px solid var(--hz-border, #222222);
  border-radius: 8px;
  background: var(--hz-canvas, #090909);
  overflow: hidden;
}
[data-slot="agent-diff-head"] {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 9px;
  background: var(--hz-surface, #141414);
  border-bottom: 1px solid var(--hz-border, #222222);
  font-family: var(--font-mono, "Zen Mono", monospace);
  font-size: 11px;
}
[data-slot="agent-diff-add"] {
  color: #a8be9e;
}
[data-slot="agent-diff-del"] {
  color: #d4848a;
}
[data-slot="agent-diff-pre"] {
  margin: 0;
  padding: 7px 9px;
  font-family: var(--font-mono, "Zen Mono", monospace);
  font-size: 11px;
  line-height: 1.5;
  overflow-x: auto;
}
[data-slot="agent-diff-line-add"] {
  background: rgba(168, 190, 158, 0.12);
  color: #c2d8b8;
  display: block;
}
[data-slot="agent-diff-line-del"] {
  background: rgba(212, 132, 138, 0.12);
  color: #e4a1a7;
  display: block;
}
[data-slot="agent-composer"] {
  margin: 10px;
  border: 1px solid var(--hz-border-subtle, #262626);
  border-radius: var(--hz-composer-radius, ${DESKTOP_DIMENSIONS.composerRadiusPx}px);
  background: var(--hz-surface, #141414);
  padding: 10px;
  box-shadow: 0 14px 32px -18px rgba(0, 0, 0, 0.75);
  flex: none;
}
[data-slot="agent-prompt"] {
  width: 100%;
  min-height: 50px;
  max-height: 160px;
  resize: none;
  background: transparent;
  border: 0;
  outline: 0;
  color: var(--hz-fg, #EDEDED);
  font: inherit;
  font-size: 12.5px;
  line-height: 1.45;
}
[data-slot="agent-prompt"]::placeholder {
  color: var(--hz-subtle, #777777);
}
[data-slot="agent-composer-bar"] {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
}
[data-slot="agent-model-pill"],
[data-slot="agent-effort-pill"],
[data-slot="agent-mode-pill"] {
  border: 0;
  font: inherit;
  font-size: ${DESKTOP_DIMENSIONS.smallLabelFontSizePx}px;
  color: var(--hz-fg-secondary, #B3B3B3);
  border-radius: 999px;
  background: var(--hz-hover, #202020);
  padding: 4px 8px;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color ${DESKTOP_MOTION.hoverTransition}, color ${DESKTOP_MOTION.hoverTransition};
}
[data-slot="agent-model-pill"]:hover,
[data-slot="agent-effort-pill"]:hover,
[data-slot="agent-mode-pill"]:hover {
  color: var(--hz-fg, #EDEDED);
}
[data-slot="agent-send"] {
  width: 26px;
  height: 26px;
  border: 0;
  padding: 0;
  border-radius: 50%;
  background: #EDEDED;
  color: #111111;
  display: inline-grid;
  place-items: center;
  cursor: pointer;
  flex: none;
  transition: background-color ${DESKTOP_MOTION.hoverTransition}, opacity ${DESKTOP_MOTION.hoverTransition};
}
[data-slot="agent-send"]:hover:not(:disabled) {
  background: #FFFFFF;
  color: #000000;
}
[data-slot="agent-send"]:disabled {
  opacity: 0.4;
  cursor: default;
}
`

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case "&":
        return "&amp;"
      case "<":
        return "&lt;"
      case ">":
        return "&gt;"
      case '"':
        return "&quot;"
      default:
        return "&#39;"
    }
  })
}

export function ensureAgentSidebarStyles(doc?: Document): void {
  const d = doc ?? (typeof document !== "undefined" ? document : undefined)
  if (!d || d.getElementById(DESKTOP_AGENT_SIDEBAR_STYLE_ID)) return
  const styleEl = d.createElement("style")
  styleEl.id = DESKTOP_AGENT_SIDEBAR_STYLE_ID
  styleEl.textContent = DESKTOP_AGENT_SIDEBAR_CSS
  d.head.appendChild(styleEl)
}

function renderToolCardHtml(tc: AgentToolCallItem): string {
  const statusLabel =
    tc.status === "pending_approval"
      ? "Needs approval"
      : tc.status === "running"
        ? "Running…"
        : tc.status === "error"
          ? "Failed"
          : "Done"
  const cmdHtml = tc.commandOrArgs
    ? `<div data-slot="agent-tool-cmd">${escapeHtml(tc.commandOrArgs)}</div>`
    : ""
  const outHtml = tc.outputPreview
    ? `<div data-slot="agent-tool-cmd">${escapeHtml(tc.outputPreview)}</div>`
    : ""
  const approvalHtml =
    tc.status === "pending_approval"
      ? `<div data-slot="agent-tool-actions">` +
        `<button type="button" data-slot="agent-btn-sm" data-deny-tool="${escapeHtml(tc.id)}">Deny</button>` +
        `<button type="button" data-slot="agent-btn-sm" data-primary="true" data-approve-tool="${escapeHtml(tc.id)}">Approve</button>` +
        `</div>`
      : ""

  return (
    `<div data-slot="agent-tool-card" data-status="${escapeHtml(tc.status)}">` +
    `<div data-slot="agent-tool-head">${renderDesktopIconSvg("wrench", { size: 13 })}<span>${escapeHtml(tc.title)}</span><span data-slot="agent-tool-badge">${statusLabel}</span></div>` +
    cmdHtml +
    outHtml +
    approvalHtml +
    `</div>`
  )
}

function renderDiffBlockHtml(diff: AgentDiffBlock): string {
  const adds = diff.additions ?? diff.lines.filter((l) => l.startsWith("+") && !l.startsWith("+++")).length
  const dels = diff.deletions ?? diff.lines.filter((l) => l.startsWith("-") && !l.startsWith("---")).length
  const linesHtml = diff.lines
    .map((line) => {
      if (line.startsWith("+")) {
        return `<span data-slot="agent-diff-line-add">${escapeHtml(line)}</span>`
      }
      if (line.startsWith("-")) {
        return `<span data-slot="agent-diff-line-del">${escapeHtml(line)}</span>`
      }
      return `${escapeHtml(line)}\n`
    })
    .join("")

  const applyBtn = diff.applied
    ? `<span data-slot="agent-diff-add">Applied</span>`
    : `<button type="button" data-slot="agent-btn-sm" data-apply-diff="${escapeHtml(diff.id)}" data-diff-path="${escapeHtml(diff.filePath)}">Apply</button>`

  return (
    `<div data-slot="agent-diff-block">` +
    `<div data-slot="agent-diff-head">${renderDesktopIconSvg("fileDiff", { size: 13 })}<span>${escapeHtml(diff.filePath)}</span><span data-slot="agent-diff-add">+${adds}</span><span data-slot="agent-diff-del">-${dels}</span><span data-slot="agent-grow"></span>${applyBtn}</div>` +
    `<pre data-slot="agent-diff-pre">${linesHtml}</pre>` +
    `</div>`
  )
}

function renderMessagesInnerHtml(messages: ReadonlyArray<AgentMessageItem>): string {
  return messages
    .map((m) => {
      if (m.role === "user") {
        return `<div data-role="user">${escapeHtml(m.content)}</div>`
      }
      const tools = (m.toolCalls ?? []).map(renderToolCardHtml).join("")
      const diffs = (m.diffs ?? []).map(renderDiffBlockHtml).join("")
      const caret = m.streaming ? '<span data-slot="agent-caret" aria-hidden="true"></span>' : ""
      return (
        `<div data-role="assistant">` +
        `<div>${escapeHtml(m.content)}${caret}</div>` +
        tools +
        diffs +
        `</div>`
      )
    })
    .join("")
}

function renderHistoryRowsHtml(
  threads: ReadonlyArray<AgentThreadSummary>,
  activeThreadId?: string | null,
): string {
  if (threads.length === 0) {
    return `<div data-slot="agent-history-row" aria-disabled="true">No recent threads</div>`
  }
  return threads
    .map(
      (t) =>
        `<button type="button" data-slot="agent-history-row" data-thread-id="${escapeHtml(t.id)}" aria-current="${t.id === activeThreadId ? "true" : "false"}">` +
        `<span>${escapeHtml(t.title)}</span>` +
        (t.updatedAtLabel
          ? `<span data-slot="agent-history-meta">${escapeHtml(t.updatedAtLabel)}</span>`
          : "") +
        `</button>`,
    )
    .join("")
}

export function renderAgentSidebarHtml(state: AgentSidebarState = {}): string {
  const title = state.title || "New thread"
  const headline = state.emptyHeadline || "Build what’s next."
  const subtitle = state.emptySubtitle || "Ask, edit files, or run commands across your project."
  const placeholder = state.composerPlaceholder || "Ask, build, or run anything…"
  const suggestions = state.suggestions ?? DEFAULT_AGENT_SUGGESTIONS
  const messages = state.messages ?? []
  const hasMessages = messages.length > 0
  const model = state.model || "zen6-coder"
  const effort = state.effort || "Fast"
  const mode = state.mode || "Auto"

  const suggestionsHtml = suggestions
    .map(
      (s) =>
        `<button type="button" data-slot="agent-suggest" data-suggest-prompt="${escapeHtml(s)}">${escapeHtml(s)}</button>`,
    )
    .join("")

  return (
    `<section data-slot="agent-sidebar" aria-label="AI Agent Sidebar">` +
    `<div data-slot="agent-header">` +
    `<button type="button" data-slot="agent-title-btn" data-action="toggle-history" title="Switch thread" aria-haspopup="listbox" aria-expanded="false">` +
    `<span data-slot="agent-title-text">${escapeHtml(title)}</span>` +
    renderDesktopIconSvg("chevronDown", { size: 13 }) +
    `</button>` +
    `<div data-slot="agent-grow"></div>` +
    `<button type="button" data-slot="agent-icon-btn" data-action="toggle-history" title="Thread history" aria-label="Thread history">${renderDesktopIconSvg("history", { size: 15 })}</button>` +
    `<button type="button" data-slot="agent-icon-btn" data-action="new-thread" title="New thread" aria-label="New thread">${renderDesktopIconSvg("plus", { size: 15 })}</button>` +
    `<button type="button" data-slot="agent-icon-btn" data-action="close-right" title="Close sidebar" aria-label="Close sidebar">${renderDesktopIconSvg("x", { size: 15 })}</button>` +
    `</div>` +
    `<div data-slot="agent-history-popover" role="listbox" hidden>${renderHistoryRowsHtml(state.threads ?? [], state.activeThreadId)}</div>` +
    `<div data-slot="agent-empty"${hasMessages ? " hidden" : ""}>` +
    `<span data-slot="agent-empty-logo">${renderHanzoMarkSvg({ size: 30 })}</span>` +
    `<h2 data-slot="agent-empty-title">${escapeHtml(headline)}</h2>` +
    `<p data-slot="agent-empty-sub">${escapeHtml(subtitle)}</p>` +
    `<div data-slot="agent-suggestions">${suggestionsHtml}</div>` +
    `</div>` +
    `<div data-slot="agent-messages" aria-live="polite"${hasMessages ? "" : " hidden"}>${renderMessagesInnerHtml(messages)}</div>` +
    `<div data-slot="agent-composer">` +
    `<textarea data-slot="agent-prompt" placeholder="${escapeHtml(placeholder)}" aria-label="Agent message">${escapeHtml(state.draft ?? "")}</textarea>` +
    `<div data-slot="agent-composer-bar">` +
    `<button type="button" data-slot="agent-icon-btn" data-action="attach" title="Attach file or context" aria-label="Attach file">${renderDesktopIconSvg("plus", { size: 15 })}</button>` +
    `<button type="button" data-action="model" data-slot="agent-model-pill">${escapeHtml(model)} ⌄</button>` +
    `<button type="button" data-action="effort" data-slot="agent-effort-pill">${escapeHtml(effort)} ⌄</button>` +
    `<div data-slot="agent-grow"></div>` +
    `<button type="button" data-action="mode" data-slot="agent-mode-pill">${escapeHtml(mode)} ⌄</button>` +
    `<button type="button" data-slot="agent-send" data-action="send" title="Send message" aria-label="Send message"${state.busy ? " disabled" : ""}>${renderDesktopIconSvg("arrowUp", { size: 14 })}</button>` +
    `</div>` +
    `</div>` +
    `</section>`
  )
}

function cycleOption(current: string, options: ReadonlyArray<string>): string {
  if (options.length === 0) return current
  const idx = options.indexOf(current)
  return options[(idx + 1) % options.length]
}

/** Imperatively mount the canonical Hanzo Dev Agent Sidebar into any DOM container. */
export function mountAgentSidebar(
  container: HTMLElement,
  controller: AgentSidebarController = {},
): MountedAgentSidebar {
  const doc = container.ownerDocument
  ensureAgentSidebarStyles(doc)

  let state: AgentSidebarState = {
    model: controller.model ?? "zen6-coder",
    effort: controller.effort ?? "Fast",
    mode: controller.mode ?? "Auto",
    ...controller,
  }
  let historyOpen = false

  container.innerHTML = renderAgentSidebarHtml(state)
  const root = container.firstElementChild as HTMLElement
  const promptEl = () => root.querySelector<HTMLTextAreaElement>('[data-slot="agent-prompt"]')

  const syncDom = () => {
    const titleEl = root.querySelector<HTMLElement>('[data-slot="agent-title-text"]')
    if (titleEl) titleEl.textContent = state.title || "New thread"

    const historyPop = root.querySelector<HTMLElement>('[data-slot="agent-history-popover"]')
    if (historyPop) {
      historyPop.hidden = !historyOpen
      historyPop.innerHTML = renderHistoryRowsHtml(state.threads ?? [], state.activeThreadId)
    }

    const messages = state.messages ?? []
    const hasMessages = messages.length > 0
    const emptyEl = root.querySelector<HTMLElement>('[data-slot="agent-empty"]')
    const listEl = root.querySelector<HTMLElement>('[data-slot="agent-messages"]')
    if (emptyEl) emptyEl.hidden = hasMessages
    if (listEl) {
      listEl.hidden = !hasMessages
      listEl.innerHTML = renderMessagesInnerHtml(messages)
      listEl.scrollTop = listEl.scrollHeight
    }

    const modelPill = root.querySelector<HTMLElement>('[data-slot="agent-model-pill"]')
    if (modelPill) modelPill.textContent = `${state.model || "zen6-coder"} ⌄`
    const effortPill = root.querySelector<HTMLElement>('[data-slot="agent-effort-pill"]')
    if (effortPill) effortPill.textContent = `${state.effort || "Fast"} ⌄`
    const modePill = root.querySelector<HTMLElement>('[data-slot="agent-mode-pill"]')
    if (modePill) modePill.textContent = `${state.mode || "Auto"} ⌄`

    const sendBtn = root.querySelector<HTMLButtonElement>('[data-action="send"]')
    if (sendBtn) sendBtn.disabled = Boolean(state.busy)
  }

  const submitPrompt = () => {
    const input = promptEl()
    const text = input?.value.trim() ?? ""
    if (!text || state.busy) return
    const meta = {
      model: state.model || "zen6-coder",
      effort: state.effort || "Fast",
      mode: state.mode || "Auto",
    }
    if (input) input.value = ""
    controller.onSend?.(text, meta)
  }

  const onRootClick = (event: MouseEvent) => {
    const btn = event.target instanceof Element ? event.target.closest("button") : null
    if (!btn || !root.contains(btn) || btn.disabled) return

    const suggest = btn.getAttribute("data-suggest-prompt")
    if (suggest !== null) {
      const input = promptEl()
      if (input) {
        input.value = suggest
        input.focus()
      }
      return
    }

    const threadId = btn.getAttribute("data-thread-id")
    if (threadId !== null) {
      historyOpen = false
      state = { ...state, activeThreadId: threadId }
      syncDom()
      controller.onSelectThread?.(threadId)
      return
    }

    const approveId = btn.getAttribute("data-approve-tool")
    if (approveId !== null) {
      controller.onApproveToolCall?.(approveId)
      return
    }

    const denyId = btn.getAttribute("data-deny-tool")
    if (denyId !== null) {
      controller.onDenyToolCall?.(denyId)
      return
    }

    const diffId = btn.getAttribute("data-apply-diff")
    if (diffId !== null) {
      controller.onApplyDiff?.(diffId, btn.getAttribute("data-diff-path") ?? "")
      return
    }

    const action = btn.getAttribute("data-action")
    if (action !== "toggle-history") historyOpen = false

    switch (action) {
      case "toggle-history":
        historyOpen = !historyOpen
        syncDom()
        break
      case "new-thread":
        state = { ...state, messages: [], title: "New thread", activeThreadId: null }
        syncDom()
        controller.onNewThread?.()
        break
      case "close-right":
        syncDom()
        controller.onClose?.()
        break
      case "attach":
        controller.onAttach?.()
        break
      case "model": {
        const next = cycleOption(
          state.model || "zen6-coder",
          state.modelOptions ?? DEFAULT_AGENT_MODELS,
        )
        state = { ...state, model: next }
        syncDom()
        controller.onModelChange?.(next)
        break
      }
      case "effort": {
        const next = cycleOption(
          state.effort || "Fast",
          state.effortOptions ?? DEFAULT_AGENT_EFFORTS,
        )
        state = { ...state, effort: next }
        syncDom()
        controller.onEffortChange?.(next)
        break
      }
      case "mode": {
        const next = cycleOption(state.mode || "Auto", state.modeOptions ?? DEFAULT_AGENT_MODES)
        state = { ...state, mode: next }
        syncDom()
        controller.onModeChange?.(next)
        break
      }
      case "send":
        submitPrompt()
        break
    }
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.target === promptEl() && event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      submitPrompt()
    } else if (event.key === "Escape" && historyOpen) {
      historyOpen = false
      syncDom()
    }
  }

  root.addEventListener("click", onRootClick)
  root.addEventListener("keydown", onKeyDown)

  return {
    element: root,
    update(nextState: Partial<AgentSidebarState>) {
      state = { ...state, ...nextState }
      if (typeof nextState.draft === "string") {
        const input = promptEl()
        if (input && input.value !== nextState.draft) input.value = nextState.draft
      }
      syncDom()
    },
    focusPrompt() {
      promptEl()?.focus()
    },
    destroy() {
      root.removeEventListener("click", onRootClick)
      root.removeEventListener("keydown", onKeyDown)
      container.replaceChildren()
    },
  }
}
