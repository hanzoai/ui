export {
  HANZO_MARK_VIEWBOX,
  HANZO_MARK_BLOCKS,
  HANZO_MARK_SHADE,
  HANZO_MARK_PATHS,
  DESKTOP_ICONS,
  renderDesktopIconSvg,
  renderHanzoMarkSvg,
  type SvgElementSpec,
  type DesktopIconDefinition,
  type DesktopIconName,
  type RenderDesktopIconOptions,
} from "./icons"

export {
  DEFAULT_DESKTOP_MENU_ITEMS,
  DESKTOP_TOOLBAR_STYLE_ID,
  DESKTOP_TOOLBAR_CSS,
  detectMacPlatform,
  formatShortcutForPlatform,
  ensureDesktopToolbarStyles,
  renderDesktopToolbarHtml,
  mountDesktopToolbar,
  type DesktopPanelId,
  type DesktopMenuItem,
  type DesktopToolbarState,
  type DesktopToolbarController,
  type MountedDesktopToolbar,
} from "./toolbar-dom"

export { DesktopToolbar, type DesktopToolbarProps } from "./DesktopToolbar"
