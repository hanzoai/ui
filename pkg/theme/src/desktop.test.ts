import { describe, expect, it } from "vitest"
import {
  APP_THEME_CSS_VARIABLES,
  BUILT_IN_THEMES,
  BUILT_IN_THEME_IDS,
  CLAY_THEME,
  DESKTOP_DIMENSIONS,
  DESKTOP_MOTION,
  DESKTOP_TYPOGRAPHY,
  EMBER_THEME,
  GROVE_THEME,
  HANZO_CHAT_THEME,
  IRIS_THEME,
  OCEAN_THEME,
  THEME_COLOR_ROLES,
  ZEN_DARK_DESKTOP_TOKENS,
  ZEN_DARK_SYNTAX_TOKENS,
  ZEN_THEME,
  applyDesktopThemeCssVars,
  buildDesktopThemeCssVars,
  buildWorkbenchThemeFromTokens,
  getThemeColorsForAppearance,
  resolveLegacyThemeId,
} from "./index"

describe("@hanzo/theme canonical desktop tokens & palettes", () => {
  it("exports canonical Zen Dark tokens and desktop geometry/typography/motion standards", () => {
    expect(ZEN_DARK_DESKTOP_TOKENS.chrome).toBe("#000000")
    expect(ZEN_DARK_DESKTOP_TOKENS.canvas).toBe("#090909")
    expect(ZEN_DARK_DESKTOP_TOKENS.editorBackground).toBe("#090909")
    expect(ZEN_DARK_DESKTOP_TOKENS.sidebar).toBe("#0C0C0C")
    expect(ZEN_DARK_DESKTOP_TOKENS.secondaryPanel).toBe("#0D0D0D")
    expect(ZEN_DARK_DESKTOP_TOKENS.surface).toBe("#141414")
    expect(ZEN_DARK_DESKTOP_TOKENS.hover).toBe("#1B1B1B")
    expect(ZEN_DARK_DESKTOP_TOKENS.rowHover).toBe("#1C1C1C")
    expect(ZEN_DARK_DESKTOP_TOKENS.border).toBe("#222222")
    expect(ZEN_DARK_DESKTOP_TOKENS.text).toBe("#EDEDED")
    expect(ZEN_DARK_DESKTOP_TOKENS.textMuted).toBe("#A3A3A3")
    expect(ZEN_DARK_DESKTOP_TOKENS.subtle).toBe("#777777")

    expect(DESKTOP_DIMENSIONS.toolbarHeightPx).toBe(38)
    expect(DESKTOP_DIMENSIONS.iconSizePx).toBe(16)
    expect(DESKTOP_DIMENSIONS.navIconSizePx).toBe(18)
    expect(DESKTOP_DIMENSIONS.iconStrokeWidth).toBe(1.5)
    expect(DESKTOP_DIMENSIONS.controlHitAreaPx).toBe(28)
    expect(DESKTOP_DIMENSIONS.controlRadiusPx).toBe(6)
    expect(DESKTOP_DIMENSIONS.composerRadiusPx).toBe(16)
    expect(DESKTOP_DIMENSIONS.uiFontSizePx).toBe(13)
    expect(DESKTOP_DIMENSIONS.smallLabelFontSizePx).toBe(11)
    expect(DESKTOP_DIMENSIONS.editorLineHeightPx).toBe(23)
    expect(DESKTOP_DIMENSIONS.leftSidebarWidthPx).toBe(248)
    expect(DESKTOP_DIMENSIONS.rightSidebarWidthPx).toBe(330)
    expect(DESKTOP_DIMENSIONS.bottomPanelHeightPx).toBe(210)
    expect(DESKTOP_DIMENSIONS.editorTabHeightPx).toBe(28)
    expect(DESKTOP_DIMENSIONS.statusBarHeightPx).toBe(23)
    expect(DESKTOP_DIMENSIONS.spacingGridPx).toBe(4)
    expect(DESKTOP_MOTION.hoverTransitionMs).toBe(120)
    expect(DESKTOP_MOTION.hoverEasing).toBe("cubic-bezier(0.32, 0.72, 0, 1)")
    expect(DESKTOP_TYPOGRAPHY.fontSans).toContain('"Zen"')
    expect(DESKTOP_TYPOGRAPHY.fontMono).toContain('"Zen Mono"')
  })

  it("promotes all 7 curated Hanzo Dev palettes with both light and dark variants", () => {
    expect(BUILT_IN_THEMES.map((t) => t.id)).toEqual([...BUILT_IN_THEME_IDS])
    expect(ZEN_THEME.id).toBe("zen")
    expect(CLAY_THEME.id).toBe("clay")
    expect(HANZO_CHAT_THEME.id).toBe("hanzo-chat")
    expect(GROVE_THEME.id).toBe("grove")
    expect(OCEAN_THEME.id).toBe("ocean")
    expect(EMBER_THEME.id).toBe("ember")
    expect(IRIS_THEME.id).toBe("iris")

    for (const theme of BUILT_IN_THEMES) {
      for (const appearance of ["light", "dark"] as const) {
        const colors = getThemeColorsForAppearance(theme, appearance)
        expect(colors, `${theme.id} missing ${appearance}`).not.toBeNull()
        for (const role of THEME_COLOR_ROLES) {
          expect(colors?.[role], `${theme.id}.${appearance}.${role}`).toBeTruthy()
        }
      }
    }

    expect(resolveLegacyThemeId("lelouch")).toBe("clay")
    expect(resolveLegacyThemeId("hanzo-grove")).toBe("grove")
  })

  it("applies all 62 --app-theme-* and --hz-* CSS variables onto Document", () => {
    const vars = applyDesktopThemeCssVars(document, "zen", "dark")
    expect(document.documentElement.dataset.themeId).toBe("zen")
    expect(document.documentElement.classList.contains("dark")).toBe(true)
    expect(document.documentElement.style.colorScheme).toBe("dark")

    for (const role of THEME_COLOR_ROLES) {
      const cssVar = APP_THEME_CSS_VARIABLES[role]
      expect(document.documentElement.style.getPropertyValue(cssVar)).toBe(vars[cssVar])
    }
    expect(document.documentElement.style.getPropertyValue("--hz-chrome")).toBe("#000000")
    expect(document.documentElement.style.getPropertyValue("--hz-canvas")).toBe("#090909")
    expect(document.documentElement.style.getPropertyValue("--hz-surface")).toBe("#141414")
    expect(document.documentElement.style.getPropertyValue("--hz-toolbar-height")).toBe("38px")

    const clayVars = buildDesktopThemeCssVars("clay", "dark")
    expect(clayVars["--app-theme-accent"]).toBe("#e7e4de")
    expect(clayVars["--hz-chrome"]).toBe("#161514")
  })

  it("maps Zen, Clay, and all OKLCH palettes onto strict hex VS Code / Monaco themes with zero VS Code blue-gray", () => {
    const zenDark = buildWorkbenchThemeFromTokens("zen", "dark")
    expect(zenDark.colors["titleBar.activeBackground"]).toBe("#000000")
    expect(zenDark.colors["statusBar.background"]).toBe("#000000")
    expect(zenDark.colors["editor.background"]).toBe("#090909")
    expect(zenDark.colors["editor.foreground"]).toBe("#d5d5d5")
    expect(zenDark.colors["sideBar.background"]).toBe("#0C0C0C")
    expect(zenDark.colors["quickInput.background"]).toBe("#141414")
    expect(zenDark.colors["editorWidget.background"]).toBe("#141414")
    expect(zenDark.syntax).toEqual(ZEN_DARK_SYNTAX_TOKENS)
    expect(zenDark.syntax.keyword).toBe("#b9a6d2")
    expect(zenDark.syntax.string).toBe("#a8be9e")
    expect(zenDark.syntax.comment).toBe("#777777")
    expect(zenDark.syntax.function).toBe("#c5b68f")
    expect(zenDark.syntax.type).toBe("#a5bacb")

    const forbidden = ["#1e1e1e", "#252526", "#007acc", "#0078d4", "#68217a"]
    for (const id of BUILT_IN_THEME_IDS) {
      for (const mode of ["dark", "light"] as const) {
        const wb = buildWorkbenchThemeFromTokens(id, mode)
        const json = JSON.stringify(wb).toLowerCase()
        for (const bad of forbidden) {
          expect(json, `${id}-${mode} contains forbidden stock VS Code color ${bad}`).not.toContain(
            bad,
          )
        }
        expect(json, `${id}-${mode} leaked unparsed oklch()`).not.toContain("oklch(")
        for (const [key, val] of Object.entries(wb.colors)) {
          expect(val, `${id}-${mode} color ${key}`).toMatch(/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/)
        }
        for (const rule of wb.monacoTheme.rules) {
          if (rule.foreground) {
            expect(rule.foreground).toMatch(/^[0-9a-fA-F]{6}$/)
          }
        }
      }
    }
  })
})
