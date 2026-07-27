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

// Org scope + switcher — the console's org contract, shared with every admin.
export * from './OrgMark'
export * from './OrgSwitcher'
export * from './scope'

// Menu — the ONE menu system: portal-theme-safe DropdownMenu (click) + ContextMenu
// (right-click), both rendering the SAME item spec (MenuPanel/MenuItemView) so every
// menu across the fleet is pixel-identical. SelectMenu/ComboBox share the same spec.
export * from './menu'

// Admin surface — the honest-state + list layer every admin console renders.
// `host` is the ONE seam an app injects its router/auth effects through;
// `CommerceResource` is the ONE store-list surface (console Store + Commerce admin).
export * from './host'
export * from './BackendState'
export * from './CommerceResource'
export * from './ConfirmDelete'
export * from './Filters'

// The rest — every exported name below is unique across the layer.
export * from './AnimatedLogo'
export * from './brand'
export * from './DataTable'
export * from './EmptyState'
export * from './FadeIn'
export * from './Field'
export * from './HanzoMark'
export * from './PageHeader'
export * from './PrimaryButton'
export * from './ProductIcon'
export * from './ProviderLogo'
export * from './Reorder'
export * from './SelectMenu'
export * from './SlideOver'
export * from './StatusTag'
export * from './ThemeToggle'
export * from './Toast'
export * from './accent'
export * from './color'

// Usage — the shared AI-quota surface (meter bar → provider card → dashboard).
export * from './usage'

// Social — ChannelBadge, PostCard, CampaignCard (extracted from Hanzo Social).
export * from './social'
