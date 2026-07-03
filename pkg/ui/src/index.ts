// @hanzo/ui — the one Hanzo component library, on @hanzo/gui.
//
//   import { PageHeader, Sparkline, EmptyState, tokens } from '@hanzo/ui'        // product + tokens
//   import { RecordsView, DataTable, registerField } from '@hanzo/ui/data'       // metadata record layer
//
// Two orthogonal concerns, ONE package, zero duplication:
//   • the product/app component layer (this barrel — charts, metrics, headers,
//     status tags, empty states, combobox, slide-over, toasts, reorder, fields), and
//   • the metadata-driven record layer (the `./data` subpath — RecordsView and the
//     typed field editors, whose source of truth is @hanzo/data).
// Both cross-platform (web + native + desktop), presentational, host-agnostic
// (data + effects injected), clean-room. The two layers each own a `DataTable`
// (product = generic typed <T> list; data = field-driven record grid); keeping the
// record layer on the `./data` subpath keeps each name unambiguous.

// Product/app component layer.
export * from './product'

// Design tokens — the calm, dark-first zinc-on-black identity (surface, text,
// accent, tag tones). One source of truth (@hanzo/data's theme), surfaced here
// for convenience so `import { tokens } from '@hanzo/ui'` works.
export { tokens, TAG_TONES, tagTone, type TagTone } from '@hanzo/data'
