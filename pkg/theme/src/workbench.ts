import {
  ZEN_DARK_DESKTOP_TOKENS,
  ZEN_DARK_SYNTAX_TOKENS,
  ZEN_LIGHT_DESKTOP_TOKENS,
  ZEN_LIGHT_SYNTAX_TOKENS,
  resolveLegacyThemeId,
  type DesktopSyntaxTokens,
  type ThemeAppearance,
  type ThemeColors,
  type ThemeDefinition,
} from "@hanzo/tokens/desktop"

import { colorToHex, mixColorsToHex, withAlphaHex } from "./color-convert"
import { getBuiltInTheme, resolveDesktopThemeColors } from "./palettes"

export interface TextMateTokenRule {
  readonly name?: string
  readonly scope: string | ReadonlyArray<string>
  readonly settings: {
    readonly foreground?: string
    readonly fontStyle?: string
  }
}

export interface MonacoThemeRule {
  readonly token: string
  readonly foreground?: string
  readonly fontStyle?: string
}

export interface MonacoStandaloneThemeData {
  readonly base: "vs-dark" | "vs"
  readonly inherit: boolean
  readonly rules: ReadonlyArray<MonacoThemeRule>
  readonly colors: Record<string, string>
}

export interface TerminalThemePalette {
  readonly background: string
  readonly foreground: string
  readonly cursor: string
  readonly cursorAccent: string
  readonly selectionBackground: string
  readonly black: string
  readonly red: string
  readonly green: string
  readonly yellow: string
  readonly blue: string
  readonly magenta: string
  readonly cyan: string
  readonly white: string
  readonly brightBlack: string
  readonly brightRed: string
  readonly brightGreen: string
  readonly brightYellow: string
  readonly brightBlue: string
  readonly brightMagenta: string
  readonly brightCyan: string
  readonly brightWhite: string
}

export interface WorkbenchThemePayload {
  readonly id: string
  readonly name: string
  readonly label: string
  readonly themeId: string
  readonly appearance: ThemeAppearance
  readonly type: ThemeAppearance
  readonly base: "vs-dark" | "vs"
  readonly colors: Record<string, string>
  readonly tokenColors: ReadonlyArray<TextMateTokenRule>
  readonly semanticHighlighting: true
  readonly semanticTokenColors: Record<string, string | { readonly foreground: string; readonly fontStyle?: string }>
  readonly workbenchColorCustomizations: Record<string, unknown>
  readonly tokenColorCustomizations: {
    readonly textMateRules: ReadonlyArray<TextMateTokenRule>
  }
  readonly monacoTheme: MonacoStandaloneThemeData
  readonly terminalTheme: TerminalThemePalette
  readonly syntax: DesktopSyntaxTokens
}

function buildSyntaxTokensForPalette(
  colors: ThemeColors,
  appearance: ThemeAppearance,
  isZen: boolean,
): DesktopSyntaxTokens {
  if (isZen) {
    return appearance === "dark" ? ZEN_DARK_SYNTAX_TOKENS : ZEN_LIGHT_SYNTAX_TOKENS
  }

  const base = appearance === "dark" ? ZEN_DARK_SYNTAX_TOKENS : ZEN_LIGHT_SYNTAX_TOKENS
  const fg = colorToHex(colors.codeForeground)
  const muted = colorToHex(colors.textMuted)
  const accent = colorToHex(colors.accent)
  const action = colorToHex(colors.messageAction)

  // Gently harmonize the restrained Zen muted palette with 18% of the theme's pigment
  // so syntax stays calm, high-contrast, and cohesive across Clay, Grove, Ocean, Ember, Iris.
  return {
    foreground: mixColorsToHex(fg, base.foreground, 0.35),
    keyword: mixColorsToHex(base.keyword, accent, 0.22),
    string: mixColorsToHex(base.string, action, 0.14),
    comment: mixColorsToHex(base.comment, muted, 0.45),
    function: mixColorsToHex(base.function, accent, 0.15),
    type: mixColorsToHex(base.type, accent, 0.18),
    number: mixColorsToHex(base.number, action, 0.16),
    constant: mixColorsToHex(base.constant, accent, 0.2),
    variable: mixColorsToHex(fg, base.variable, 0.35),
    property: mixColorsToHex(base.property, fg, 0.25),
    operator: mixColorsToHex(base.operator, muted, 0.35),
    punctuation: mixColorsToHex(base.punctuation, muted, 0.4),
  }
}

function buildTextMateRules(syntax: DesktopSyntaxTokens, appearance: ThemeAppearance): ReadonlyArray<TextMateTokenRule> {
  const inserted = appearance === "dark" ? "#a8be9e" : "#2f6b40"
  const deleted = appearance === "dark" ? "#d4848a" : "#b4232c"

  return [
    {
      name: "Default foreground",
      scope: ["source", "text", "variable", "identifier", "meta.block"],
      settings: { foreground: syntax.foreground },
    },
    {
      name: "Comments",
      scope: ["comment", "punctuation.definition.comment", "string.quoted.docstring"],
      settings: { foreground: syntax.comment, fontStyle: "italic" },
    },
    {
      name: "Keywords & Storage",
      scope: [
        "keyword",
        "keyword.control",
        "keyword.other",
        "storage",
        "storage.type",
        "storage.modifier",
      ],
      settings: { foreground: syntax.keyword },
    },
    {
      name: "Operators",
      scope: ["keyword.operator", "punctuation.accessor"],
      settings: { foreground: syntax.operator },
    },
    {
      name: "Strings",
      scope: [
        "string",
        "string.quoted",
        "string.template",
        "string.regexp",
        "markup.inline.raw",
      ],
      settings: { foreground: syntax.string },
    },
    {
      name: "Functions & Methods",
      scope: [
        "entity.name.function",
        "support.function",
        "meta.function-call.generic",
        "variable.function",
      ],
      settings: { foreground: syntax.function },
    },
    {
      name: "Types, Classes & Interfaces",
      scope: [
        "entity.name.type",
        "entity.name.class",
        "entity.other.inherited-class",
        "support.type",
        "support.class",
        "entity.name.namespace",
      ],
      settings: { foreground: syntax.type },
    },
    {
      name: "Numbers & Constants",
      scope: [
        "constant.numeric",
        "constant.language",
        "constant.character",
        "support.constant",
      ],
      settings: { foreground: syntax.number },
    },
    {
      name: "Object Keys, Properties & HTML Attributes",
      scope: [
        "variable.other.property",
        "support.type.property-name",
        "meta.object-literal.key",
        "entity.other.attribute-name",
      ],
      settings: { foreground: syntax.property },
    },
    {
      name: "Tags",
      scope: ["entity.name.tag", "support.class.component"],
      settings: { foreground: syntax.keyword },
    },
    {
      name: "Punctuation & Braces",
      scope: ["punctuation", "meta.brace", "punctuation.separator", "punctuation.terminator"],
      settings: { foreground: syntax.punctuation },
    },
    {
      name: "Markdown Headings",
      scope: ["markup.heading", "entity.name.section"],
      settings: { foreground: syntax.foreground, fontStyle: "bold" },
    },
    {
      name: "Diff Inserted",
      scope: ["markup.inserted"],
      settings: { foreground: inserted },
    },
    {
      name: "Diff Deleted",
      scope: ["markup.deleted"],
      settings: { foreground: deleted },
    },
  ]
}

function stripHash(hex: string): string {
  return hex.startsWith("#") ? hex.slice(1, 7) : hex
}

function buildMonacoRules(syntax: DesktopSyntaxTokens): ReadonlyArray<MonacoThemeRule> {
  return [
    { token: "", foreground: stripHash(syntax.foreground) },
    { token: "comment", foreground: stripHash(syntax.comment), fontStyle: "italic" },
    { token: "keyword", foreground: stripHash(syntax.keyword) },
    { token: "storage", foreground: stripHash(syntax.keyword) },
    { token: "operator", foreground: stripHash(syntax.operator) },
    { token: "delimiter", foreground: stripHash(syntax.punctuation) },
    { token: "string", foreground: stripHash(syntax.string) },
    { token: "regexp", foreground: stripHash(syntax.string) },
    { token: "number", foreground: stripHash(syntax.number) },
    { token: "constant", foreground: stripHash(syntax.constant) },
    { token: "type", foreground: stripHash(syntax.type) },
    { token: "type.identifier", foreground: stripHash(syntax.type) },
    { token: "class", foreground: stripHash(syntax.type) },
    { token: "function", foreground: stripHash(syntax.function) },
    { token: "identifier", foreground: stripHash(syntax.variable) },
    { token: "variable", foreground: stripHash(syntax.variable) },
    { token: "key", foreground: stripHash(syntax.property) },
    { token: "attribute.name", foreground: stripHash(syntax.property) },
    { token: "attribute.value", foreground: stripHash(syntax.string) },
    { token: "tag", foreground: stripHash(syntax.keyword) },
  ]
}

/**
 * Deterministically maps ANY Hanzo Desktop `ThemeColors` palette (`zen`, `clay`, `hanzo-chat`,
 * `grove`, `ocean`, `ember`, `iris`, light or dark) onto the complete VS Code / Monaco
 * `workbench.colorCustomizations` + `tokenColors` + `MonacoStandaloneThemeData` + `xterm` theme.
 *
 * Guarantees zero stock VS Code `#1e1e1e`, `#252526`, `#007acc`, `#0078d4`, or `#68217a`.
 */
export function buildWorkbenchThemeFromTokens(
  themeOrId: ThemeDefinition | ThemeColors | string = "zen",
  appearance: ThemeAppearance = "dark",
): WorkbenchThemePayload {
  const resolvedColors = resolveDesktopThemeColors(themeOrId, appearance)
  const builtIn = typeof themeOrId === "string" ? getBuiltInTheme(themeOrId) : null
  const themeId =
    builtIn?.id ??
    (typeof themeOrId === "string"
      ? resolveLegacyThemeId(themeOrId.trim().toLowerCase())
      : "id" in themeOrId
        ? themeOrId.id
        : "custom")
  const themeLabel =
    builtIn?.label ??
    (typeof themeOrId === "object" && "label" in themeOrId
      ? themeOrId.label
      : themeId.charAt(0).toUpperCase() + themeId.slice(1))

  const isZen = themeId === "zen" || themeId === "dark" || themeId === "light"
  const isDark = appearance === "dark"

  // Canonical surface geometry & colors
  const chrome =
    isZen && isDark
      ? ZEN_DARK_DESKTOP_TOKENS.chrome
      : isZen
        ? ZEN_LIGHT_DESKTOP_TOKENS.chrome
        : colorToHex(resolvedColors.chrome)
  const editorBg =
    isZen && isDark
      ? ZEN_DARK_DESKTOP_TOKENS.editorBackground
      : isZen
        ? ZEN_LIGHT_DESKTOP_TOKENS.editorBackground
        : colorToHex(resolvedColors.codeBackground)
  const sidebarBg =
    isZen && isDark
      ? ZEN_DARK_DESKTOP_TOKENS.sidebar
      : isZen
        ? ZEN_LIGHT_DESKTOP_TOKENS.sidebar
        : colorToHex(resolvedColors.sidebar)
  const panelBg =
    isZen && isDark
      ? ZEN_DARK_DESKTOP_TOKENS.secondaryPanel
      : isZen
        ? ZEN_LIGHT_DESKTOP_TOKENS.secondaryPanel
        : mixColorsToHex(sidebarBg, editorBg, 0.35)
  const surface =
    isZen && isDark
      ? ZEN_DARK_DESKTOP_TOKENS.surface
      : isZen
        ? ZEN_LIGHT_DESKTOP_TOKENS.surfaceRaised
        : colorToHex(resolvedColors.surfaceRaised)
  const overlay =
    isZen && isDark
      ? ZEN_DARK_DESKTOP_TOKENS.surfaceOverlay
      : isZen
        ? ZEN_LIGHT_DESKTOP_TOKENS.surfaceOverlay
        : colorToHex(resolvedColors.surfaceOverlay)
  const hover =
    isZen && isDark
      ? ZEN_DARK_DESKTOP_TOKENS.hover
      : isZen
        ? ZEN_LIGHT_DESKTOP_TOKENS.hover
        : colorToHex(resolvedColors.toolbarControlHover)
  const rowHover =
    isZen && isDark
      ? ZEN_DARK_DESKTOP_TOKENS.rowHover
      : isZen
        ? ZEN_LIGHT_DESKTOP_TOKENS.rowHover
        : colorToHex(resolvedColors.sidebarRowHover)
  const rowSelected = isZen && isDark ? "#202020" : colorToHex(resolvedColors.sidebarRowSelected)
  const border =
    isZen && isDark
      ? ZEN_DARK_DESKTOP_TOKENS.border
      : isZen
        ? ZEN_LIGHT_DESKTOP_TOKENS.border
        : colorToHex(resolvedColors.border)
  const text =
    isZen && isDark
      ? ZEN_DARK_DESKTOP_TOKENS.text
      : isZen
        ? ZEN_LIGHT_DESKTOP_TOKENS.text
        : colorToHex(resolvedColors.text)
  const textMuted =
    isZen && isDark
      ? ZEN_DARK_DESKTOP_TOKENS.textMuted
      : isZen
        ? ZEN_LIGHT_DESKTOP_TOKENS.textMuted
        : colorToHex(resolvedColors.textMuted)
  const subtle =
    isZen && isDark
      ? ZEN_DARK_DESKTOP_TOKENS.subtle
      : isZen
        ? ZEN_LIGHT_DESKTOP_TOKENS.subtle
        : mixColorsToHex(textMuted, editorBg, 0.3)

  const accent = colorToHex(resolvedColors.accent)
  const accentFg = colorToHex(resolvedColors.accentForeground)
  const action = colorToHex(resolvedColors.messageAction)
  const actionFg = colorToHex(resolvedColors.messageActionForeground)
  const actionHover = colorToHex(resolvedColors.messageActionHover)
  const error = colorToHex(resolvedColors.error)
  const warning = colorToHex(resolvedColors.warning)
  const success = isDark ? "#82a681" : "#2f7d4a"
  const searchMatchBg = withAlphaHex(colorToHex(resolvedColors.searchMatchBackground), 0.42)
  const searchMatchActiveBg = withAlphaHex(colorToHex(resolvedColors.searchMatchActiveBackground), 0.65)
  const selectionBg = isZen && isDark ? "#262626aa" : withAlphaHex(accent, isDark ? 0.24 : 0.18)
  const lineHighlight = isZen && isDark ? "#121212" : mixColorsToHex(editorBg, hover, 0.45)
  const tabBarBg = isZen && isDark ? "#0b0b0b" : mixColorsToHex(chrome, editorBg, 0.35)
  const activeTabBg = isZen && isDark ? "#191919" : mixColorsToHex(editorBg, hover, 0.5)
  const termBg = isZen && isDark ? "#0c0c0c" : colorToHex(resolvedColors.terminalBackground)
  const termFg = colorToHex(resolvedColors.terminalForeground)
  const termCursor = colorToHex(resolvedColors.terminalCursor)
  const termSelection = colorToHex(resolvedColors.terminalSelection)

  const syntax = buildSyntaxTokensForPalette(resolvedColors, appearance, isZen)
  const tokenColors = buildTextMateRules(syntax, appearance)

  const colors: Record<string, string> = {
    // Base & Focus
    foreground: text,
    descriptionForeground: textMuted,
    disabledForeground: subtle,
    focusBorder: border,
    errorForeground: error,
    "widget.border": border,
    "widget.shadow": isDark ? "#00000088" : "#00000018",
    "selection.background": selectionBg,
    "icon.foreground": textMuted,
    "sash.hoverBorder": isDark ? "#858585" : textMuted,
    contrastBorder: "#00000000",
    contrastActiveBorder: "#00000000",

    // Title Bar & Command Center (38px Chrome)
    "titleBar.activeBackground": chrome,
    "titleBar.activeForeground": text,
    "titleBar.inactiveBackground": chrome,
    "titleBar.inactiveForeground": subtle,
    "titleBar.border": border,
    "commandCenter.background": isZen && isDark ? "#111111" : surface,
    "commandCenter.activeBackground": hover,
    "commandCenter.foreground": textMuted,
    "commandCenter.activeForeground": text,
    "commandCenter.border": border,

    // Activity Bar & Side Bar
    "activityBar.background": sidebarBg,
    "activityBar.foreground": text,
    "activityBar.inactiveForeground": subtle,
    "activityBar.activeBorder": accent,
    "activityBar.border": border,
    "activityBarBadge.background": action,
    "activityBarBadge.foreground": actionFg,
    "sideBar.background": sidebarBg,
    "sideBar.foreground": text,
    "sideBar.border": border,
    "sideBarTitle.foreground": text,
    "sideBarSectionHeader.background": sidebarBg,
    "sideBarSectionHeader.foreground": textMuted,
    "sideBarSectionHeader.border": border,

    // Editor Stage & Tabs
    "editor.background": editorBg,
    "editor.foreground": syntax.foreground,
    "editorLineNumber.foreground": isZen && isDark ? "#666666" : subtle,
    "editorLineNumber.activeForeground": textMuted,
    "editorCursor.foreground": isZen && isDark ? "#eeeeee" : accent,
    "editor.selectionBackground": selectionBg,
    "editor.inactiveSelectionBackground": withAlphaHex(hover, 0.7),
    "editor.lineHighlightBackground": lineHighlight,
    "editor.lineHighlightBorder": "#00000000",
    "editor.findMatchBackground": searchMatchActiveBg,
    "editor.findMatchHighlightBackground": searchMatchBg,
    "editorBracketMatch.background": withAlphaHex(hover, 0.8),
    "editorBracketMatch.border": border,
    "editorIndentGuide.background1": withAlphaHex(border, 0.55),
    "editorIndentGuide.activeBackground1": subtle,
    "editorGutter.background": editorBg,
    "editorGutter.addedBackground": success,
    "editorGutter.modifiedBackground": textMuted,
    "editorGutter.deletedBackground": error,
    "editorError.foreground": error,
    "editorWarning.foreground": warning,
    "editorGroup.border": border,
    "editorGroupHeader.tabsBackground": tabBarBg,
    "editorGroupHeader.tabsBorder": border,
    "editorGroupHeader.noTabsBackground": tabBarBg,
    "tab.activeBackground": activeTabBg,
    "tab.activeForeground": text,
    "tab.inactiveBackground": tabBarBg,
    "tab.inactiveForeground": subtle,
    "tab.hoverBackground": hover,
    "tab.hoverForeground": text,
    "tab.border": "#00000000",
    "tab.activeBorderTop": "#00000000",

    // Elevated Surfaces: Widgets, Suggest, Hover, Command Palette, Menus, Inputs
    "editorWidget.background": surface,
    "editorWidget.foreground": text,
    "editorWidget.border": border,
    "editorSuggestWidget.background": surface,
    "editorSuggestWidget.foreground": text,
    "editorSuggestWidget.border": border,
    "editorSuggestWidget.selectedBackground": rowHover,
    "editorSuggestWidget.highlightForeground": accent,
    "editorHoverWidget.background": surface,
    "editorHoverWidget.foreground": text,
    "editorHoverWidget.border": border,
    "quickInput.background": overlay,
    "quickInput.foreground": text,
    "quickInputTitle.background": surface,
    "quickInputList.focusBackground": rowSelected,
    "quickInputList.focusForeground": text,
    "menu.background": overlay,
    "menu.foreground": text,
    "menu.selectionBackground": hover,
    "menu.selectionForeground": text,
    "menu.separatorBackground": border,
    "menu.border": border,
    "dropdown.background": surface,
    "dropdown.foreground": text,
    "dropdown.border": border,
    "input.background": surface,
    "input.foreground": text,
    "input.placeholderForeground": subtle,
    "input.border": border,
    "inputOption.activeBorder": accent,
    "inputOption.activeBackground": hover,
    "inputOption.activeForeground": text,

    // Buttons, Badges & Lists
    "button.background": action,
    "button.foreground": actionFg,
    "button.hoverBackground": actionHover,
    "button.secondaryBackground": surface,
    "button.secondaryForeground": text,
    "button.secondaryHoverBackground": hover,
    "badge.background": surface,
    "badge.foreground": text,
    "progressBar.background": accent,
    "list.hoverBackground": rowHover,
    "list.hoverForeground": text,
    "list.activeSelectionBackground": rowSelected,
    "list.activeSelectionForeground": text,
    "list.inactiveSelectionBackground": rowHover,
    "list.inactiveSelectionForeground": text,
    "list.focusBackground": rowSelected,
    "list.focusForeground": text,
    "list.highlightForeground": accent,

    // Bottom Panel, Terminal & Status Bar
    "panel.background": panelBg,
    "panel.border": border,
    "panelTitle.activeBorder": text,
    "panelTitle.activeForeground": text,
    "panelTitle.inactiveForeground": subtle,
    "terminal.background": termBg,
    "terminal.foreground": termFg,
    "terminalCursor.foreground": termCursor,
    "terminal.selectionBackground": termSelection,
    "statusBar.background": chrome,
    "statusBar.foreground": subtle,
    "statusBar.noFolderBackground": chrome,
    "statusBar.noFolderForeground": subtle,
    "statusBar.debuggingBackground": surface,
    "statusBar.debuggingForeground": text,
    "statusBar.border": border,

    // Breadcrumbs, Scrollbars, Diff & Git Decorations
    "breadcrumb.background": editorBg,
    "breadcrumb.foreground": subtle,
    "breadcrumb.focusForeground": text,
    "breadcrumb.activeSelectionForeground": text,
    "scrollbar.shadow": "#00000000",
    "scrollbarSlider.background": withAlphaHex(textMuted, 0.22),
    "scrollbarSlider.hoverBackground": withAlphaHex(textMuted, 0.38),
    "scrollbarSlider.activeBackground": withAlphaHex(textMuted, 0.5),
    "diffEditor.insertedTextBackground": withAlphaHex(success, 0.16),
    "diffEditor.removedTextBackground": withAlphaHex(error, 0.16),
    "gitDecoration.addedResourceForeground": success,
    "gitDecoration.modifiedResourceForeground": syntax.function,
    "gitDecoration.deletedResourceForeground": error,
    "gitDecoration.untrackedResourceForeground": syntax.string,
    "gitDecoration.ignoredResourceForeground": subtle,
    "gitDecoration.conflictingResourceForeground": warning,
    "notifications.background": overlay,
    "notifications.foreground": text,
    "notifications.border": border,
    "textLink.foreground": accentFg === "#ffffff" && !isDark ? accent : isZen ? text : accent,
    "textLink.activeForeground": text,
    "testing.iconPassed": success,
    "testing.iconFailed": error,
  }

  const semanticTokenColors: Record<string, string | { readonly foreground: string; readonly fontStyle?: string }> = {
    namespace: syntax.type,
    class: syntax.type,
    interface: syntax.type,
    enum: syntax.type,
    type: syntax.type,
    typeParameter: syntax.type,
    function: syntax.function,
    method: syntax.function,
    property: syntax.property,
    variable: syntax.variable,
    parameter: syntax.variable,
    "variable.readonly": syntax.constant,
    keyword: syntax.keyword,
    string: syntax.string,
    number: syntax.number,
    comment: { foreground: syntax.comment, fontStyle: "italic" },
  }

  const base: "vs-dark" | "vs" = isDark ? "vs-dark" : "vs"
  const id = `hanzo-${themeId}-${appearance}`
  const label = `Hanzo ${themeLabel} ${isDark ? "Dark" : "Light"}`

  const workbenchColorCustomizations: Record<string, unknown> = {
    ...colors,
    ...(isDark
      ? {
          "[Default Dark Modern]": colors,
          "[Default Dark+]": colors,
        }
      : {
          "[Default Light Modern]": colors,
          "[Default Light+]": colors,
        }),
  }

  const terminalTheme: TerminalThemePalette = {
    background: termBg,
    foreground: termFg,
    cursor: termCursor,
    cursorAccent: termBg,
    selectionBackground: termSelection,
    black: isDark ? "#141414" : "#18181b",
    red: error,
    green: syntax.string,
    yellow: syntax.function,
    blue: syntax.type,
    magenta: syntax.keyword,
    cyan: mixColorsToHex(syntax.type, syntax.string, 0.45),
    white: isDark ? "#d5d5d5" : "#e4e4e7",
    brightBlack: subtle,
    brightRed: error,
    brightGreen: syntax.string,
    brightYellow: syntax.function,
    brightBlue: syntax.type,
    brightMagenta: syntax.keyword,
    brightCyan: mixColorsToHex(syntax.type, syntax.string, 0.45),
    brightWhite: isDark ? "#ffffff" : "#fafafa",
  }

  return {
    id,
    name: label,
    label,
    themeId,
    appearance,
    type: appearance,
    base,
    colors,
    tokenColors,
    semanticHighlighting: true,
    semanticTokenColors,
    workbenchColorCustomizations,
    tokenColorCustomizations: {
      textMateRules: tokenColors,
    },
    monacoTheme: {
      base,
      inherit: true,
      rules: buildMonacoRules(syntax),
      colors,
    },
    terminalTheme,
    syntax,
  }
}
