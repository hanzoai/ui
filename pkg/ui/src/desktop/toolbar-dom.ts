/**
 * Canonical Hanzo Unified Desktop Toolbar — Pure TypeScript / DOM Mount & CSS Engine.
 *
 * Renders the exact byte-identical toolbar DOM, CSS custom properties, SVG paths,
 * `aria-pressed` states, tooltips, `F`-menu popover, window controls, and shortcuts
 * across React (`<DesktopToolbar />`) and non-React/Monaco hosts (`Hanzo IDE`).
 */

import { DESKTOP_DIMENSIONS, DESKTOP_MOTION } from "@hanzo/tokens/desktop"
import { renderDesktopIconSvg, type DesktopIconName } from "./icons"

export type DesktopPanelId = "left" | "browser" | "bottom" | "integrations" | "right"

export interface DesktopMenuItem {
  readonly id: string
  readonly label: string
  readonly shortcut?: string
  readonly icon?: DesktopIconName
  readonly danger?: boolean
  readonly separatorBefore?: boolean
}

export interface DesktopToolbarState {
  readonly projectName?: string
  readonly projectPlaceholder?: string
  readonly searchPlaceholder?: string
  readonly searchShortcutLabel?: string
  readonly canGoBack?: boolean
  readonly canGoForward?: boolean
  readonly leftSidebarOpen?: boolean
  readonly browserOpen?: boolean
  readonly bottomPanelOpen?: boolean
  readonly integrationsOpen?: boolean
  readonly rightSidebarOpen?: boolean
  readonly windowMaximized?: boolean
  readonly showWindowControls?: boolean
  readonly isMac?: boolean
  readonly menuItems?: ReadonlyArray<DesktopMenuItem>
  readonly browserIconVariant?: "compass" | "globe"
  readonly terminalIconVariant?: "squareTerminal" | "panelBottom" | "terminal"
  readonly integrationsIconVariant?: "grid2x2Plus" | "blocks"
}

export interface DesktopToolbarController extends DesktopToolbarState {
  readonly onTogglePanel?: (panel: DesktopPanelId, nextOpen: boolean) => void
  readonly onNavigateBack?: () => void
  readonly onNavigateForward?: () => void
  readonly onOpenFolder?: () => void
  readonly onOpenCommandPalette?: () => void
  readonly onMenuAction?: (actionId: string) => void
  readonly onWindowMinimize?: () => void
  readonly onWindowToggleMaximize?: () => void
  readonly onWindowClose?: () => void
  /** Bind keyboard shortcuts (`⌘K`/`Ctrl+K`, `⌘B`/`Ctrl+B`, `Ctrl+\``, `⌥⌘B`/`Ctrl+Alt+B`). Default true. */
  readonly bindShortcuts?: boolean
}

export interface MountedDesktopToolbar {
  readonly element: HTMLElement
  readonly update: (nextState: Partial<DesktopToolbarState>) => void
  readonly setMenuOpen: (open: boolean) => void
  readonly isMenuOpen: () => boolean
  readonly destroy: () => void
}

export const DEFAULT_DESKTOP_MENU_ITEMS: ReadonlyArray<DesktopMenuItem> = [
  { id: "new-thread", label: "New thread", shortcut: "Ctrl+N", icon: "messageSquarePlus" },
  { id: "new-file", label: "New file", shortcut: "Ctrl+Alt+N", icon: "filePlus" },
  { id: "open-folder", label: "Open folder…", shortcut: "Ctrl+O", icon: "folderOpen" },
  { id: "palette", label: "Command palette…", shortcut: "Ctrl+K", icon: "search" },
  {
    id: "local-models",
    label: "Local Models & Node",
    icon: "cpu",
    separatorBefore: true,
  },
  { id: "account-usage", label: "Account & Usage", icon: "chartNoAxesColumn" },
  { id: "settings", label: "Settings", shortcut: "Ctrl+,", icon: "settings" },
  {
    id: "reload",
    label: "Reload window",
    shortcut: "Ctrl+R",
    icon: "refreshCw",
    separatorBefore: true,
  },
  { id: "quit", label: "Quit", shortcut: "Alt+F4", icon: "power", danger: true },
]

export const DESKTOP_TOOLBAR_STYLE_ID = "hanzo-desktop-toolbar-styles"

export const DESKTOP_TOOLBAR_CSS = `
.hz-desktop-toolbar-host {
  position: relative;
  flex: none;
  width: 100%;
  font-family: var(--font-sans, "Zen", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
  font-size: var(--hz-ui-font-size, ${DESKTOP_DIMENSIONS.uiFontSizePx}px);
  color: var(--hz-fg, #EDEDED);
  user-select: none;
  -webkit-user-select: none;
}
.hz-desktop-toolbar {
  box-sizing: border-box;
  height: var(--hz-toolbar-height, ${DESKTOP_DIMENSIONS.toolbarHeightPx}px);
  min-height: var(--hz-toolbar-height, ${DESKTOP_DIMENSIONS.toolbarHeightPx}px);
  max-height: var(--hz-toolbar-height, ${DESKTOP_DIMENSIONS.toolbarHeightPx}px);
  display: grid;
  grid-template-columns: minmax(180px, 1fr) minmax(130px, 420px) minmax(180px, 1fr);
  gap: 12px;
  align-items: center;
  padding: 0 8px;
  background: var(--hz-chrome, var(--app-theme-toolbar, #000000));
  border-bottom: 1px solid var(--hz-border, var(--app-theme-toolbar-border, #222222));
  -webkit-app-region: drag;
}
.hz-desktop-toolbar[data-mac-traffic-lights="true"] {
  padding-left: var(--desktop-window-controls-inset, 78px);
}
.hz-toolbar-cluster {
  display: flex;
  align-items: center;
  gap: 3px;
  min-width: 0;
  -webkit-app-region: no-drag;
}
.hz-toolbar-cluster-end {
  justify-content: flex-end;
  justify-self: end;
}
.hz-toolbar-sep {
  width: 1px;
  height: 16px;
  background: var(--hz-border, #222222);
  margin: 0 4px;
  flex: none;
}
.hz-toolbar-ib {
  box-sizing: border-box;
  width: var(--hz-control-size, ${DESKTOP_DIMENSIONS.controlHitAreaPx}px);
  height: var(--hz-control-size, ${DESKTOP_DIMENSIONS.controlHitAreaPx}px);
  border-radius: var(--hz-control-radius, ${DESKTOP_DIMENSIONS.controlRadiusPx}px);
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--hz-muted, var(--app-theme-icon-muted, #A3A3A3));
  display: inline-grid;
  place-items: center;
  cursor: pointer;
  flex: none;
  position: relative;
  -webkit-app-region: no-drag;
  transition: background-color ${DESKTOP_MOTION.hoverTransition}, color ${DESKTOP_MOTION.hoverTransition};
}
.hz-toolbar-ib:hover:not(:disabled) {
  background: var(--hz-hover, var(--app-theme-toolbar-control-hover, #1B1B1B));
  color: var(--hz-fg, var(--app-theme-toolbar-foreground, #EDEDED));
}
.hz-toolbar-ib[aria-pressed="true"],
.hz-toolbar-ib[aria-expanded="true"] {
  background: var(--hz-hover, #1B1B1B);
  color: var(--hz-fg, #EDEDED);
}
.hz-toolbar-ib:disabled {
  opacity: 0.35;
  cursor: default;
}
.hz-toolbar-ib:focus-visible,
.hz-toolbar-project:focus-visible,
.hz-toolbar-command:focus-visible,
.hz-toolbar-menu-item:focus-visible {
  outline: 1px solid var(--hz-muted, #A3A3A3);
  outline-offset: -2px;
}
.hz-toolbar-ib[data-action="close-window"]:hover:not(:disabled) {
  background: #e5484d;
  color: #ffffff;
}
.hz-toolbar-project {
  border: 0;
  background: transparent;
  color: var(--hz-fg-secondary, #B2B2B2);
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 7px;
  border-radius: var(--hz-control-radius, 6px);
  max-width: 176px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  -webkit-app-region: no-drag;
  transition: background-color ${DESKTOP_MOTION.hoverTransition}, color ${DESKTOP_MOTION.hoverTransition};
}
.hz-toolbar-project:hover {
  background: var(--hz-hover, #1B1B1B);
  color: var(--hz-fg, #EDEDED);
}
.hz-toolbar-command {
  box-sizing: border-box;
  height: 26px;
  width: 100%;
  min-width: 0;
  padding: 0 9px;
  border-radius: var(--hz-control-radius, 6px);
  border: 1px solid var(--hz-border, #222222);
  background: var(--hz-surface, var(--app-theme-toolbar-control, #141414));
  color: var(--hz-muted, #8D8D8D);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  -webkit-app-region: no-drag;
  transition: background-color ${DESKTOP_MOTION.hoverTransition}, border-color ${DESKTOP_MOTION.hoverTransition}, color ${DESKTOP_MOTION.hoverTransition};
}
.hz-toolbar-command:hover {
  background: var(--hz-hover, #1B1B1B);
  border-color: var(--hz-border-subtle, #262626);
  color: var(--hz-fg, #EDEDED);
}
.hz-toolbar-command-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hz-toolbar-kbd {
  margin-left: auto;
  font-family: inherit;
  font-size: 10px;
  line-height: 1.5;
  color: var(--hz-muted, #929292);
  border: 1px solid var(--hz-border-subtle, #262626);
  border-radius: 4px;
  background: var(--hz-panel, #0C0C0C);
  padding: 0 5px;
  white-space: nowrap;
  flex: none;
}
.hz-toolbar-window-controls {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin-left: 1px;
  -webkit-app-region: no-drag;
}
.hz-toolbar-menu-pop {
  position: absolute;
  top: calc(var(--hz-toolbar-height, 38px) + 4px);
  left: 8px;
  width: 236px;
  padding: 5px;
  border-radius: 8px;
  background: var(--hz-surface-overlay, #141414);
  border: 1px solid var(--hz-border-subtle, #262626);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.72);
  z-index: 200;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.hz-toolbar-menu-pop[hidden] {
  display: none !important;
}
.hz-toolbar-menu-sep {
  height: 1px;
  margin: 4px 6px;
  background: var(--hz-border, #222222);
}
.hz-toolbar-menu-item {
  width: 100%;
  height: 30px;
  padding: 0 9px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--hz-fg-secondary, #E5E5E5);
  font: inherit;
  font-size: 12.5px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  text-align: left;
  cursor: pointer;
  transition: background-color ${DESKTOP_MOTION.hoverTransition}, color ${DESKTOP_MOTION.hoverTransition};
}
.hz-toolbar-menu-item:hover {
  background: var(--hz-hover, #1B1B1B);
  color: var(--hz-fg, #EDEDED);
}
.hz-toolbar-menu-item[data-danger="true"]:hover {
  background: rgba(239, 68, 68, 0.16);
  color: #f87171;
}
.hz-toolbar-menu-item-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hz-toolbar-menu-item-kbd {
  font-family: inherit;
  font-size: 11px;
  color: var(--hz-subtle, #777777);
  flex: none;
}
@media (max-width: 850px) {
  .hz-desktop-toolbar {
    grid-template-columns: minmax(95px, 1fr) minmax(75px, 1fr) auto;
    gap: 6px;
  }
  .hz-toolbar-project,
  .hz-toolbar-command .hz-toolbar-kbd {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .hz-desktop-toolbar *,
  .hz-toolbar-menu-pop * {
    transition: none !important;
  }
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

export function detectMacPlatform(explicit?: boolean): boolean {
  if (typeof explicit === "boolean") return explicit
  if (typeof navigator !== "undefined" && typeof navigator.platform === "string") {
    return /Mac|iPhone|iPad|iPod/i.test(navigator.platform)
  }
  return false
}

export function formatShortcutForPlatform(shortcut: string, isMac: boolean): string {
  if (!isMac) return shortcut
  return shortcut
    .replace(/\bCtrl\+Alt\+/g, "⌥⌘")
    .replace(/\bCtrl\+Shift\+/g, "⇧⌘")
    .replace(/\bCtrl\+/g, "⌘")
    .replace(/\bCtrl\s+/g, "⌘")
    .replace(/\bAlt\+F4\b/g, "⌘Q")
}

/** Inject `DESKTOP_TOOLBAR_CSS` into `<head>` once per document. */
export function ensureDesktopToolbarStyles(doc?: Document): void {
  const d = doc ?? (typeof document !== "undefined" ? document : undefined)
  if (!d || d.getElementById(DESKTOP_TOOLBAR_STYLE_ID)) return
  const styleEl = d.createElement("style")
  styleEl.id = DESKTOP_TOOLBAR_STYLE_ID
  styleEl.textContent = DESKTOP_TOOLBAR_CSS
  d.head.appendChild(styleEl)
}

/** Render the canonical Desktop Toolbar HTML string (useful for SSR or static snapshots). */
export function renderDesktopToolbarHtml(state: DesktopToolbarState = {}): string {
  const isMac = detectMacPlatform(state.isMac)
  const modB = isMac ? "⌘B" : "Ctrl+B"
  const modK = state.searchShortcutLabel ?? (isMac ? "⌘K" : "Ctrl K")
  const modBacktick = isMac ? "⌃`" : "Ctrl+`"
  const modAgent = isMac ? "⌥⌘B" : "Ctrl+Alt+B"
  const showWinControls = state.showWindowControls ?? !isMac

  const projectText = state.projectName?.trim() || state.projectPlaceholder || "Open folder…"
  const searchText = state.searchPlaceholder || "Search or run a command"
  const browserIcon = state.browserIconVariant ?? "compass"
  const terminalIcon = state.terminalIconVariant ?? "squareTerminal"
  const integrationsIcon = state.integrationsIconVariant ?? "grid2x2Plus"
  const menuItems = state.menuItems ?? DEFAULT_DESKTOP_MENU_ITEMS

  const menuRows = menuItems
    .map((item) => {
      const sep = item.separatorBefore ? '<div class="hz-toolbar-menu-sep" role="separator"></div>' : ""
      const iconHtml = item.icon ? renderDesktopIconSvg(item.icon, { size: 14 }) : ""
      const kbdHtml = item.shortcut
        ? `<kbd class="hz-toolbar-menu-item-kbd">${escapeHtml(formatShortcutForPlatform(item.shortcut, isMac))}</kbd>`
        : ""
      return (
        sep +
        `<button type="button" role="menuitem" class="hz-toolbar-menu-item" data-menu-id="${escapeHtml(item.id)}"${item.danger ? ' data-danger="true"' : ""}>` +
        iconHtml +
        `<span class="hz-toolbar-menu-item-label">${escapeHtml(item.label)}</span>` +
        kbdHtml +
        `</button>`
      )
    })
    .join("")

  const winControlsHtml = showWinControls
    ? `<div class="hz-toolbar-sep" aria-hidden="true"></div>` +
      `<div class="hz-toolbar-window-controls" data-slot="window-controls" aria-label="Window controls">` +
      `<button type="button" class="hz-toolbar-ib" data-action="min" title="Minimize" aria-label="Minimize">${renderDesktopIconSvg("windowMinimize", { size: 12 })}</button>` +
      `<button type="button" class="hz-toolbar-ib" data-action="max" title="${state.windowMaximized ? "Restore" : "Maximize"}" aria-label="${state.windowMaximized ? "Restore" : "Maximize"}">${renderDesktopIconSvg(state.windowMaximized ? "windowRestore" : "windowMaximize", { size: 12 })}</button>` +
      `<button type="button" class="hz-toolbar-ib" data-action="close-window" title="Close" aria-label="Close window">${renderDesktopIconSvg("windowClose", { size: 12 })}</button>` +
      `</div>`
    : ""

  return (
    `<div class="hz-desktop-toolbar-host" data-slot="desktop-toolbar-host">` +
    `<header class="hz-desktop-toolbar" data-slot="desktop-toolbar" data-tauri-drag-region="" aria-label="Window toolbar"${isMac ? ' data-mac-traffic-lights="true"' : ""}>` +
    `<div class="hz-toolbar-cluster" data-slot="toolbar-left">` +
    `<button type="button" class="hz-toolbar-ib" data-action="menu" data-slot="desktop-app-menu-trigger" title="Application menu" aria-label="Application menu" aria-haspopup="menu" aria-expanded="false">${renderDesktopIconSvg("menu", { size: 16 })}</button>` +
    `<button type="button" class="hz-toolbar-ib" data-panel="left" title="Toggle left sidebar (${modB})" aria-label="Toggle left sidebar" aria-pressed="${Boolean(state.leftSidebarOpen)}">${renderDesktopIconSvg("panelLeft", { size: 16 })}</button>` +
    `<button type="button" class="hz-toolbar-ib" data-action="back" title="Go back" aria-label="Go back"${state.canGoBack ? "" : " disabled"}>${renderDesktopIconSvg("chevronLeft", { size: 16 })}</button>` +
    `<button type="button" class="hz-toolbar-ib" data-action="forward" title="Go forward" aria-label="Go forward"${state.canGoForward ? "" : " disabled"}>${renderDesktopIconSvg("chevronRight", { size: 16 })}</button>` +
    `<button type="button" class="hz-toolbar-project" data-action="folder" title="${escapeHtml(projectText)}">${escapeHtml(projectText)}</button>` +
    `</div>` +
    `<button type="button" class="hz-toolbar-command" data-action="palette" aria-label="Open command palette">` +
    renderDesktopIconSvg("search", { size: 13 }) +
    `<span class="hz-toolbar-command-label">${escapeHtml(searchText)}</span>` +
    `<kbd class="hz-toolbar-kbd">${escapeHtml(modK)}</kbd>` +
    `</button>` +
    `<div class="hz-toolbar-cluster hz-toolbar-cluster-end" data-slot="toolbar-right">` +
    `<button type="button" class="hz-toolbar-ib" data-panel="browser" title="Toggle browser preview" aria-label="Toggle browser preview" aria-pressed="${Boolean(state.browserOpen)}">${renderDesktopIconSvg(browserIcon, { size: 16 })}</button>` +
    `<button type="button" class="hz-toolbar-ib" data-panel="bottom" title="Toggle terminal (${modBacktick})" aria-label="Toggle terminal" aria-pressed="${Boolean(state.bottomPanelOpen)}">${renderDesktopIconSvg(terminalIcon, { size: 16 })}</button>` +
    `<button type="button" class="hz-toolbar-ib" data-panel="integrations" title="Toggle integrations" aria-label="Toggle integrations" aria-pressed="${Boolean(state.integrationsOpen)}">${renderDesktopIconSvg(integrationsIcon, { size: 16 })}</button>` +
    `<button type="button" class="hz-toolbar-ib" data-panel="right" data-right-panel-toggle="" title="Toggle AI agent (${modAgent})" aria-label="Toggle AI agent" aria-pressed="${Boolean(state.rightSidebarOpen)}">${renderDesktopIconSvg("panelRight", { size: 16 })}</button>` +
    winControlsHtml +
    `</div>` +
    `</header>` +
    `<div class="hz-toolbar-menu-pop" data-slot="desktop-app-menu" role="menu" aria-label="Application menu" hidden>${menuRows}</div>` +
    `</div>`
  )
}

/**
 * Imperatively mount the canonical Hanzo Unified Desktop Toolbar into any DOM container.
 * Used directly by `Hanzo IDE` (Monaco workbench) and wrapped by `<DesktopToolbar />` in React.
 */
export function mountDesktopToolbar(
  container: HTMLElement,
  controller: DesktopToolbarController = {},
): MountedDesktopToolbar {
  const doc = container.ownerDocument
  ensureDesktopToolbarStyles(doc)

  let currentState: DesktopToolbarState = { ...controller }
  let menuOpen = false

  container.innerHTML = renderDesktopToolbarHtml(currentState)
  const host = container.firstElementChild as HTMLElement

  const syncDom = () => {
    const setPressed = (panel: DesktopPanelId, open: boolean | undefined) => {
      const btn = host.querySelector<HTMLButtonElement>(`[data-panel="${panel}"]`)
      if (btn) btn.setAttribute("aria-pressed", String(Boolean(open)))
    }
    setPressed("left", currentState.leftSidebarOpen)
    setPressed("browser", currentState.browserOpen)
    setPressed("bottom", currentState.bottomPanelOpen)
    setPressed("integrations", currentState.integrationsOpen)
    setPressed("right", currentState.rightSidebarOpen)

    const backBtn = host.querySelector<HTMLButtonElement>('[data-action="back"]')
    if (backBtn) backBtn.disabled = !currentState.canGoBack
    const fwdBtn = host.querySelector<HTMLButtonElement>('[data-action="forward"]')
    if (fwdBtn) fwdBtn.disabled = !currentState.canGoForward

    const projectBtn = host.querySelector<HTMLButtonElement>('[data-action="folder"]')
    if (projectBtn) {
      const text =
        currentState.projectName?.trim() || currentState.projectPlaceholder || "Open folder…"
      projectBtn.textContent = text
      projectBtn.title = text
    }

    const cmdLabel = host.querySelector<HTMLElement>(".hz-toolbar-command-label")
    if (cmdLabel) {
      cmdLabel.textContent = currentState.searchPlaceholder || "Search or run a command"
    }

    const maxBtn = host.querySelector<HTMLButtonElement>('[data-action="max"]')
    if (maxBtn) {
      const isMax = Boolean(currentState.windowMaximized)
      maxBtn.title = isMax ? "Restore" : "Maximize"
      maxBtn.setAttribute("aria-label", isMax ? "Restore" : "Maximize")
      maxBtn.innerHTML = renderDesktopIconSvg(isMax ? "windowRestore" : "windowMaximize", {
        size: 12,
      })
    }

    const menuTrigger = host.querySelector<HTMLButtonElement>('[data-action="menu"]')
    const menuPop = host.querySelector<HTMLElement>('[data-slot="desktop-app-menu"]')
    if (menuTrigger) menuTrigger.setAttribute("aria-expanded", String(menuOpen))
    if (menuPop) menuPop.hidden = !menuOpen
  }

  const setMenuOpen = (next: boolean) => {
    menuOpen = next
    syncDom()
  }

  const panelOpenValue = (panel: DesktopPanelId): boolean => {
    switch (panel) {
      case "left":
        return Boolean(currentState.leftSidebarOpen)
      case "browser":
        return Boolean(currentState.browserOpen)
      case "bottom":
        return Boolean(currentState.bottomPanelOpen)
      case "integrations":
        return Boolean(currentState.integrationsOpen)
      case "right":
        return Boolean(currentState.rightSidebarOpen)
    }
  }

  const setLocalPanelOpen = (panel: DesktopPanelId, next: boolean) => {
    currentState = {
      ...currentState,
      ...(panel === "left" ? { leftSidebarOpen: next } : {}),
      ...(panel === "browser" ? { browserOpen: next } : {}),
      ...(panel === "bottom" ? { bottomPanelOpen: next } : {}),
      ...(panel === "integrations" ? { integrationsOpen: next } : {}),
      ...(panel === "right" ? { rightSidebarOpen: next } : {}),
    }
  }

  const triggerPanelToggle = (panel: DesktopPanelId) => {
    const next = !panelOpenValue(panel)
    setLocalPanelOpen(panel, next)
    syncDom()
    controller.onTogglePanel?.(panel, next)
  }

  const onHostClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target.closest("button") : null
    if (!target || !host.contains(target) || target.disabled) return

    const menuId = target.getAttribute("data-menu-id")
    if (menuId) {
      setMenuOpen(false)
      if (menuId === "open-folder") controller.onOpenFolder?.()
      else if (menuId === "palette") controller.onOpenCommandPalette?.()
      controller.onMenuAction?.(menuId)
      return
    }

    const panel = target.getAttribute("data-panel") as DesktopPanelId | null
    if (panel) {
      setMenuOpen(false)
      triggerPanelToggle(panel)
      return
    }

    const action = target.getAttribute("data-action")
    if (action !== "menu") setMenuOpen(false)

    switch (action) {
      case "menu":
        setMenuOpen(!menuOpen)
        break
      case "back":
        controller.onNavigateBack?.()
        break
      case "forward":
        controller.onNavigateForward?.()
        break
      case "folder":
        controller.onOpenFolder?.()
        break
      case "palette":
        controller.onOpenCommandPalette?.()
        break
      case "min":
        controller.onWindowMinimize?.()
        break
      case "max":
        controller.onWindowToggleMaximize?.()
        break
      case "close-window":
        controller.onWindowClose?.()
        break
    }
  }

  const onDocumentPointerDown = (event: MouseEvent) => {
    if (menuOpen && event.target instanceof Node && !host.contains(event.target)) {
      setMenuOpen(false)
    }
  }

  const onWindowKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && menuOpen) {
      event.preventDefault()
      setMenuOpen(false)
      return
    }
    if (controller.bindShortcuts === false) return
    const mod = event.metaKey || event.ctrlKey
    if (!mod) return
    const key = event.key.toLowerCase()
    if (key === "k" && !event.shiftKey && !event.altKey) {
      event.preventDefault()
      controller.onOpenCommandPalette?.()
    } else if (key === "b" && !event.shiftKey && !event.altKey) {
      event.preventDefault()
      triggerPanelToggle("left")
    } else if (key === "b" && !event.shiftKey && event.altKey) {
      event.preventDefault()
      triggerPanelToggle("right")
    } else if (event.key === "`" && !event.shiftKey && !event.altKey) {
      event.preventDefault()
      triggerPanelToggle("bottom")
    }
  }

  host.addEventListener("click", onHostClick)
  doc.addEventListener("mousedown", onDocumentPointerDown)
  const win = doc.defaultView
  win?.addEventListener("keydown", onWindowKeyDown)

  return {
    element: host,
    update(nextState: Partial<DesktopToolbarState>) {
      currentState = { ...currentState, ...nextState }
      syncDom()
    },
    setMenuOpen,
    isMenuOpen: () => menuOpen,
    destroy() {
      host.removeEventListener("click", onHostClick)
      doc.removeEventListener("mousedown", onDocumentPointerDown)
      win?.removeEventListener("keydown", onWindowKeyDown)
      container.replaceChildren()
    },
  }
}
