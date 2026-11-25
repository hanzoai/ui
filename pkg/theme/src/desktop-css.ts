import {
  APP_THEME_CSS_VARIABLES,
  DESKTOP_DIMENSIONS,
  DESKTOP_MOTION,
  DESKTOP_TYPOGRAPHY,
  THEME_COLOR_ROLES,
  ZEN_DARK_DESKTOP_TOKENS,
  ZEN_LIGHT_DESKTOP_TOKENS,
  resolveLegacyThemeId,
  type ThemeAppearance,
  type ThemeColorRole,
  type ThemeColors,
  type ThemeDefinition,
} from "@hanzo/tokens/desktop"

import { colorToHex, mixColorsToHex } from "./color-convert"
import { getBuiltInTheme, resolveDesktopThemeColors } from "./palettes"

export interface RootElementLike {
  dataset?: Record<string, string | undefined>
  classList?: {
    add: (...tokens: string[]) => void
    remove: (...tokens: string[]) => void
    toggle: (token: string, force?: boolean) => boolean
  }
  style: {
    colorScheme?: string
    setProperty: (property: string, value: string) => void
    removeProperty?: (property: string) => string | void
  }
}

export interface DocumentLike {
  documentElement: RootElementLike
}

function isDocumentLike(target: DocumentLike | RootElementLike): target is DocumentLike {
  return "documentElement" in target && Boolean(target.documentElement)
}

/**
 * Build the complete map of CSS custom properties for a Hanzo Desktop theme & appearance.
 *
 * Includes:
 *   1. All 62 `--app-theme-*` color role variables (1:1 compatible with Hanzo Dev)
 *   2. Semantic shadcn / Hanzo UI variables (`--background`, `--foreground`, `--sidebar`, etc.)
 *   3. Canonical Unified Desktop workspace tokens (`--hz-chrome`, `--hz-canvas`, `--hz-panel`,
 *      `--hz-surface`, `--hz-hover`, `--hz-border`, `--hz-fg`, `--hz-muted`, `--hz-subtle`)
 *   4. Canonical Desktop geometry, typography & motion variables (`--hz-toolbar-height`, etc.)
 */
export function buildDesktopThemeCssVars(
  themeOrId: ThemeDefinition | ThemeColors | string = "zen",
  appearance: ThemeAppearance = "dark",
): Record<string, string> {
  const colors = resolveDesktopThemeColors(themeOrId, appearance)
  const themeId =
    typeof themeOrId === "string"
      ? resolveLegacyThemeId(themeOrId.trim().toLowerCase())
      : "id" in themeOrId
        ? themeOrId.id
        : "custom"

  const isZen = themeId === "zen" || themeId === "dark" || themeId === "light"
  const vars: Record<string, string> = {}

  for (const role of THEME_COLOR_ROLES) {
    vars[APP_THEME_CSS_VARIABLES[role]] = colors[role]
  }

  // Canonical Unified Desktop surface variables (exact Zen Dark / Zen Light spec for Zen,
  // deterministically derived from ThemeColors for Clay, Grove, Ocean, Ember, Iris, Hanzo Chat).
  if (isZen && appearance === "dark") {
    vars["--hz-chrome"] = ZEN_DARK_DESKTOP_TOKENS.chrome
    vars["--hz-canvas"] = ZEN_DARK_DESKTOP_TOKENS.canvas
    vars["--hz-editor-bg"] = ZEN_DARK_DESKTOP_TOKENS.editorBackground
    vars["--hz-panel"] = ZEN_DARK_DESKTOP_TOKENS.panel
    vars["--hz-panel-secondary"] = ZEN_DARK_DESKTOP_TOKENS.secondaryPanel
    vars["--hz-surface"] = ZEN_DARK_DESKTOP_TOKENS.surface
    vars["--hz-surface-raised"] = ZEN_DARK_DESKTOP_TOKENS.surfaceRaised
    vars["--hz-surface-overlay"] = ZEN_DARK_DESKTOP_TOKENS.surfaceOverlay
    vars["--hz-hover"] = ZEN_DARK_DESKTOP_TOKENS.hover
    vars["--hz-row-hover"] = ZEN_DARK_DESKTOP_TOKENS.rowHover
    vars["--hz-border"] = ZEN_DARK_DESKTOP_TOKENS.border
    vars["--hz-border-subtle"] = ZEN_DARK_DESKTOP_TOKENS.borderSubtle
    vars["--hz-fg"] = ZEN_DARK_DESKTOP_TOKENS.text
    vars["--hz-fg-secondary"] = ZEN_DARK_DESKTOP_TOKENS.foreground
    vars["--hz-muted"] = ZEN_DARK_DESKTOP_TOKENS.textMuted
    vars["--hz-subtle"] = ZEN_DARK_DESKTOP_TOKENS.subtle
    vars["--hz-dim"] = ZEN_DARK_DESKTOP_TOKENS.dim
    vars["--hz-accent"] = ZEN_DARK_DESKTOP_TOKENS.accent
  } else if (isZen && appearance === "light") {
    vars["--hz-chrome"] = ZEN_LIGHT_DESKTOP_TOKENS.chrome
    vars["--hz-canvas"] = ZEN_LIGHT_DESKTOP_TOKENS.canvas
    vars["--hz-editor-bg"] = ZEN_LIGHT_DESKTOP_TOKENS.editorBackground
    vars["--hz-panel"] = ZEN_LIGHT_DESKTOP_TOKENS.panel
    vars["--hz-panel-secondary"] = ZEN_LIGHT_DESKTOP_TOKENS.secondaryPanel
    vars["--hz-surface"] = ZEN_LIGHT_DESKTOP_TOKENS.surface
    vars["--hz-surface-raised"] = ZEN_LIGHT_DESKTOP_TOKENS.surfaceRaised
    vars["--hz-surface-overlay"] = ZEN_LIGHT_DESKTOP_TOKENS.surfaceOverlay
    vars["--hz-hover"] = ZEN_LIGHT_DESKTOP_TOKENS.hover
    vars["--hz-row-hover"] = ZEN_LIGHT_DESKTOP_TOKENS.rowHover
    vars["--hz-border"] = ZEN_LIGHT_DESKTOP_TOKENS.border
    vars["--hz-border-subtle"] = ZEN_LIGHT_DESKTOP_TOKENS.borderSubtle
    vars["--hz-fg"] = ZEN_LIGHT_DESKTOP_TOKENS.text
    vars["--hz-fg-secondary"] = ZEN_LIGHT_DESKTOP_TOKENS.foreground
    vars["--hz-muted"] = ZEN_LIGHT_DESKTOP_TOKENS.textMuted
    vars["--hz-subtle"] = ZEN_LIGHT_DESKTOP_TOKENS.subtle
    vars["--hz-dim"] = ZEN_LIGHT_DESKTOP_TOKENS.dim
    vars["--hz-accent"] = ZEN_LIGHT_DESKTOP_TOKENS.accent
  } else {
    const chromeHex = colorToHex(colors.chrome)
    const canvasHex = colorToHex(colors.canvas)
    const codeBgHex = colorToHex(colors.codeBackground)
    const sidebarHex = colorToHex(colors.sidebar)
    const surfaceRaisedHex = colorToHex(colors.surfaceRaised)
    const surfaceOverlayHex = colorToHex(colors.surfaceOverlay)
    const hoverHex = colorToHex(colors.toolbarControlHover)
    const rowHoverHex = colorToHex(colors.sidebarRowHover)
    const borderHex = colorToHex(colors.border)
    const textHex = colorToHex(colors.text)
    const mutedHex = colorToHex(colors.textMuted)

    vars["--hz-chrome"] = chromeHex
    vars["--hz-canvas"] = canvasHex
    vars["--hz-editor-bg"] = codeBgHex
    vars["--hz-panel"] = sidebarHex
    vars["--hz-panel-secondary"] = mixColorsToHex(sidebarHex, surfaceRaisedHex, 0.25)
    vars["--hz-surface"] = surfaceRaisedHex
    vars["--hz-surface-raised"] = surfaceRaisedHex
    vars["--hz-surface-overlay"] = surfaceOverlayHex
    vars["--hz-hover"] = hoverHex
    vars["--hz-row-hover"] = rowHoverHex
    vars["--hz-border"] = borderHex
    vars["--hz-border-subtle"] = mixColorsToHex(borderHex, canvasHex, 0.25)
    vars["--hz-fg"] = textHex
    vars["--hz-fg-secondary"] = mixColorsToHex(textHex, mutedHex, 0.12)
    vars["--hz-muted"] = mutedHex
    vars["--hz-subtle"] = mixColorsToHex(mutedHex, canvasHex, 0.28)
    vars["--hz-dim"] = mixColorsToHex(mutedHex, canvasHex, 0.5)
    vars["--hz-accent"] = colorToHex(colors.accent)
  }

  // Semantic bridges matching Hanzo Dev (`index.css`) & Hanzo IDE (`tokens.css`)
  vars["--app-chrome-background"] = vars["--hz-chrome"]
  vars["--background"] = colors.canvas
  vars["--foreground"] = colors.text
  vars["--card"] = colors.surface
  vars["--card-foreground"] = colors.text
  vars["--popover"] = colors.surfaceOverlay
  vars["--popover-foreground"] = colors.text
  vars["--primary"] = colors.messageAction
  vars["--primary-foreground"] = colors.messageActionForeground
  vars["--secondary"] = colors.secondary
  vars["--secondary-foreground"] = colors.secondaryForeground
  vars["--muted"] = colors.muted
  vars["--muted-foreground"] = colors.mutedForeground
  vars["--accent"] = colors.accentSurface
  vars["--accent-foreground"] = colors.accentSurfaceForeground
  vars["--destructive"] = colors.error
  vars["--destructive-foreground"] = colors.errorForeground
  vars["--border"] = colors.border
  vars["--input"] = colors.input
  vars["--ring"] = colors.focus
  vars["--sidebar"] = colors.sidebar
  vars["--sidebar-foreground"] = colors.sidebarForeground
  vars["--sidebar-muted-foreground"] = colors.sidebarMutedForeground
  vars["--sidebar-control-surface"] = colors.sidebarControlSurface
  vars["--sidebar-row-hover"] = colors.sidebarRowHover
  vars["--sidebar-row-active"] = colors.sidebarRowActive
  vars["--sidebar-row-selected"] = colors.sidebarRowSelected
  vars["--sidebar-border"] = colors.sidebarBorder
  vars["--toolbar-background"] = colors.toolbar
  vars["--toolbar-foreground"] = colors.toolbarForeground
  vars["--toolbar-border"] = colors.toolbarBorder
  vars["--toolbar-control"] = colors.toolbarControl
  vars["--toolbar-control-foreground"] = colors.toolbarControlForeground
  vars["--toolbar-control-hover"] = colors.toolbarControlHover
  vars["--code-background"] = colors.codeBackground
  vars["--code-foreground"] = colors.codeForeground
  vars["--terminal-background"] = colors.terminalBackground
  vars["--terminal-foreground"] = colors.terminalForeground
  vars["--terminal-cursor"] = colors.terminalCursor
  vars["--terminal-selection-background"] = colors.terminalSelection

  // Reference HTML / Desktop Shell shorthand aliases
  vars["--chrome"] = vars["--hz-chrome"]
  vars["--canvas"] = vars["--hz-canvas"]
  vars["--panel"] = vars["--hz-panel"]
  vars["--surface"] = vars["--hz-surface"]
  vars["--hover"] = vars["--hz-hover"]
  vars["--fg"] = vars["--hz-fg"]
  vars["--subtle"] = vars["--hz-subtle"]
  vars["--dim"] = vars["--hz-dim"]

  // Canonical Desktop Geometry, Typography & Motion custom properties
  vars["--hz-toolbar-height"] = `${DESKTOP_DIMENSIONS.toolbarHeightPx}px`
  vars["--hz-icon-size"] = `${DESKTOP_DIMENSIONS.iconSizePx}px`
  vars["--hz-nav-icon-size"] = `${DESKTOP_DIMENSIONS.navIconSizePx}px`
  vars["--hz-icon-stroke"] = `${DESKTOP_DIMENSIONS.iconStrokeWidth}`
  vars["--hz-control-size"] = `${DESKTOP_DIMENSIONS.controlHitAreaPx}px`
  vars["--hz-control-radius"] = `${DESKTOP_DIMENSIONS.controlRadiusPx}px`
  vars["--hz-composer-radius"] = `${DESKTOP_DIMENSIONS.composerRadiusPx}px`
  vars["--hz-ui-font-size"] = `${DESKTOP_DIMENSIONS.uiFontSizePx}px`
  vars["--hz-small-font-size"] = `${DESKTOP_DIMENSIONS.smallLabelFontSizePx}px`
  vars["--hz-editor-line-height"] = `${DESKTOP_DIMENSIONS.editorLineHeightPx}px`
  vars["--hz-left-sidebar-width"] = `${DESKTOP_DIMENSIONS.leftSidebarWidthPx}px`
  vars["--hz-right-sidebar-width"] = `${DESKTOP_DIMENSIONS.rightSidebarWidthPx}px`
  vars["--hz-bottom-panel-height"] = `${DESKTOP_DIMENSIONS.bottomPanelHeightPx}px`
  vars["--hz-editor-tab-height"] = `${DESKTOP_DIMENSIONS.editorTabHeightPx}px`
  vars["--hz-status-bar-height"] = `${DESKTOP_DIMENSIONS.statusBarHeightPx}px`
  vars["--hz-spacing-grid"] = `${DESKTOP_DIMENSIONS.spacingGridPx}px`
  vars["--hz-scrollbar-width"] = `${DESKTOP_DIMENSIONS.scrollbarWidthPx}px`
  vars["--hz-hover-transition"] = DESKTOP_MOTION.hoverTransition
  vars["--hz-ease-drawer"] = DESKTOP_MOTION.hoverEasing
  vars["--font-sans"] = DESKTOP_TYPOGRAPHY.fontSans
  vars["--font-mono"] = DESKTOP_TYPOGRAPHY.fontMono

  return vars
}

/** Serialize desktop theme CSS variables as a CSS stylesheet rule block. */
export function formatDesktopThemeCssText(
  themeOrId: ThemeDefinition | ThemeColors | string = "zen",
  appearance: ThemeAppearance = "dark",
  selector = ":root",
): string {
  const vars = buildDesktopThemeCssVars(themeOrId, appearance)
  const lines = Object.entries(vars).map(([k, v]) => `  ${k}: ${v};`)
  return `${selector} {\n  color-scheme: ${appearance};\n${lines.join("\n")}\n}\n`
}

/**
 * Apply canonical Hanzo Desktop CSS variables, `data-theme-id`, `data-hanzo-theme`,
 * `color-scheme`, and `.dark` / `.light` classes onto a `Document` or root `HTMLElement`.
 */
export function applyDesktopThemeCssVars(
  docOrElement: DocumentLike | RootElementLike,
  themeOrId: ThemeDefinition | ThemeColors | string = "zen",
  appearance: ThemeAppearance = "dark",
): Record<string, string> {
  const root = isDocumentLike(docOrElement) ? docOrElement.documentElement : docOrElement
  const vars = buildDesktopThemeCssVars(themeOrId, appearance)

  const resolvedDef = typeof themeOrId === "string" ? getBuiltInTheme(themeOrId) : null
  const themeId =
    resolvedDef?.id ??
    (typeof themeOrId === "string"
      ? resolveLegacyThemeId(themeOrId.trim().toLowerCase())
      : "id" in themeOrId
        ? themeOrId.id
        : "zen")

  if (root.dataset) {
    root.dataset.themeId = themeId
    root.dataset.hanzoTheme = appearance
    root.dataset.appearance = appearance
  }
  if (root.classList) {
    root.classList.toggle("dark", appearance === "dark")
    root.classList.toggle("light", appearance === "light")
  }
  root.style.colorScheme = appearance

  for (const [prop, value] of Object.entries(vars)) {
    root.style.setProperty(prop, value)
  }

  return vars
}

export type { ThemeColorRole }
