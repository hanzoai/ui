/**
 * @hanzo/ui-shadcn/models — Shared Zen model UI components
 *
 * Components are data-agnostic: they accept any data compatible with
 * ZenModelLike / ModelFamilyLike types, making them reusable across
 * zen-docs, hanzo.ai, and any other Hanzo site.
 *
 * Data source: @hanzo/zen-models (the canonical Zen model registry)
 *
 * Usage:
 *   import { ModelCard, ModelLibrary, ModelTable, ZenEnso } from '@hanzo/ui-shadcn/models'
 *   import { allModels, families } from '@hanzo/zen-models'
 *   <ModelLibrary allModels={allModels} families={families} />
 *
 * The unified model picker (gateway/OpenAI-shaped catalog) lives here too:
 *   import { ModelSelector, fetchModelCatalog } from '@hanzo/ui-shadcn/models'
 *   const models = await fetchModelCatalog()
 *   <ModelSelector models={models} value={id} onChange={setId} />
 */

export { ModelCard } from './ModelCard'
export type { ModelCardProps } from './ModelCard'

export { ModelTable } from './ModelTable'
export type { ModelTableProps } from './ModelTable'

export { ModelLibrary, ModelFamilySection } from './ModelLibrary'
export type { ModelLibraryProps, ModelFamilySectionProps } from './ModelLibrary'

export { ZenEnso } from './ZenEnso'

export { ModelSelector } from './ModelSelector'
export type { ModelSelectorProps } from './ModelSelector'

export {
  familyOf,
  groupModelsByFamily,
  isChatModel,
  filterChatModels,
  fetchModelCatalog,
} from './catalog'
export type { ModelCatalogEntry } from './catalog'

export type { ZenModelLike, ModelFamilyLike, ModelSpecLike, ModelPricingLike } from './types'
