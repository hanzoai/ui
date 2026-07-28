// @hanzo/ui — the one Hanzo component library, on @hanzo/gui + @hanzo/tokens.
//
// ONE substrate: every component renders through @hanzo/gui primitives, so the
// same import works on web, native (expo) and desktop (Tauri). The ROOT barrel is
// the canonical component API apps import; the product layer and the design
// tokens are their own subpaths, so importing a Button never drags in a chart.
//
//   import { Button, Card, Dialog, DropdownMenu, Input, Toaster } from '@hanzo/ui'  // component API
//   import { PageHeader, Sparkline, EmptyState } from '@hanzo/ui/product'           // product/app layer
//   import { RecordsView, registerField } from '@hanzo/ui/data'                     // metadata record layer
//   import { ModelSelector } from '@hanzo/ui/models'                                // unified model picker
//   import { cn, themes, colors } from '@hanzo/ui/core'                             // design core + tokens
//   import '@hanzo/ui/theme.css'                                                    // the self-contained identity
//
// Styling is theme tokens, never utility classes: `$background`, `$color12`,
// `$borderColor` resolve through the gui token config on every host. Touch
// targets meet the 44px floor via `hitSlop`, never via padding.
export * from './backends/gui'

// `cn` — the class-name composer, surfaced for convenience.
export { cn } from './core/cn'

// The design-token scale (colors, dark/light themes, radii, spacing, typography)
// lives on the `@hanzo/ui/core` / `@hanzo/ui/tokens` subpath — pure data, no
// runtime.
