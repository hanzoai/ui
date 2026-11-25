/**
 * ModelPicker's decisions, as pure functions over plain values: which rows are
 * drawn, and which slice of them a scrolled viewport shows. Tested in node.
 */
import {
  agentGap,
  can,
  capabilitiesOf,
  CAPABILITY_NAMES,
  ENSO,
  formatCeiling,
  formatContext,
  formatPrice,
  formatSaving,
  groupKey,
  groupModels,
  isComparison,
  matchesModel,
  modelName,
  savingOf,
  sortModels,
  thirdParty,
  withResearch,
  type AgentGap,
  type Capability,
  type ModelCatalogEntry,
} from './catalog'
import type { Say } from '@hanzo/i18n/react'
import { english } from '../core/english'

/**
 * A drawn row: a group's heading, or a model under it. A heading with a `fold`
 * is the "Not available for agents" group, which opens and shuts; a model under
 * it carries the `gap` that keeps it from being picked.
 */
export type PickerRow =
  | { kind: 'group'; key: string; label: string; count: number; fold?: 'open' | 'shut' }
  | { kind: 'model'; model: ModelCatalogEntry; gap?: AgentGap }

/** The key of the group that holds what an agent cannot run on. */
export const NOT_FOR_AGENTS = 'agents:not'

/** Whether a model may be picked: everything the gateway lists, never a research preview. */
export const pickable = (m: ModelCatalogEntry): boolean => m.access !== 'research'

/**
 * The rows for a catalog: the models `scope` allows (all of them without one),
 * the research previews among them, narrowed by the search, in groups — Hanzo's
 * families first — each sorted by name, with the house router first in Enso. The
 * comparison vendor's models (Jev) are in no list.
 *
 * For an agent (`scope` 'agent'), what cannot run one stands last in a group of
 * its own, shut until `opened`, each model disabled with the few words that say
 * why. Decision models and the comparison vendor's are not listed at all.
 */
export function pickerRows(
  models: readonly ModelCatalogEntry[],
  query: string,
  scope?: Capability,
  opened = false,
): PickerRow[] {
  const listed = withResearch(models).filter((m) => !isComparison(m) && matchesModel(m, query))
  const offered = listed.filter((m) => !scope || can(m, scope))
  const rows: PickerRow[] = []
  const sorted = sortModels(offered).sort((a, b) => Number(b.id === ENSO) - Number(a.id === ENSO))
  // Two ids that read as one name in one group are one row.
  const seen = new Set<string>()
  const unique = sorted.filter((m) => {
    const k = `${groupKey(m)}:${modelName(m).toLowerCase()}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
  for (const g of groupModels(unique)) {
    rows.push({ kind: 'group', key: g.key, label: g.label, count: g.models.length })
    for (const model of g.models) rows.push({ kind: 'model', model })
  }
  if (scope === 'agent') {
    const rest = sortModels(listed.filter((m) => !can(m, 'agent') && m.access !== 'research'))
      .map((model) => ({ model, gap: agentGap(model) }))
      .filter((r): r is { model: ModelCatalogEntry; gap: AgentGap } => r.gap !== null && r.gap !== 'decision' && r.gap !== 'comparison')
    if (rest.length) {
      rows.push({ kind: 'group', key: NOT_FOR_AGENTS, label: '', count: rest.length, fold: opened ? 'open' : 'shut' })
      if (opened) for (const r of rest) rows.push({ kind: 'model', model: r.model, gap: r.gap })
    }
  }
  return rows
}

/** How many models the rows draw. */
export const modelCount = (rows: readonly PickerRow[]): number => rows.filter((r) => r.kind === 'model').length

/** Whether the cursor may rest on a row: a model that can be picked, or the heading that opens a shut group. */
export const restable = (rows: readonly PickerRow[], i: number): boolean => {
  const r = rows[i]
  if (r?.kind === 'group') return r.fold !== undefined
  return r?.kind === 'model' && pickable(r.model) && !r.gap
}

/** What choosing a model does for the payer: pick it, send them to a plan, or to the balance. */
export type Standing = 'pick' | 'upgrade' | 'top-up'

/**
 * Hanzo's own models follow the plan (`granted`); another maker's are paid from the
 * prepaid balance on any plan (`funded`). A check the host does not supply is not
 * made, and a third-party model with no `funded` check follows the plan as it did.
 */
export function standing(
  m: ModelCatalogEntry,
  granted?: (id: string) => boolean,
  funded?: (id: string) => boolean,
): Standing {
  if (thirdParty(m) && funded) return funded(m.id) ? 'pick' : 'top-up'
  return granted && !granted(m.id) ? 'upgrade' : 'pick'
}

/**
 * Exact vertical layout for a picker list where non-fold group headings are
 * shorter than model/fold rows. Prefix sums give O(1) top/height per index
 * while keeping virtualized scroll height exact.
 */
export interface RowLayout {
  readonly tops: readonly number[]
  readonly heights: readonly number[]
  readonly total: number
}

export function rowLayout(rows: readonly PickerRow[], row: number, head = row): RowLayout {
  const tops: number[] = []
  const heights: number[] = []
  let y = 0
  for (const r of rows) {
    const h = r.kind === 'group' && !r.fold ? head : row
    tops.push(y)
    heights.push(h)
    y += h
  }
  return { tops, heights, total: y }
}

/**
 * The rows a viewport shows, `over` rows beyond each edge, for variable row heights.
 * `end` is exclusive.
 */
export function visibleLayoutRange(
  top: number,
  height: number,
  layout: RowLayout,
  over = 8,
): { start: number; end: number } {
  const n = layout.heights.length
  if (n <= 0) return { start: 0, end: 0 }
  const y0 = Math.max(0, top)
  const y1 = y0 + Math.max(0, height)
  let lo = 0
  let hi = n
  while (lo < hi) {
    const mid = (lo + hi) >>> 1
    if (layout.tops[mid]! + layout.heights[mid]! <= y0) lo = mid + 1
    else hi = mid
  }
  const first = lo
  lo = first
  hi = n
  while (lo < hi) {
    const mid = (lo + hi) >>> 1
    if (layout.tops[mid]! < y1) lo = mid + 1
    else hi = mid
  }
  const last = lo
  return { start: Math.max(0, first - over), end: Math.min(n, last + over) }
}

/** The scroll offset that brings row `i` into view under `layout`, or null if already visible. */
export function revealLayoutTop(i: number, top: number, height: number, layout: RowLayout): number | null {
  if (i < 0 || i >= layout.heights.length) return null
  const y = layout.tops[i]!
  const h = layout.heights[i]!
  if (y < top) return y
  if (y + h > top + height) return y + h - height
  return null
}

/**
 * The rows a viewport shows, `over` rows beyond each edge, for rows of one
 * height. `end` is exclusive.
 */
export function visibleRange(
  top: number,
  height: number,
  row: number,
  count: number,
  over = 8,
): { start: number; end: number } {
  if (count <= 0 || row <= 0) return { start: 0, end: 0 }
  const first = Math.floor(Math.max(0, top) / row)
  const last = Math.ceil((Math.max(0, top) + Math.max(0, height)) / row)
  return { start: Math.max(0, first - over), end: Math.min(count, last + over) }
}

/**
 * The scroll offset that brings row `i` into a viewport, or null when it is in
 * view already: the least movement, the way `scrollIntoView({block:'nearest'})` reads.
 */
export function revealTop(i: number, top: number, height: number, row: number): number | null {
  const y = i * row
  if (y < top) return y
  if (y + row > top + height) return y + row - height
  return null
}

/**
 * The capabilities a model picker row names:
 * - For chat models, specific strengths (`vision`, `tools`, `reasoning`, `image`, ...)
 *   or `chat` alone when no extra capability flags are published.
 * - For non-chat models, their actual modalities (`decision`, `embeddings`, `image`, ...).
 * The umbrella `agent` tag is omitted because it is derived from tools/reasoning/text.
 */
export function modelCapabilities(m: ModelCatalogEntry): Capability[] {
  const caps = capabilitiesOf(m).filter((c) => c !== 'agent')
  if (!can(m, 'chat')) return caps
  const specific = caps.filter((c) => c !== 'chat')
  return specific.length ? specific : ['chat']
}

/**
 * What a model costs to call, across every model class (ours, free, and third-party):
 * comparison savings, router ceiling, Free ($0 or free class), or per-1M input price.
 * Never invents a price when the catalog omits one.
 */
export function modelCost(
  m: ModelCatalogEntry,
  models: readonly ModelCatalogEntry[],
  t: Say = english,
): string {
  const saving = savingOf(m, models)
  if (saving) return formatSaving(saving, t)
  const ceiling = formatCeiling(m, t)
  if (ceiling) return ceiling
  const input = m.pricing?.input_per_million
  if (input === 0) return t('Free')
  if (input !== undefined) return t('{price} / 1M', { price: formatPrice(input, t) })
  if (m.class === 'free') return t('Free')
  return ''
}

/**
 * The secondary metadata line for a model picker row: capabilities, context window, and cost.
 * Orthogonal to access status (`Upgrade`, `Top up`, `Paused`, `Research preview`), which stays
 * visible alongside it rather than replacing it.
 */
export function modelMeta(
  m: ModelCatalogEntry,
  models: readonly ModelCatalogEntry[],
  t: Say = english,
): string {
  const caps = modelCapabilities(m).map((c) => t(CAPABILITY_NAMES[c])).join(' · ')
  const ctx = formatContext(m.context_window)
  const cost = modelCost(m, models, t)
  return [caps, ctx, cost].filter(Boolean).join(' · ')
}
