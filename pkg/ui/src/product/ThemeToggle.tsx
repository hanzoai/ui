'use client'

/**
 * Theme toggle — flips the console between dark and light via next-theme. The
 * provider already wires `NextThemeProvider` → `GuiProvider`, so setting the
 * theme here re-themes the whole tree. Shows the action's target icon (a sun in
 * dark mode, a moon in light mode).
 */
import { Button } from '@hanzo/gui'
import { useThemeSetting } from '@hanzogui/next-theme'
import { Moon, Sun } from '@hanzogui/lucide-icons-2'

export function ThemeToggle() {
  const { current, resolvedTheme, set } = useThemeSetting()
  const isDark = (resolvedTheme ?? current ?? 'dark') !== 'light'
  return (
    <Button
      size="$2"
      chromeless
      icon={isDark ? <Sun size={16} /> : <Moon size={16} />}
      onPress={() => set(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    />
  )
}
