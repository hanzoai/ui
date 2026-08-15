// @hanzo/ui/product — the product/app component layer on @hanzo/gui.
//
// Charts, metrics, page headers, status tags, rich empty states, combobox,
// slide-over, toasts, drag-reorder, labeled field rows, provider/product marks,
// theme toggle. Presentational + host-agnostic: data and effects are INJECTED as
// props — nothing here imports an app's `~/lib`. Cross-platform (web + native +
// desktop) because it builds only on @hanzo/gui primitives. Clean-room.
//
// Single collision-free namespace: where a name exists in two files the canonical
// (Charts) keeps the name and the variant is aliased, so NOTHING is dropped.

// Charts — the canonical Sparkline + Donut live here (dependency-free inline SVG:
// hover tooltips, axis ticks, honest null under 2 real points).
export * from './Charts'

// Metric — resource-console stat tiles/panels/bars. Its own near-identical
// Sparkline is preserved as `MetricSparkline` (zero loss; see CONSOLIDATION.md
// for the eventual single-Sparkline dedup).
export {
  SERIES,
  colorForIndex,
  utilColor,
  Sparkline as MetricSparkline,
  MiniBars,
  UtilBar,
  LegendDot,
  MetricCard,
  HintButton,
  Panel,
} from './Metric'

// Standalone dependency-free ring — aliased to avoid the Charts.Donut clash.
export { Donut as DonutRing, type DonutSegment } from './Donut'

// ComboBox — the typeable select. `ComboOption` comes from the ONE pure filter
// module (ReDoS-safe literal substring), so export the component here and the
// option type + matchers from there.
export { ComboBox } from './ComboBox'
export * from './combobox/filter'

// The shared shell — brand mark, org scope + switcher, account menu, app header
// (the console's org-scope contract + switcher hoisted here; hanzoai/ui#36).
// `surfaces.data` is the ONE canonical cross-surface list every launcher consumes.
//
// `UserMenu` is the account half of the chrome trio (org · apps · account). It
// was written inside `AppHeader` and unreachable from anywhere else, so five
// surfaces wrote their own; `AppHeader` now renders this one.
export * from './surfaces.data'
export * from './AppHeader'
export * from './BrandMark'
export * from './OrgMark'
export * from './OrgSwitcher'
export * from './UserMenu'
export * from './scope'

// Menu — the ONE menu system: portal-theme-safe DropdownMenu (click) + ContextMenu
// (right-click), both rendering the SAME item spec (MenuPanel/MenuItemView) so every
// menu across the fleet is pixel-identical. SelectMenu/ComboBox share the same spec.
export * from './menu'

// Site chrome — the RENDERER for @hanzo/products' header/launcher/footer models.
// That package decides what the navigation is; these two draw it, so every
// property shares one bar and one footer instead of a hand-written copy each.
export * from './SiteNav'
export * from './SiteFooter'

// Admin surface — the honest-state + list layer every admin console renders.
// `host` is the ONE seam an app injects its router/auth effects through;
// `CommerceResource` is the ONE store-list surface (console Store + Commerce admin).
export * from './host'
export * from './BackendState'
export * from './CommerceResource'
export * from './ConfirmDelete'
export * from './Filters'

// Instrumentation — the ONE place a shared component reports what a user did.
// Every component above already emits through it, so a product gets the whole
// interaction vocabulary by rendering the library. Apps only need the optional
// `<InstrumentSurface value="billing">` to name the area, and `emit` for the
// one-off moments no shared component can observe.
export * from './instrument'

// Settings — `Fieldset` is the titled group the `Field*` rows sit in. It is not
// `Panel` (a dashboard metric tile): a settings group runs full width, carries a
// legend and has a destructive register. Every settings page drew its own.
export * from './Fieldset'

// `CopyButton` and `SecretInput` — copying a value, and revealing one. CopyButton
// lived in `chat/Code.tsx`, reachable only as `@hanzo/ui/chat`, so ~30 hand-rolled
// copies grew across six surfaces; `Code` now imports it from here. SecretInput
// composes it, because copying a key while it is still masked is the whole reason
// the field exists.
export * from './CopyButton'
export * from './SecretInput'

// `Pagination` — the fixed-width page run (`pages` is the pure rule, testable
// without a browser).
export * from './Pagination'

// The rest — every exported name below is unique across the layer.
export * from './AnimatedLogo'
export * from './brand'
export * from './DataTable'
export * from './Workbench'
export * from './EmptyState'
export * from './FadeIn'
export * from './Field'
export * from './HanzoMark'
export * from './PageHeader'

// Palette — the ONE ⌘K bar, plus its opener. The list it renders is not written
// down anywhere: cloud publishes `GET /v1/commands`, the fifth projection of the
// one route table, and a surface passes it in. `match.ts` holds the matching
// rule (safe methods browse, unsafe methods must be named) as pure functions.
export * from './Palette'
export * from './match'
export * from './useCommandK'
export * from './PrimaryButton'
export * from './ProductIcon'
export * from './ProviderLogo'
export * from './Reorder'
export * from './SelectMenu'
export * from './SlideOver'
export * from './StatusTag'
export * from './tone'
export * from './ThemeToggle'

// `ThemeToggleNext` is NOT re-exported here, and that is the whole reason this
// comment exists. It is the @hanzogui/next-theme binding, and next-theme's
// provider imports `next/script` — so a static edge from this barrel put Next in
// the graph of every consumer of `@hanzo/ui/product`, including the Vite,
// Express and Tauri hosts the layer promises to run on. `ThemeToggle` already
// reaches it by dynamic import, which a bundler can split; a barrel re-export is
// exactly what it cannot.
//
//   import { ThemeToggleNext } from '@hanzo/ui/product/theme-toggle-next'
//
// Nobody needs that import: `<ThemeToggle />` with no props already picks this
// path when next-theme is installed, and degrades when it is not.
export * from './Toast'
export * from './accent'
export * from './color'

// Usage — the canonical AI-usage surface (totals, chart, spend-by-model, activity)
// now lives in ONE home: `@hanzo/usage/panel` (<UsagePanel>). The former meter/card/
// dashboard kit here was orphaned (zero consumers) and folded into it.

// Social — the publish surface (social.hanzo.ai) as parts: channel/post/campaign
// cards, the summary bar, the list↔calendar toggle, the agenda, the composer, and
// the provider-readiness list, over one pure time/preview module.
export * from './social'

// The gui/product theme object + tag tones (one source of truth, from
// @hanzo/data) — the theme this layer renders against. Design-token PRIMITIVES
// (colors, dark/light, radii, spacing) are the runtime-free `@hanzo/ui/core`.
export { tokens, TAG_TONES, tagTone, type TagTone } from '@hanzo/data'
