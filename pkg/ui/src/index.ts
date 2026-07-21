// @hanzo/ui — the one Hanzo component library, on @hanzo/gui + @hanzo/tokens.
//
// Backend-flexible: one design core (tokens, Hanzo dark-first identity, Geist
// typography), many rendering substrates (see src/backends). The ROOT barrel is
// the canonical component API apps import — the shadcn-compatible surface — plus
// the gui product layer and the design tokens. Pick a backend explicitly via a
// subpath when you want to:
//
//   import { Button, Card, Dialog, DropdownMenu, Input, Toaster } from '@hanzo/ui'  // component API (shadcn backend)
//   import { PageHeader, Sparkline, EmptyState } from '@hanzo/ui/product'           // gui product layer
//   import { RecordsView, registerField } from '@hanzo/ui/data'                     // metadata record layer
//   import { ModelSelector } from '@hanzo/ui/models'                                // unified model picker
//   import { cn, themes, colors } from '@hanzo/ui/core'                             // design core + tokens
//   import '@hanzo/ui/theme.css'                                                    // the self-contained identity
//
// Every component renders solid against any host that defines the standard design
// tokens (which `@hanzo/ui/theme.css` and every consuming app do); nothing
// reaches for app-private token names, and nothing hard-codes a font family —
// UI inherits Geist Sans, code inherits Geist Mono, both through the token theme.

// The canonical component API — the shadcn-compatible surface (Radix behaviour,
// standard-token styling), the DEFAULT (web) backend. This is what
// `import { Button } from '@hanzo/ui'` resolves to.
export * from './backends/shadcn'

// The gui product/app layer (charts, metrics, page headers, status tags, empty
// states, combobox, slide-over, provider marks, theme toggle) lives on its own
// subpath — `@hanzo/ui/product` (alias `@hanzo/ui/gui`). It is a DIFFERENT
// backend (@hanzo/gui / Tamagui) with a cross-platform runtime, so it is kept
// off the root barrel: a web consumer of the component API never pays for the
// native runtime, and each backend stays orthogonal.

// `cn` — the class-name composer, surfaced for convenience.
export { cn } from './core/cn'

// The design-token scale (colors, dark/light themes, radii, spacing, typography)
// lives on the `@hanzo/ui/core` / `@hanzo/ui/tokens` subpath — pure data, no
// runtime. The gui/product theme object (`tokens`, `TAG_TONES`) is on the gui
// backend (`@hanzo/ui/gui`), since it belongs to @hanzo/data's gui world. Keeping
// both off this root barrel is what lets the component API stay a clean,
// web-only import with no native (@hanzo/gui) runtime pulled in.
