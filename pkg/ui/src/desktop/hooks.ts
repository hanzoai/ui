"use client"

import * as React from "react"

// ============================================================================
// Window Manager Hook
// ============================================================================

export type WindowId = string

export interface WindowState {
  [key: string]: boolean
}

type WindowAction =
  | { type: 'OPEN'; id: WindowId }
  | { type: 'CLOSE'; id: WindowId }
  | { type: 'TOGGLE'; id: WindowId }
  | { type: 'CLOSE_ALL' }
  | { type: 'SET_ACTIVE'; id: WindowId }

interface WindowManagerState {
  windows: WindowState
  activeWindow: WindowId | null
}

function windowReducer(state: WindowManagerState, action: WindowAction): WindowManagerState {
  switch (action.type) {
    case 'OPEN':
      return {
        windows: { ...state.windows, [action.id]: true },
        activeWindow: action.id,
      }
    case 'CLOSE':
      return {
        windows: { ...state.windows, [action.id]: false },
        activeWindow: state.activeWindow === action.id ? null : state.activeWindow,
      }
    case 'TOGGLE':
      const isOpen = state.windows[action.id]
      return {
        windows: { ...state.windows, [action.id]: !isOpen },
        activeWindow: !isOpen ? action.id : (state.activeWindow === action.id ? null : state.activeWindow),
      }
    case 'CLOSE_ALL':
      return {
        windows: Object.keys(state.windows).reduce((acc, key) => {
          acc[key] = false
          return acc
        }, {} as WindowState),
        activeWindow: null,
      }
    case 'SET_ACTIVE':
      return { ...state, activeWindow: action.id }
    default:
      return state
  }
}

export interface WindowManager {
  windows: WindowState
  activeWindow: WindowId | null
  openWindows: WindowId[]
  openWindow: (id: WindowId) => void
  closeWindow: (id: WindowId) => void
  toggleWindow: (id: WindowId) => void
  focusWindow: (id: WindowId) => void
  closeAllWindows: () => void
  isOpen: (id: WindowId) => boolean
}

export function useWindowManager(initialWindows: WindowId[] = []): WindowManager {
  const initialState: WindowManagerState = {
    windows: initialWindows.reduce((acc, id) => {
      acc[id] = false
      return acc
    }, {} as WindowState),
    activeWindow: null,
  }

  const [state, dispatch] = React.useReducer(windowReducer, initialState)

  const openWindows = React.useMemo(() => {
    return Object.entries(state.windows)
      .filter(([_, isOpen]) => isOpen)
      .map(([id]) => id)
  }, [state.windows])

  const openWindow = React.useCallback((id: WindowId) => {
    dispatch({ type: 'OPEN', id })
  }, [])

  const closeWindow = React.useCallback((id: WindowId) => {
    dispatch({ type: 'CLOSE', id })
  }, [])

  const toggleWindow = React.useCallback((id: WindowId) => {
    dispatch({ type: 'TOGGLE', id })
  }, [])

  const focusWindow = React.useCallback((id: WindowId) => {
    dispatch({ type: 'SET_ACTIVE', id })
  }, [])

  const closeAllWindows = React.useCallback(() => {
    dispatch({ type: 'CLOSE_ALL' })
  }, [])

  const isOpen = React.useCallback((id: WindowId) => {
    return state.windows[id] ?? false
  }, [state.windows])

  return {
    windows: state.windows,
    activeWindow: state.activeWindow,
    openWindows,
    openWindow,
    closeWindow,
    toggleWindow,
    focusWindow,
    closeAllWindows,
    isOpen,
  }
}

// ============================================================================
// Desktop Settings Hook
// ============================================================================

export type ColorScheme = 'dark' | 'light' | 'auto'
export type DockPosition = 'bottom' | 'left' | 'right'

export interface DesktopSettings {
  // Theme
  theme: string
  colorScheme: ColorScheme
  
  // Background
  backgroundImage?: string
  backgroundColor?: string
  
  // Dock
  dockPosition: DockPosition
  dockSize: number
  dockMagnification: boolean
  dockAutoHide: boolean
  
  // Window
  windowTransparency: number
  
  // Accessibility
  fontSize: 'small' | 'medium' | 'large'
  reducedMotion: boolean
}

export interface DesktopSettingsActions {
  setTheme: (theme: string) => void
  setColorScheme: (scheme: ColorScheme) => void
  setBackgroundImage: (url?: string) => void
  setBackgroundColor: (color?: string) => void
  setDockPosition: (position: DockPosition) => void
  setDockSize: (size: number) => void
  setDockMagnification: (enabled: boolean) => void
  setDockAutoHide: (enabled: boolean) => void
  setWindowTransparency: (value: number) => void
  setFontSize: (size: 'small' | 'medium' | 'large') => void
  setReducedMotion: (enabled: boolean) => void
  toggleDarkMode: () => void
  resetToDefaults: () => void
}

const defaultSettings: DesktopSettings = {
  theme: 'default',
  colorScheme: 'dark',
  backgroundImage: undefined,
  backgroundColor: undefined,
  dockPosition: 'bottom',
  dockSize: 64,
  dockMagnification: true,
  dockAutoHide: false,
  windowTransparency: 20,
  fontSize: 'medium',
  reducedMotion: false,
}

const STORAGE_KEY = 'desktop-settings'

function loadSettings(): DesktopSettings {
  if (typeof window === 'undefined') return defaultSettings
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) }
    }
  } catch {
    // Ignore errors
  }
  return defaultSettings
}

function saveSettings(settings: DesktopSettings): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Ignore errors
  }
}

export function useDesktopSettings(): DesktopSettings & DesktopSettingsActions {
  const [settings, setSettings] = React.useState<DesktopSettings>(loadSettings)

  // Persist on change
  React.useEffect(() => {
    saveSettings(settings)
  }, [settings])

  const updateSetting = <K extends keyof DesktopSettings>(
    key: K,
    value: DesktopSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  return {
    ...settings,
    setTheme: (theme) => updateSetting('theme', theme),
    setColorScheme: (scheme) => updateSetting('colorScheme', scheme),
    setBackgroundImage: (url) => updateSetting('backgroundImage', url),
    setBackgroundColor: (color) => updateSetting('backgroundColor', color),
    setDockPosition: (position) => updateSetting('dockPosition', position),
    setDockSize: (size) => updateSetting('dockSize', size),
    setDockMagnification: (enabled) => updateSetting('dockMagnification', enabled),
    setDockAutoHide: (enabled) => updateSetting('dockAutoHide', enabled),
    setWindowTransparency: (value) => updateSetting('windowTransparency', value),
    setFontSize: (size) => updateSetting('fontSize', size),
    setReducedMotion: (enabled) => updateSetting('reducedMotion', enabled),
    toggleDarkMode: () => {
      setSettings((prev) => ({
        ...prev,
        colorScheme: prev.colorScheme === 'dark' ? 'light' : 'dark',
      }))
    },
    resetToDefaults: () => setSettings(defaultSettings),
  }
}

// ============================================================================
// Overlay Manager Hook
// ============================================================================

export interface OverlayState {
  spotlight: boolean
  contextMenu: boolean
  modal: boolean
  drawer: boolean
  [key: string]: boolean
}

export interface OverlayManager {
  overlays: OverlayState
  isOpen: (id: string) => boolean
  open: (id: string) => void
  close: (id: string) => void
  toggle: (id: string) => void
  closeAll: () => void
}

export function useOverlayManager(): OverlayManager {
  const [overlays, setOverlays] = React.useState<OverlayState>({
    spotlight: false,
    contextMenu: false,
    modal: false,
    drawer: false,
  })

  const isOpen = React.useCallback((id: string) => overlays[id] ?? false, [overlays])

  const open = React.useCallback((id: string) => {
    setOverlays((prev) => ({ ...prev, [id]: true }))
  }, [])

  const close = React.useCallback((id: string) => {
    setOverlays((prev) => ({ ...prev, [id]: false }))
  }, [])

  const toggle = React.useCallback((id: string) => {
    setOverlays((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const closeAll = React.useCallback(() => {
    setOverlays((prev) =>
      Object.keys(prev).reduce((acc, key) => {
        acc[key] = false
        return acc
      }, {} as OverlayState)
    )
  }, [])

  return { overlays, isOpen, open, close, toggle, closeAll }
}

// ============================================================================
// Keyboard Shortcuts Hook
// ============================================================================

export interface KeyboardShortcut {
  key: string
  meta?: boolean
  ctrl?: boolean
  alt?: boolean
  shift?: boolean
  action: () => void
  description?: string
  preventDefault?: boolean
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]): void {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const metaMatch = shortcut.meta ? (e.metaKey || e.ctrlKey) : !e.metaKey
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey : true
        const altMatch = shortcut.alt ? e.altKey : !e.altKey
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase()

        if (keyMatch && metaMatch && ctrlMatch && altMatch && shiftMatch) {
          if (shortcut.preventDefault !== false) {
            e.preventDefault()
          }
          shortcut.action()
          return
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}
