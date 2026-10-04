/**
 * The models that exist and cannot be called, apart from the rest of the
 * catalog so that a page naming one (hanzo.ai's lib/zen) loads this row alone.
 * `./catalog` re-exports both names.
 */
import type { ModelCatalogEntry } from './catalog'

/**
 * The models that exist and cannot be called, said once for every list of
 * models: a picker draws each one disabled, a catalogue page draws it muted.
 * `/v1/models` never answers for one, so nothing can route to it.
 */
export const RESEARCH: ModelCatalogEntry[] = [
  {
    id: 'zen7',
    owned_by: 'zenlm',
    family: 'zen',
    name: 'Zen 7',
    access: 'research',
    request: 'https://hanzo.ai/research-access',
    description: 'The next open-weight generation after Zen 6, in research preview.',
  },
]

/** The catalog with the research models it does not already list, appended. */
export function withResearch(models: readonly ModelCatalogEntry[]): ModelCatalogEntry[] {
  const ids = new Set(models.map((m) => m.id))
  return [...models, ...RESEARCH.filter((m) => !ids.has(m.id))]
}
