// @hanzo/ui/models — the unified, data-agnostic model picker + catalog helpers.
//
//   import { ModelSelector, fetchModelCatalog } from '@hanzo/ui/models'
//   const models = await fetchModelCatalog()
//   <ModelSelector models={models} value={id} onChange={setId} />

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
