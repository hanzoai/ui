// Desktop Environment Components for @hanzo/ui
// Provides macOS-style window management, spotlight search, and desktop utilities

// Window Component
export { Window, WindowControls } from './window'
export type { WindowProps, WindowControlsProps } from './window'

// Spotlight Search
export { Spotlight } from './spotlight'
export type { SpotlightProps, SpotlightItem } from './spotlight'

// Hooks
export {
  useWindowManager,
  useDesktopSettings,
  useOverlayManager,
  useKeyboardShortcuts,
} from './hooks'

export type {
  WindowId,
  WindowState,
  WindowManager,
  DesktopSettings,
  DesktopSettingsActions,
  ColorScheme,
  DockPosition,
  OverlayState,
  OverlayManager,
  KeyboardShortcut,
} from './hooks'
