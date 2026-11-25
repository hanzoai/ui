# `@hanzo/theme`

Canonical theme palettes, dynamic design tokens, appearance engine, CSS generator, zero-FOUC pre-paint script, and optional React bindings for every Hanzo surface (`admin.hanzo.ai`, `@hanzo/dev`, `console.hanzo.ai`, `app.hanzo.ai`, desktop, mobile, extensions, and TUI).

## Built-in Themes

| ID | Label | Polarity | Notes |
| --- | --- | --- | --- |
| `zen` | Zen | Dark (OLED `#000000`) | Default Hanzo monochrome dark palette (includes light variant) |
| `clay` | Clay | Dark (warm stone/charcoal) | Pure stone/charcoal grey palette (migrated from legacy `lelouch`) |
| `grove` | Grove | Dark (forest OKLCH) | Botanical green palette (includes light variant) |
| `ocean` | Ocean | Dark (marine OKLCH) | Deep marine blue palette (includes light variant) |
| `ember` | Ember | Dark (amber/terracotta OKLCH) | Warm ember palette (includes light variant) |
| `iris` | Iris | Dark (twilight OKLCH) | Twilight iris palette (includes light variant) |
| `light` | Light | Light (`#fcfcfc` / `#ffffff`) | Crisp daylight palette (includes dark variant) |

Plus `'system'` mode, which tracks `(prefers-color-scheme: dark)` (`zen` in dark mode, `light` in light mode).

Legacy stored IDs migrate silently via `resolveThemeId()`:
- `'lelouch'` → `'clay'`
- `'dark'` / `'hanzo-chat-dark'` → `'zen'`
- `'hanzo-chat'` → `'light'`

## Subpath Exports

- **`@hanzo/theme`** — Pure JS/TS barrel (zero React, zero runtime dependencies)
- **`@hanzo/theme/palettes`** — All 7 built-in themes, 61 `THEME_COLOR_ROLES`, `resolveThemeId`, `parseThemeFile`, `serializeThemeFile`
- **`@hanzo/theme/tokens`** — `AppearanceConfig`, presets (`RADIUS_PRESETS`, `TYPE_RATIOS`, `FONT_FAMILY_STACKS`, `LINE_HEIGHT_VALUES`, `DENSITY_VALUES`, `ACCENT_PRESETS`), `computeThemeVars`, `applyThemeToDocument`, `loadAppearance`, `saveAppearance`, `buildPrePaintScript`
- **`@hanzo/theme/css`** — `themeToCss`, `varsToCssBlock`, `generateThemesStylesheet`, `buildPrePaintScript`, custom CSS security guards
- **`@hanzo/theme/react`** — `'use client'` `<ThemeProvider>` and `useTheme()` hook with OS `matchMedia` and cross-tab `storage` sync
- **`@hanzo/theme/theme.css`** — Pre-generated static stylesheet for `:root` and `[data-theme="..."]`

## Quick Start

### Pure JS / SSR / Extension / TUI (No React)

```ts
import {
  DEFAULT_APPEARANCE,
  applyThemeToDocument,
  buildPrePaintScript,
  computeThemeVars,
  loadAppearance,
  saveAppearance,
} from '@hanzo/theme'

const config = loadAppearance()
const vars = computeThemeVars({ ...config, theme: 'clay', borderRadius: 12, typeRatio: 1.25 })
applyThemeToDocument(config)
saveAppearance({ ...config, accent: '#0ea5e9' })

// Inline in <head> for zero-FOUC first paint
const headScript = buildPrePaintScript()
```

### React

```tsx
import { ThemeProvider, useTheme } from '@hanzo/theme/react'

function Controls() {
  const { config, setTheme, setConfig, isDark } = useTheme()
  return (
    <button onClick={() => setTheme(isDark ? 'light' : 'zen')}>
      Active: {config.theme}
    </button>
  )
}

export function App() {
  return (
    <ThemeProvider>
      <Controls />
    </ThemeProvider>
  )
}
```
