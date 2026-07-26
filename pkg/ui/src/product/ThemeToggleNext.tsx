'use client'

/**
 * ThemeToggleNext — the @hanzogui/next-theme binding (console / Next). This is the ONLY
 * module that imports @hanzogui/next-theme, so it stays an OPTIONAL dependency: the base
 * ThemeToggle lazy-loads it (default export) and non-Next hosts never pull it in unless
 * they import this component directly. UI is delegated to the framework-agnostic button
 * in controlled mode, so every toggle looks identical.
 */
import { useThemeSetting } from '@hanzogui/next-theme'
import { AgnosticThemeToggle, type ThemeToggleProps } from './ThemeToggle'

function ThemeToggleNext({ size, label }: Pick<ThemeToggleProps, 'size' | 'label'>) {
  const { current, resolvedTheme, set } = useThemeSetting()
  const isDark = (resolvedTheme ?? current ?? 'dark') !== 'light'
  return (
    <AgnosticThemeToggle
      theme={isDark ? 'dark' : 'light'}
      onToggle={(next) => set(next)}
      size={size}
      label={label}
    />
  )
}

export default ThemeToggleNext
export { ThemeToggleNext }
