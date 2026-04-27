// @hanzo/ui/primitives/bases/gui — Tamagui v7 base.
//
// Source of truth: `hanzogui` (the workspace umbrella in
// ~/work/hanzo/gui/code/ui/hanzogui). This file is a passthrough
// re-export so consumers of @hanzo/ui can pull Tamagui v7 components
// without depending on hanzogui directly. Subpath resolution makes
// `@hanzo/ui/primitives/bases/gui` equivalent to `hanzogui` from a
// caller's perspective, but going through @hanzo/ui keeps the import
// path stable across future stack swaps.
//
// Do NOT re-implement primitives here. If a component is missing from
// `hanzogui`, add it upstream in ~/work/hanzo/gui and let it flow
// through this re-export.

export * from 'hanzogui'
