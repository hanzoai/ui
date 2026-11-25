'use client'

/**
 * @hanzo/theme/react — Lightweight React `<ThemeProvider>` and `useTheme()` hook.
 *
 * Syncs across OS dark-mode changes (`matchMedia`), cross-tab `storage` events,
 * and same-tab preference updates while staying SSR-safe.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  APPEARANCE_CHANGE_EVENT,
  APPEARANCE_STORAGE_KEY,
  DEFAULT_APPEARANCE,
  applyThemeToDocument,
  computeThemeVars,
  detectOsDark,
  loadAppearance,
  resolveThemeState,
  sanitizeAppearance,
  saveAppearance,
  type AppearanceConfig,
} from './appearance'
import {
  BUILT_IN_THEMES,
  resolveThemeId,
  type BuiltInThemeId,
  type ThemeAppearance,
  type ThemeDefinition,
  type ThemeMode,
} from './palettes'

export interface ThemeContextValue {
  /** Full sanitized appearance configuration. */
  config: AppearanceConfig
  /** Active theme mode (`zen`, `clay`, ..., `light`, or `system`). */
  theme: ThemeMode
  /** Concrete resolved built-in theme ID. */
  resolvedThemeId: BuiltInThemeId
  /** Active theme definition object. */
  resolvedTheme: ThemeDefinition
  /** Resolved polarity (`'dark'` or `'light'`). */
  appearance: ThemeAppearance
  /** Convenience flag: `appearance === 'dark'`. */
  isDark: boolean
  /** Computed CSS custom properties for the active configuration. */
  vars: Record<string, string>
  /** Update just the active theme (accepts built-ins, `'system'`, or legacy aliases). */
  setTheme: (theme: ThemeMode | (string & {})) => void
  /** Patch or transform the appearance configuration. */
  setConfig: (
    next: Partial<AppearanceConfig> | ((prev: AppearanceConfig) => AppearanceConfig),
  ) => void
  /** Reset appearance to defaults (or `defaultConfig`). */
  reset: () => void
  /** All available built-in + custom themes. */
  themes: ReadonlyArray<ThemeDefinition>
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export interface ThemeProviderProps {
  children: ReactNode
  /** Initial / fallback appearance when storage is empty or unavailable. */
  defaultConfig?: Partial<AppearanceConfig>
  /** `localStorage` key used for persistence & cross-tab sync. Default `'hanzo.theme'`. */
  storageKey?: string
  /** Optional custom JSON themes available alongside built-ins. */
  customThemes?: readonly ThemeDefinition[]
  /** When `true`, skips reading from and writing to `localStorage`. */
  disableStorage?: boolean
  /** Optional callback fired whenever the active configuration changes. */
  onChange?: (config: AppearanceConfig) => void
}

function readInitialConfig(
  defaultConfig: Partial<AppearanceConfig> | undefined,
  storageKey: string,
  disableStorage: boolean,
): AppearanceConfig {
  const base = sanitizeAppearance({ ...DEFAULT_APPEARANCE, ...defaultConfig })
  if (disableStorage || typeof window === 'undefined') return base
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return base
    return loadAppearance(window.localStorage, storageKey)
  } catch {
    return base
  }
}

export function ThemeProvider({
  children,
  defaultConfig,
  storageKey = APPEARANCE_STORAGE_KEY,
  customThemes,
  disableStorage = false,
  onChange,
}: ThemeProviderProps) {
  const fallbackConfig = useMemo(
    () => sanitizeAppearance({ ...DEFAULT_APPEARANCE, ...defaultConfig }),
    [defaultConfig],
  )

  const [config, setConfigState] = useState<AppearanceConfig>(() =>
    readInitialConfig(defaultConfig, storageKey, disableStorage),
  )
  const [osDark, setOsDark] = useState<boolean>(() => detectOsDark())

  // Listen for OS color-scheme changes
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    setOsDark(query.matches)

    const onMediaChange = (event: MediaQueryListEvent) => {
      setOsDark(event.matches)
    }

    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', onMediaChange)
      return () => query.removeEventListener('change', onMediaChange)
    }
    // Legacy Safari fallback
    query.addListener?.(onMediaChange)
    return () => query.removeListener?.(onMediaChange)
  }, [])

  // Cross-tab storage sync + same-tab change sync
  useEffect(() => {
    if (disableStorage || typeof window === 'undefined') return

    const onStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== storageKey) return
      const next =
        event.newValue === null
          ? fallbackConfig
          : loadAppearance(window.localStorage, storageKey)
      setConfigState(next)
      onChange?.(next)
    }

    const onLocalChange = () => {
      try {
        const raw = window.localStorage.getItem(storageKey)
        if (!raw) return
        const next = loadAppearance(window.localStorage, storageKey)
        setConfigState((prev) =>
          JSON.stringify(prev) === JSON.stringify(next) ? prev : next,
        )
      } catch {
        // Ignore storage read errors.
      }
    }

    window.addEventListener('storage', onStorage)
    window.addEventListener(APPEARANCE_CHANGE_EVENT, onLocalChange)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(APPEARANCE_CHANGE_EVENT, onLocalChange)
    }
  }, [disableStorage, fallbackConfig, onChange, storageKey])

  // Apply to document whenever config, OS preference, or custom themes change
  useEffect(() => {
    if (typeof document === 'undefined') return
    applyThemeToDocument(config, document, { osDark, customThemes })
  }, [config, osDark, customThemes])

  const setConfig = useCallback(
    (next: Partial<AppearanceConfig> | ((prev: AppearanceConfig) => AppearanceConfig)) => {
      setConfigState((prev) => {
        const candidate = typeof next === 'function' ? next(prev) : { ...prev, ...next }
        const sanitized = sanitizeAppearance(candidate)
        if (!disableStorage && typeof window !== 'undefined') {
          saveAppearance(sanitized, window.localStorage, storageKey)
        }
        onChange?.(sanitized)
        return sanitized
      })
    },
    [disableStorage, onChange, storageKey],
  )

  const setTheme = useCallback(
    (theme: ThemeMode | (string & {})) => {
      const resolved = resolveThemeId(theme)
      setConfig((prev) => ({ ...prev, theme: resolved }))
    },
    [setConfig],
  )

  const reset = useCallback(() => {
    setConfig(fallbackConfig)
  }, [fallbackConfig, setConfig])

  const state = useMemo(
    () => resolveThemeState(config, osDark, customThemes),
    [config, osDark, customThemes],
  )

  const vars = useMemo(
    () => computeThemeVars(config, osDark, { customThemes }),
    [config, osDark, customThemes],
  )

  const themes = useMemo<ReadonlyArray<ThemeDefinition>>(
    () => (customThemes && customThemes.length > 0 ? [...BUILT_IN_THEMES, ...customThemes] : BUILT_IN_THEMES),
    [customThemes],
  )

  const value = useMemo<ThemeContextValue>(
    () => ({
      config: state.config,
      theme: state.themeMode,
      resolvedThemeId: state.resolvedThemeId,
      resolvedTheme: state.resolvedTheme,
      appearance: state.appearance,
      isDark: state.appearance === 'dark',
      vars,
      setTheme,
      setConfig,
      reset,
      themes,
    }),
    [state, vars, setTheme, setConfig, reset, themes],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme() must be used inside a <ThemeProvider> from @hanzo/theme/react.')
  }
  return ctx
}
