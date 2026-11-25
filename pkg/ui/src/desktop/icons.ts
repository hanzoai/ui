/**
 * Canonical Hanzo Unified Desktop SVG Icon & Brand Mark Primitives.
 *
 * - Brand mark geometry comes verbatim from `@hanzo/logo` (`viewBox="0 0 67 67"`, 7 paths:
 *   5 body blocks + 2 depth slivers).
 * - UI icons use exact `lucide-react` v1.33.0 vector geometry (`viewBox="0 0 24 24"`,
 *   `16px` default size, `1.5px` stroke width, round caps/joins).
 */

import { DESKTOP_DIMENSIONS } from "@hanzo/tokens/desktop"

/** Canonical `@hanzo/logo` block-H coordinate space. */
export const HANZO_MARK_VIEWBOX = "0 0 67 67" as const

/** Five primary body blocks from `@hanzo/logo` (`src/logos.ts`). */
export const HANZO_MARK_BLOCKS = [
  "M22.21 67V44.6369H0V67H22.21Z",
  "M66.7038 22.3184H22.2534L0.0878906 44.6367H44.4634L66.7038 22.3184Z",
  "M22.21 0H0V22.3184H22.21V0Z",
  "M66.7198 0H44.5098V22.3184H66.7198V0Z",
  "M66.7198 67V44.6369H44.5098V67H66.7198Z",
] as const

/** Two depth accent slivers from `@hanzo/logo` (`src/logos.ts`). */
export const HANZO_MARK_SHADE = [
  "M0 44.6369L22.21 46.8285V44.6369H0Z",
  "M66.6753 22.3185L44.5098 20.0822V22.3185H66.6753Z",
] as const

export interface SvgElementSpec {
  readonly tag: "path" | "rect" | "circle" | "line"
  readonly attrs: Readonly<Record<string, string | number>>
}

/** Official 7-path `@hanzo/logo` mark ordered identically to `logos.ts` & `Wordmark.tsx`. */
export const HANZO_MARK_PATHS: ReadonlyArray<SvgElementSpec> = [
  { tag: "path", attrs: { d: HANZO_MARK_BLOCKS[0], fill: "currentColor" } },
  { tag: "path", attrs: { d: HANZO_MARK_SHADE[0], fill: "currentColor", opacity: "0.55" } },
  { tag: "path", attrs: { d: HANZO_MARK_BLOCKS[1], fill: "currentColor" } },
  { tag: "path", attrs: { d: HANZO_MARK_BLOCKS[2], fill: "currentColor" } },
  { tag: "path", attrs: { d: HANZO_MARK_BLOCKS[3], fill: "currentColor" } },
  { tag: "path", attrs: { d: HANZO_MARK_SHADE[1], fill: "currentColor", opacity: "0.55" } },
  { tag: "path", attrs: { d: HANZO_MARK_BLOCKS[4], fill: "currentColor" } },
] as const

export interface DesktopIconDefinition {
  readonly viewBox: string
  readonly stroke?: boolean
  readonly strokeWidth?: number
  readonly elements: ReadonlyArray<SvgElementSpec>
}

/**
 * Canonical Desktop Icons — exact `lucide-react` 24×24 geometry + Hanzo Dev `F`-menu
 * and crisp `12×12` / `24×24` window controls.
 */
export const DESKTOP_ICONS = {
  /** Hanzo Dev `F`-menu two-bar application menu trigger (`DesktopAppMenu.tsx`). */
  menu: {
    viewBox: "0 0 24 24",
    stroke: true,
    elements: [
      { tag: "path", attrs: { d: "M4 8h16" } },
      { tag: "path", attrs: { d: "M4 15h10.5" } },
    ],
  },
  panelLeft: {
    viewBox: "0 0 24 24",
    stroke: true,
    elements: [
      { tag: "rect", attrs: { width: 18, height: 18, x: 3, y: 3, rx: 2 } },
      { tag: "path", attrs: { d: "M9 3v18" } },
    ],
  },
  panelRight: {
    viewBox: "0 0 24 24",
    stroke: true,
    elements: [
      { tag: "rect", attrs: { width: 18, height: 18, x: 3, y: 3, rx: 2 } },
      { tag: "path", attrs: { d: "M15 3v18" } },
    ],
  },
  panelBottom: {
    viewBox: "0 0 24 24",
    stroke: true,
    elements: [
      { tag: "rect", attrs: { width: 18, height: 18, x: 3, y: 3, rx: 2 } },
      { tag: "path", attrs: { d: "M3 15h18" } },
    ],
  },
  chevronLeft: {
    viewBox: "0 0 24 24",
    stroke: true,
    elements: [{ tag: "path", attrs: { d: "m15 18-6-6 6-6" } }],
  },
  chevronRight: {
    viewBox: "0 0 24 24",
    stroke: true,
    elements: [{ tag: "path", attrs: { d: "m9 18 6-6-6-6" } }],
  },
  chevronDown: {
    viewBox: "0 0 24 24",
    stroke: true,
    elements: [{ tag: "path", attrs: { d: "m6 9 6 6 6-6" } }],
  },
  search: {
    viewBox: "0 0 24 24",
    stroke: true,
    elements: [
      { tag: "path", attrs: { d: "m21 21-4.34-4.34" } },
      { tag: "circle", attrs: { cx: 11, cy: 11, r: 8 } },
    ],
  },
  compass: {
    viewBox: "0 0 24 24",
    stroke: true,
    elements: [
      { tag: "circle", attrs: { cx: 12, cy: 12, r: 10 } },
      {
        tag: "path",
        attrs: {
          d: "m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z",
        },
      },
    ],
  },
  globe: {
    viewBox: "0 0 24 24",
    stroke: true,
    elements: [
      { tag: "circle", attrs: { cx: 12, cy: 12, r: 10 } },
      { tag: "path", attrs: { d: "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" } },
      { tag: "path", attrs: { d: "M2 12h20" } },
    ],
  },
  terminal: {
    viewBox: "0 0 24 24",
    stroke: true,
    elements: [
      { tag: "path", attrs: { d: "M12 19h8" } },
      { tag: "path", attrs: { d: "m4 17 6-6-6-6" } },
    ],
  },
  squareTerminal: {
    viewBox: "0 0 24 24",
    stroke: true,
    elements: [
      { tag: "path", attrs: { d: "m7 11 2-2-2-2" } },
      { tag: "path", attrs: { d: "M11 13h4" } },
      { tag: "rect", attrs: { width: 18, height: 18, x: 3, y: 3, rx: 2, ry: 2 } },
    ],
  },
  blocks: {
    viewBox: "0 0 24 24",
    stroke: true,
    elements: [
      {
        tag: "path",
        attrs: {
          d: "M10 22V7a1 1 0 0 0-1-1H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5a1 1 0 0 0-1-1H2",
        },
      },
      { tag: "rect", attrs: { x: 14, y: 2, width: 8, height: 8, rx: 1 } },
    ],
  },
  grid2x2Plus: {
    viewBox: "0 0 24 24",
    stroke: true,
    elements: [
      {
        tag: "path",
        attrs: {
          d: "M12 3v17a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1H3",
        },
      },
      { tag: "path", attrs: { d: "M16 19h6" } },
      { tag: "path", attrs: { d: "M19 22v-6" } },
    ],
  },
  plus: {
    viewBox: "0 0 24 24",
    stroke: true,
    elements: [
      { tag: "path", attrs: { d: "M5 12h14" } },
      { tag: "path", attrs: { d: "M12 5v14" } },
    ],
  },
  x: {
    viewBox: "0 0 24 24",
    stroke: true,
    elements: [
      { tag: "path", attrs: { d: "M18 6 6 18" } },
      { tag: "path", attrs: { d: "m6 6 12 12" } },
    ],
  },
  arrowUp: {
    viewBox: "0 0 24 24",
    stroke: true,
    elements: [
      { tag: "path", attrs: { d: "m5 12 7-7 7 7" } },
      { tag: "path", attrs: { d: "M12 19V5" } },
    ],
  },
  paperclip: {
    viewBox: "0 0 24 24",
    stroke: true,
    elements: [
      {
        tag: "path",
        attrs: {
          d: "m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551",
        },
      },
    ],
  },
  history: {
    viewBox: "0 0 24 24",
    stroke: true,
    elements: [
      { tag: "path", attrs: { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" } },
      { tag: "path", attrs: { d: "M3 3v5h5" } },
      { tag: "path", attrs: { d: "M12 7v5l4 2" } },
    ],
  },
  folderOpen: {
    viewBox: "0 0 24 24",
    stroke: true,
    elements: [
      {
        tag: "path",
        attrs: {
          d: "m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2",
        },
      },
    ],
  },
  filePlus: {
    viewBox: "0 0 24 24",
    stroke: true,
    elements: [
      {
        tag: "path",
        attrs: {
          d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",
        },
      },
      { tag: "path", attrs: { d: "M14 2v5a1 1 0 0 0 1 1h5" } },
      { tag: "path", attrs: { d: "M9 15h6" } },
      { tag: "path", attrs: { d: "M12 18v-6" } },
    ],
  },
  messageSquarePlus: {
    viewBox: "0 0 24 24",
    stroke: true,
    elements: [
      {
        tag: "path",
        attrs: {
          d: "M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z",
        },
      },
      { tag: "path", attrs: { d: "M12 8v6" } },
      { tag: "path", attrs: { d: "M9 11h6" } },
    ],
  },
  settings: {
    viewBox: "0 0 24 24",
    stroke: true,
    elements: [
      {
        tag: "path",
        attrs: {
          d: "M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915",
        },
      },
      { tag: "circle", attrs: { cx: 12, cy: 12, r: 3 } },
    ],
  },
  refreshCw: {
    viewBox: "0 0 24 24",
    stroke: true,
    elements: [
      { tag: "path", attrs: { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" } },
      { tag: "path", attrs: { d: "M21 3v5h-5" } },
      { tag: "path", attrs: { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" } },
      { tag: "path", attrs: { d: "M8 16H3v5" } },
    ],
  },
  cpu: {
    viewBox: "0 0 24 24",
    stroke: true,
    elements: [
      { tag: "path", attrs: { d: "M12 20v2" } },
      { tag: "path", attrs: { d: "M12 2v2" } },
      { tag: "path", attrs: { d: "M17 20v2" } },
      { tag: "path", attrs: { d: "M17 2v2" } },
      { tag: "path", attrs: { d: "M2 12h2" } },
      { tag: "path", attrs: { d: "M2 17h2" } },
      { tag: "path", attrs: { d: "M2 7h2" } },
      { tag: "path", attrs: { d: "M20 12h2" } },
      { tag: "path", attrs: { d: "M20 17h2" } },
      { tag: "path", attrs: { d: "M20 7h2" } },
      { tag: "path", attrs: { d: "M7 20v2" } },
      { tag: "path", attrs: { d: "M7 2v2" } },
      { tag: "rect", attrs: { x: 4, y: 4, width: 16, height: 16, rx: 2 } },
      { tag: "rect", attrs: { x: 8, y: 8, width: 8, height: 8, rx: 1 } },
    ],
  },
  chartNoAxesColumn: {
    viewBox: "0 0 24 24",
    stroke: true,
    elements: [
      { tag: "path", attrs: { d: "M5 21v-6" } },
      { tag: "path", attrs: { d: "M12 21V3" } },
      { tag: "path", attrs: { d: "M19 21V9" } },
    ],
  },
  power: {
    viewBox: "0 0 24 24",
    stroke: true,
    elements: [
      { tag: "path", attrs: { d: "M12 2v10" } },
      { tag: "path", attrs: { d: "M18.4 6.6a9 9 0 1 1-12.77.04" } },
    ],
  },
  check: {
    viewBox: "0 0 24 24",
    stroke: true,
    elements: [{ tag: "path", attrs: { d: "M20 6 9 17l-5-5" } }],
  },
  wrench: {
    viewBox: "0 0 24 24",
    stroke: true,
    elements: [
      {
        tag: "path",
        attrs: {
          d: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z",
        },
      },
    ],
  },
  fileDiff: {
    viewBox: "0 0 24 24",
    stroke: true,
    elements: [
      {
        tag: "path",
        attrs: {
          d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",
        },
      },
      { tag: "path", attrs: { d: "M9 10h6" } },
      { tag: "path", attrs: { d: "M12 13V7" } },
      { tag: "path", attrs: { d: "M9 17h6" } },
    ],
  },
  /** Crisp native-style window controls (`DesktopWindowControls.tsx`). */
  windowMinimize: {
    viewBox: "0 0 12 12",
    stroke: true,
    strokeWidth: 1.5,
    elements: [{ tag: "line", attrs: { x1: 2, y1: 6, x2: 10, y2: 6 } }],
  },
  windowMaximize: {
    viewBox: "0 0 12 12",
    stroke: true,
    strokeWidth: 1.25,
    elements: [{ tag: "rect", attrs: { x: 2, y: 2, width: 8, height: 8, rx: 1.25 } }],
  },
  windowRestore: {
    viewBox: "0 0 12 12",
    stroke: true,
    strokeWidth: 1.25,
    elements: [
      { tag: "rect", attrs: { x: 3.5, y: 1.5, width: 6.5, height: 6.5, rx: 1 } },
      { tag: "path", attrs: { d: "M1.5 4.5v5a1 1 0 0 0 1 1h5" } },
    ],
  },
  windowClose: {
    viewBox: "0 0 12 12",
    stroke: true,
    strokeWidth: 1.5,
    elements: [
      { tag: "line", attrs: { x1: 2.5, y1: 2.5, x2: 9.5, y2: 9.5 } },
      { tag: "line", attrs: { x1: 9.5, y1: 2.5, x2: 2.5, y2: 9.5 } },
    ],
  },
  hanzoMark: {
    viewBox: HANZO_MARK_VIEWBOX,
    stroke: false,
    elements: HANZO_MARK_PATHS,
  },
} as const satisfies Readonly<Record<string, DesktopIconDefinition>>

export type DesktopIconName = keyof typeof DESKTOP_ICONS

function serializeAttrs(attrs: Readonly<Record<string, string | number>>): string {
  return Object.entries(attrs)
    .map(([k, v]) => `${k}="${String(v)}"`)
    .join(" ")
}

export interface RenderDesktopIconOptions {
  readonly size?: number
  readonly strokeWidth?: number
  readonly className?: string
  readonly ariaLabel?: string
}

/** Render any canonical `DesktopIconName` as a crisp inline `<svg>` string. */
export function renderDesktopIconSvg(
  name: DesktopIconName,
  options: RenderDesktopIconOptions = {},
): string {
  const def: DesktopIconDefinition = DESKTOP_ICONS[name]
  const size = options.size ?? DESKTOP_DIMENSIONS.iconSizePx
  const strokeWidth = options.strokeWidth ?? def.strokeWidth ?? DESKTOP_DIMENSIONS.iconStrokeWidth
  const cls = options.className ? ` class="${options.className}"` : ' class="hz-desktop-icon"'
  const a11y = options.ariaLabel
    ? ` role="img" aria-label="${options.ariaLabel}"`
    : ' aria-hidden="true"'
  const strokeAttrs = def.stroke
    ? ` fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"`
    : ""

  const inner = def.elements
    .map((el) => `<${el.tag} ${serializeAttrs(el.attrs)}/>`)
    .join("")

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${def.viewBox}"${strokeAttrs}${cls}${a11y}>${inner}</svg>`
}

/** Render the official 7-path `@hanzo/logo` mark (`viewBox="0 0 67 67"`). */
export function renderHanzoMarkSvg(options: RenderDesktopIconOptions = {}): string {
  return renderDesktopIconSvg("hanzoMark", {
    size: options.size ?? 28,
    className: options.className ?? "hz-hanzo-mark",
    ariaLabel: options.ariaLabel ?? "Hanzo",
  })
}
