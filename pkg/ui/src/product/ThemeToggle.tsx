'use client'

/**
 * ThemeToggle — flips between dark and light. Framework-agnostic by default so
 * Vite / Tauri / Express hosts can use it with NO Next dependency:
 *
 *   • Controlled:  <ThemeToggle theme={theme} onToggle={setTheme} />   (host owns theme)
 *   • Uncontrolled (agnostic): <ThemeToggle onThemeChange={fn} />       (toggles the DOM
 *                              `.dark` class + persists to localStorage)
 *   • Uncontrolled (no props): <ThemeToggle />                          (console/Next —
 *                              falls back to the OPTIONAL @hanzogui/next-theme path;
 *                              if it cannot load, degrades to the agnostic DOM toggle)
 *
 * Shows the action's target icon (a sun in dark mode, a moon in light mode).
 */
import type { ReactNode } from 'react'
import { Component, Suspense, lazy, useState } from 'react'
import { Button } from '@hanzo/gui'
import { Moon, Sun } from '@hanzogui/lucide-icons-2'

import { useEmit } from './instrument'

export type ThemeMode = 'light' | 'dark'

export type ThemeToggleProps = {
  /** Controlled theme. Pair with `onToggle`/`onThemeChange` to fully control it. */
  theme?: ThemeMode
  /** Seed for uncontrolled mode (default: read from the DOM `.dark` class, else 'dark'). */
  defaultTheme?: ThemeMode
  /** Called with the next theme on toggle (alias of `onThemeChange`). */
  onToggle?: (next: ThemeMode) => void
  /** Called with the next theme on toggle. */
  onThemeChange?: (next: ThemeMode) => void
  /** @hanzo/gui Button size token (default "$2"). */
  size?: string
  /** aria-label override. */
  label?: string
}

const STORAGE_KEY = 'theme'

function readDomTheme(): ThemeMode | undefined {
  if (typeof document === 'undefined') return undefined
  const el = document.documentElement
  if (el.classList.contains('dark')) return 'dark'
  if (el.classList.contains('light')) return 'light'
  try {
    const ls = window.localStorage.getItem(STORAGE_KEY)
    if (ls === 'light' || ls === 'dark') return ls
  } catch {
    /* localStorage may be unavailable */
  }
  return undefined
}

function applyDomTheme(next: ThemeMode): void {
  if (typeof document === 'undefined') return
  const el = document.documentElement
  el.classList.toggle('dark', next === 'dark')
  el.classList.toggle('light', next === 'light')
  el.style.colorScheme = next
  try {
    window.localStorage.setItem(STORAGE_KEY, next)
  } catch {
    /* ignore */
  }
}

/**
 * The framework-agnostic toggle button. Controlled when `theme` is provided; otherwise
 * self-managed via the DOM `.dark` class. No framework dependency — safe on any host.
 */
export function AgnosticThemeToggle({
  theme,
  defaultTheme,
  onToggle,
  onThemeChange,
  size = '$2',
  label,
}: ThemeToggleProps) {
  const controlled = theme !== undefined
  const [internal, setInternal] = useState<ThemeMode>(() => theme ?? defaultTheme ?? readDomTheme() ?? 'dark')
  const current: ThemeMode = controlled ? (theme as ThemeMode) : internal
  const isDark = current === 'dark'
  const track = useEmit()

  const toggle = () => {
    const next: ThemeMode = isDark ? 'light' : 'dark'
    track({ component: 'ThemeToggle', action: 'change', value: next })
    if (!controlled) {
      setInternal(next)
      applyDomTheme(next)
    }
    onToggle?.(next)
    onThemeChange?.(next)
  }

  return (
    <Button
      size={size as never}
      chromeless
      icon={isDark ? <Sun size={16} /> : <Moon size={16} />}
      onPress={toggle}
      aria-label={label ?? (isDark ? 'Switch to light theme' : 'Switch to dark theme')}
    />
  )
}

// @hanzogui/next-theme is an OPTIONAL dependency — loaded only on the uncontrolled,
// no-props path (console/Next). Lazily code-split so non-Next hosts never need it at
// runtime; if it fails to load, the boundary below degrades to the agnostic toggle.
const NextThemeToggle = lazy(() => import('./ThemeToggleNext'))

class NextThemeBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

export function ThemeToggle(props: ThemeToggleProps) {
  const injected =
    props.theme !== undefined || props.onToggle !== undefined || props.onThemeChange !== undefined
  if (injected) return <AgnosticThemeToggle {...props} />

  // No props → keep the existing console/Next behaviour via the optional next-theme
  // path, degrading to the agnostic DOM toggle if it is not installed.
  const fallback = <AgnosticThemeToggle {...props} />
  return (
    <NextThemeBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <NextThemeToggle size={props.size} label={props.label} />
      </Suspense>
    </NextThemeBoundary>
  )
}
