import { describe, expect, it } from "vitest"
import {
  BUILT_IN_THEMES,
  CLAY_THEME,
  ZEN_DARK_DESKTOP_TOKENS,
  ZEN_THEME,
  applyDesktopThemeCssVars,
  buildWorkbenchThemeFromTokens,
  getThemeColorsForAppearance,
} from "./index"

describe("@hanzo/appearance additive desktop theme exports", () => {
  it("exposes ZEN_THEME, CLAY_THEME, CSS variable engine, and workbench mapper", () => {
    expect(BUILT_IN_THEMES.length).toBe(7)
    expect(getThemeColorsForAppearance(ZEN_THEME, "dark")?.codeBackground).toBe("#090909")
    expect(getThemeColorsForAppearance(CLAY_THEME, "dark")?.accent).toBe("#e7e4de")
    expect(ZEN_DARK_DESKTOP_TOKENS.chrome).toBe("#000000")

    applyDesktopThemeCssVars(document, "clay", "dark")
    expect(document.documentElement.dataset.themeId).toBe("clay")
    expect(document.documentElement.style.getPropertyValue("--app-theme-accent")).toBe("#e7e4de")

    const wb = buildWorkbenchThemeFromTokens("clay", "dark")
    expect(wb.colors["titleBar.activeBackground"]).toBe("#161514")
  })
})
