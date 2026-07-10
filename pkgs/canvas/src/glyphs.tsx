/**
 * A compact, dependency-free inline-SVG glyph set — the standalone fallback for
 * service-node icons and source refs. A host console typically overrides these
 * by passing its own icon set via `renderIcon` (e.g. lucide); these exist so the
 * package looks right with zero extra dependencies (CSP-safe, no icon lib).
 */
import type { ReactNode, SVGProps } from "react"

import type { ServiceKind, ServiceSource } from "./types"

type GlyphProps = { size?: number } & Omit<
  SVGProps<SVGSVGElement>,
  "width" | "height"
>

function svg(path: ReactNode) {
  return function Glyph({ size = 16, ...rest }: GlyphProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
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

export const BoxGlyph = svg(
  <>
    <path d="M21 8v8a2 2 0 0 1-1 1.73l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16V8" />
    <path d="M3.3 7 12 12l8.7-5M12 22V12" />
    <path d="M12 2 3 7l9 5 9-5-9-5Z" />
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
export const LayersGlyph = svg(
  <>
    <path d="m12 2 9 5-9 5-9-5 9-5Z" />
    <path d="m3 12 9 5 9-5M3 17l9 5 9-5" />
  </>
)
export const BoltGlyph = svg(<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />)
export const ServerGlyph = svg(
  <>
    <rect x="3" y="4" width="18" height="7" rx="1.5" />
    <rect x="3" y="13" width="18" height="7" rx="1.5" />
    <path d="M7 7.5h.01M7 16.5h.01" />
  </>
)
export const KeyGlyph = svg(
  <>
    <circle cx="7.5" cy="15.5" r="4" />
    <path d="M10.5 12.5 20 3M16 7l3 3M14 9l2 2" />
  </>
)
export const SearchGlyph = svg(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </>
)
export const HardDriveGlyph = svg(
  <>
    <path d="M22 12H2M5.5 6h13l3.5 6v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-6l3.5-6Z" />
    <path d="M6 16h.01M10 16h.01" />
  </>
)
export const QueueGlyph = svg(<path d="M4 6h16M4 12h16M4 18h10" />)
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
export const GitBranchGlyph = svg(
  <>
    <circle cx="6" cy="6" r="2.5" />
    <circle cx="6" cy="18" r="2.5" />
    <circle cx="18" cy="8" r="2.5" />
    <path d="M6 8.5v7M8.5 7.2C13 8 15.5 8 15.5 11v0" />
  </>
)
export const CubeGlyph = svg(
  <>
    <path d="M12 2 3 7v10l9 5 9-5V7l-9-5Z" />
    <path d="m3 7 9 5 9-5M12 22V12" />
  </>
)
export const CloudGlyph = svg(
  <path d="M6.5 19a4.5 4.5 0 0 1-.5-8.98A6 6 0 0 1 17.7 9 4 4 0 0 1 17.5 19H6.5Z" />
)
export const TemplateGlyph = svg(
  <>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M9 21V9" />
  </>
)

const KIND_GLYPH: Record<ServiceKind, ReturnType<typeof svg>> = {
  app: BoxGlyph,
  web: GlobeGlyph,
  worker: CpuGlyph,
  database: DatabaseGlyph,
  cache: KeyGlyph,
  vector: LayersGlyph,
  search: SearchGlyph,
  storage: HardDriveGlyph,
  queue: QueueGlyph,
  domain: GlobeGlyph,
  function: BoltGlyph,
  cron: ClockGlyph,
  ai: CpuGlyph,
  service: ServerGlyph,
}

/** The default glyph component for a service kind. */
export const kindGlyph = (kind: ServiceKind): ReturnType<typeof svg> =>
  KIND_GLYPH[kind] ?? ServerGlyph

const SOURCE_GLYPH: Record<ServiceSource["kind"], ReturnType<typeof svg>> = {
  repo: GitBranchGlyph,
  image: CubeGlyph,
  template: TemplateGlyph,
  database: DatabaseGlyph,
  managed: CloudGlyph,
}

/** The default glyph component for a source kind. */
export const sourceGlyph = (
  kind: ServiceSource["kind"]
): ReturnType<typeof svg> => SOURCE_GLYPH[kind] ?? CubeGlyph
