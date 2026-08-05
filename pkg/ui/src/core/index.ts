// @hanzo/ui — design core.
//
// Backend-agnostic foundation every backend draws from: the class-name composer,
// the design tokens (from @hanzo/design), and the Geist typography variables.
//
// ESM-ONLY, and so is `@hanzo/ui/tokens`: @hanzo/design is `"type": "module"`
// with no `require` condition, so a CJS build of this subpath cannot load it.
// The `require` condition is removed from both subpaths in package.json rather
// than left to crash deep inside design at run time. The MAIN barrel is
// unaffected — it pulls `./core/cn` directly, not this file.
// The visual identity these describe is emitted as CSS by `theme.css`.

export { cn } from './cn'
export { fonts, fontSans, fontMono, FONT_SANS_VAR, FONT_MONO_VAR } from './fonts'
export * from './tokens'
