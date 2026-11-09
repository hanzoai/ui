/**
 * ModelPicker's decisions, as pure functions over plain values: which rows are
 * drawn, and which slice of them a scrolled viewport shows. Tested in node.
 */
import {
  agentGap,
  can,
  ENSO,
  groupKey,
  groupModels,
  isComparison,
  matchesModel,
  modelName,
  sortModels,
  thirdParty,
  withResearch,
  type AgentGap,
  type Capability,
  type ModelCatalogEntry,
} from './catalog'

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
