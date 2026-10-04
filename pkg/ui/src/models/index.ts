// @hanzo/ui/models — the model catalog and the one model picker.
//
//   import { ModelPicker, fetchModelCatalog, defaultModel } from '@hanzo/ui/models'
//   const models = await fetchModelCatalog(api, token)
//   <ModelPicker models={models} value={id} onChange={setId} limits={limits} />

export { ModelPicker } from './ModelPicker'
export type { ModelPickerProps } from './ModelPicker'

export {
  CAPABILITY_NAMES,
  CLASS_NAMES,
  FAMILIES,
  RESEARCH,
  can,
  capabilitiesOf,
  fetchModelCatalog,
  formatContext,
  formatPrice,
  groupKey,
  groupLabel,
  groupModels,
  isPaused,
  makerName,
  makerOf,
  matchesModel,
  matchesPaused,
  modelName,
  modelOf,
  parseModels,
  sortModels,
  withResearch,
} from './catalog'
export type {
  Capability,
  ModelCatalogEntry,
  ModelClass,
  ModelFamily,
  ModelGroup,
  ModelPricing,
  ModelSort,
  PauseSource,
} from './catalog'
export type { PausedModel } from '../product/limits'

export { ENSO, defaultModel, pickerRows, visibleRange } from './picker.logic'
export type { PickerRow } from './picker.logic'

export type { ZenModelLike, ModelFamilyLike, ModelSpecLike, ModelPricingLike } from './types'
