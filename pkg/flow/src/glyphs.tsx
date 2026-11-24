/**
 * Crisp dependency-free monochrome SVG glyphs (24x24, stroke 1.75, currentColor)
 * matching Hanzo Dev & Lucide proportions. Hosts may override node icons via
 * `renderIcon` (e.g. with `lucide-react` or `@hanzogui/lucide-icons-2`).
 */
import type { ReactNode, SVGProps } from "react"

import type { FlowNodeKind, FlowNodeSubtype } from "./types"

export type GlyphProps = { size?: number } & Omit<
  SVGProps<SVGSVGElement>,
  "width" | "height"
>

function svg(path: ReactNode) {
  return function Glyph({ size = 15, ...rest }: GlyphProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        {...rest}
      >
        {path}
      </svg>
    )
  }
}

export const PanelLeftGlyph = svg(
  <>
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M9 3v18" />
  </>
)

export const PanelRightGlyph = svg(
  <>
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M15 3v18" />
  </>
)

export const ZapGlyph = svg(<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />)

export const WebhookGlyph = svg(
  <>
    <path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2" />
    <path d="m6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06" />
    <path d="m12 6 3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8" />
  </>
)

export const ClockGlyph = svg(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </>
)

export const CpuGlyph = svg(
  <>
    <rect x="6" y="6" width="12" height="12" rx="2" />
    <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" />
  </>
)

export const SparklesGlyph = svg(
  <>
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z" />
    <path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" />
  </>
)

export const MessageGlyph = svg(
  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
)

export const PhoneGlyph = svg(
  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.58 2.81.7A2 2 0 0 1 22 16.92z" />
)

export const MailGlyph = svg(
  <>
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </>
)

export const GlobeGlyph = svg(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z" />
  </>
)

export const DatabaseGlyph = svg(
  <>
    <ellipse cx="12" cy="5" rx="8" ry="3" />
    <path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />
  </>
)

export const GitBranchGlyph = svg(
  <>
    <circle cx="6" cy="6" r="2.5" />
    <circle cx="6" cy="18" r="2.5" />
    <circle cx="18" cy="8" r="2.5" />
    <path d="M6 8.5v7M8.5 7.2C13 8 15.5 8 15.5 11v0" />
  </>
)

export const BookGlyph = svg(
  <>
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
  </>
)

export const BellGlyph = svg(
  <>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </>
)

export const PlayGlyph = svg(<polygon points="6 4 20 12 6 20 6 4" />)

export const PlusGlyph = svg(<path d="M12 5v14M5 12h14" />)

export const TrashGlyph = svg(
  <>
    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </>
)

export const LayoutGlyph = svg(
  <>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
  </>
)

export const FitGlyph = svg(
  <>
    <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />
  </>
)

export const SaveGlyph = svg(
  <>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </>
)

export const CheckGlyph = svg(<polyline points="20 6 9 17 4 12" />)

export const AlertGlyph = svg(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v4M12 16h.01" />
  </>
)

export const LayersGlyph = svg(
  <>
    <path d="m12 2 9 5-9 5-9-5 9-5Z" />
    <path d="m3 12 9 5 9-5M3 17l9 5 9-5" />
  </>
)

export const SearchGlyph = svg(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </>
)

export function nodeGlyph(
  kind: FlowNodeKind,
  subtype?: FlowNodeSubtype
): ReturnType<typeof svg> {
  if (subtype === "webhook") return WebhookGlyph
  if (subtype === "schedule") return ClockGlyph
  if (subtype === "crm_event") return ZapGlyph
  if (subtype === "sms") return MessageGlyph
  if (subtype === "voice_call") return PhoneGlyph
  if (subtype === "email") return MailGlyph
  if (subtype === "http") return GlobeGlyph
  if (subtype === "wait") return ClockGlyph
  if (subtype === "crm_update") return DatabaseGlyph
  if (subtype === "rag") return BookGlyph
  if (subtype === "notify") return BellGlyph

  switch (kind) {
    case "trigger":
      return ZapGlyph
    case "agent":
      return SparklesGlyph
    case "action":
      return CpuGlyph
    case "condition":
      return GitBranchGlyph
    case "memory":
      return BookGlyph
    case "output":
      return BellGlyph
  }
}
