/**
 * Canonical monochrome Hanzo Dev palette tokens for `@hanzo/flow`.
 * Pure monochrome OLED dark (`#000000` / `#0a0a0a` / `#111111`, hairline
 * `rgba(255,255,255,0.10)` borders, `#fafafa` ink) with crisp light-mode parity.
 */
import type { FlowNodeExecutionStatus, FlowTheme } from "./types"

export interface FlowPaletteTokens {
  railBg: string
  canvasBg: string
  topbarBg: string
  cardBg: string
  cardHoverBg: string
  surfaceHover: string
  surfaceActive: string
  inputBg: string
  border: string
  borderStrong: string
  borderSelected: string
  fg: string
  fgMuted: string
  fgSubtle: string
  pillBg: string
  pillActiveBg: string
  primaryBg: string
  primaryFg: string
  dots: string
  edge: string
  edgeSelected: string
  handleBg: string
  handleBorder: string
  minimapBg: string
  minimapMask: string
  minimapNode: string
  shadow: string
  shadowSelected: string
  statusRunning: string
  statusSucceeded: string
  statusFailed: string
  statusSkipped: string
  statusWarning: string
}

export const FLOW_THEME: Record<FlowTheme, FlowPaletteTokens> = {
  dark: {
    railBg: "#000000",
    canvasBg: "#0a0a0a",
    topbarBg: "#000000",
    cardBg: "#111111",
    cardHoverBg: "#151515",
    surfaceHover: "#141414",
    surfaceActive: "#1a1a1a",
    inputBg: "#0a0a0a",
    border: "rgba(255,255,255,0.10)",
    borderStrong: "rgba(255,255,255,0.22)",
    borderSelected: "#fafafa",
    fg: "#fafafa",
    fgMuted: "#a1a1aa",
    fgSubtle: "#71717a",
    pillBg: "rgba(255,255,255,0.06)",
    pillActiveBg: "rgba(255,255,255,0.14)",
    primaryBg: "#fafafa",
    primaryFg: "#000000",
    dots: "rgba(255,255,255,0.14)",
    edge: "rgba(255,255,255,0.28)",
    edgeSelected: "#fafafa",
    handleBg: "#0a0a0a",
    handleBorder: "rgba(255,255,255,0.45)",
    minimapBg: "#000000",
    minimapMask: "rgba(0,0,0,0.72)",
    minimapNode: "#3f3f46",
    shadow: "0 1px 2px rgba(0,0,0,0.45), 0 8px 20px rgba(0,0,0,0.35)",
    shadowSelected: "0 0 0 1px #fafafa, 0 10px 28px rgba(0,0,0,0.60)",
    statusRunning: "#fafafa",
    statusSucceeded: "#22c55e",
    statusFailed: "#ef4444",
    statusSkipped: "#52525b",
    statusWarning: "#f59e0b",
  },
  light: {
    railBg: "#fafafa",
    canvasBg: "#f4f4f5",
    topbarBg: "#ffffff",
    cardBg: "#ffffff",
    cardHoverBg: "#fafafa",
    surfaceHover: "#f4f4f5",
    surfaceActive: "#e4e4e7",
    inputBg: "#ffffff",
    border: "rgba(0,0,0,0.10)",
    borderStrong: "rgba(0,0,0,0.22)",
    borderSelected: "#09090b",
    fg: "#09090b",
    fgMuted: "#52525b",
    fgSubtle: "#71717a",
    pillBg: "rgba(0,0,0,0.05)",
    pillActiveBg: "rgba(0,0,0,0.10)",
    primaryBg: "#09090b",
    primaryFg: "#fafafa",
    dots: "rgba(0,0,0,0.16)",
    edge: "rgba(0,0,0,0.28)",
    edgeSelected: "#09090b",
    handleBg: "#ffffff",
    handleBorder: "rgba(0,0,0,0.45)",
    minimapBg: "#ffffff",
    minimapMask: "rgba(255,255,255,0.72)",
    minimapNode: "#a1a1aa",
    shadow: "0 1px 2px rgba(0,0,0,0.06), 0 6px 16px rgba(0,0,0,0.05)",
    shadowSelected: "0 0 0 1px #09090b, 0 10px 24px rgba(0,0,0,0.12)",
    statusRunning: "#09090b",
    statusSucceeded: "#16a34a",
    statusFailed: "#dc2626",
    statusSkipped: "#a1a1aa",
    statusWarning: "#d97706",
  },
}

export const MONO_FONT =
  "var(--font-mono, 'Zen Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace)"

export const SANS_FONT =
  "var(--font-sans, 'Zen', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)"

export function executionColor(
  status: FlowNodeExecutionStatus | undefined,
  tokens: FlowPaletteTokens
): string | null {
  switch (status) {
    case "running":
      return tokens.statusRunning
    case "succeeded":
      return tokens.statusSucceeded
    case "failed":
      return tokens.statusFailed
    case "skipped":
      return tokens.statusSkipped
    default:
      return null
  }
}

export function flowThemeCssVars(theme: FlowTheme): Record<string, string> {
  const t = FLOW_THEME[theme]
  return {
    "--hz-flow-rail": t.railBg,
    "--hz-flow-canvas": t.canvasBg,
    "--hz-flow-card": t.cardBg,
    "--hz-flow-hover": t.surfaceHover,
    "--hz-flow-border": t.border,
    "--hz-flow-border-strong": t.borderStrong,
    "--hz-flow-fg": t.fg,
    "--hz-flow-fg-muted": t.fgMuted,
    "--hz-flow-edge": t.edge,
    "--hz-flow-edge-selected": t.edgeSelected,
    "--hz-flow-dots": t.dots,
    "--hz-flow-minimap": t.minimapBg,
    "--hz-flow-minimap-mask": t.minimapMask,
  }
}
