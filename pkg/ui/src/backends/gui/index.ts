// @hanzo/ui — gui backend.
//
// The cross-platform (web + native/iOS + desktop/Tauri) component layer built on
// @hanzo/gui primitives (YStack/XStack/Text/styled + the gui token config). This
// is the product/app layer — charts, metrics, page headers, status tags, empty
// states, combobox, slide-over, toasts, drag-reorder, labeled field rows,
// provider/product marks, theme toggle — presentational and host-agnostic (data
// and effects are injected as props).
//
// It draws from the SAME design language as the shadcn backend (one token core,
// one Hanzo dark-first identity, Geist typography); the two backends differ only
// in their rendering substrate (gui/Tamagui here, Radix + Tailwind there).

export * from '../../product'

// The gui/product theme object + tag tones (one source of truth, from
// @hanzo/data) — the theme the gui backend renders against. Design-token PRIMITIVES
// (colors, dark/light, radii, spacing) are the runtime-free `@hanzo/ui/core`.
export { tokens, TAG_TONES, tagTone, type TagTone } from '@hanzo/data'
