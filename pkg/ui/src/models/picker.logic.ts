/**
 * ModelPicker's decisions, as pure functions over plain values: which rows are
 * drawn, and which slice of them a scrolled viewport shows. Tested in node.
 */
import {
  can,
  ENSO,
  groupModels,
  matchesModel,
  sortModels,
  withResearch,
  type Capability,
  type ModelCatalogEntry,
} from './catalog'

/** A drawn row: a group's heading, or a model under it. */
export type PickerRow =
  | { kind: 'group'; key: string; label: string; count: number }
  | { kind: 'model'; model: ModelCatalogEntry }

/** Whether a model may be picked: everything the gateway lists, never a research preview. */
export const pickable = (m: ModelCatalogEntry): boolean => m.access !== 'research'

/**
 * The rows for a catalog: the models `scope` allows (all of them without one),
 * the research previews among them, narrowed by the search, in groups — Hanzo's
 * families first — each sorted by name, with the house router first in Enso.
 */
export function pickerRows(
  models: readonly ModelCatalogEntry[],
  query: string,
  scope?: Capability,
): PickerRow[] {
  const offered = withResearch(models).filter((m) => (!scope || can(m, scope)) && matchesModel(m, query))
  const rows: PickerRow[] = []
  const sorted = sortModels(offered).sort((a, b) => Number(b.id === ENSO) - Number(a.id === ENSO))
  for (const g of groupModels(sorted)) {
    rows.push({ kind: 'group', key: g.key, label: g.label, count: g.models.length })
    for (const model of g.models) rows.push({ kind: 'model', model })
  }
  return rows
}

/** How many models the rows draw. */
export const modelCount = (rows: readonly PickerRow[]): number => rows.filter((r) => r.kind === 'model').length

/** Whether the cursor may rest on a row: a model that can be picked. */
export const restable = (rows: readonly PickerRow[], i: number): boolean => {
  const r = rows[i]
  return r?.kind === 'model' && pickable(r.model)
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
