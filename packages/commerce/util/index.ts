import type { StringMutator, CommerceService } from '../types'

export function toTitleCase(str: string) {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
  )
}

export function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
}

export function unslugify(str: string) {
  return str.replace(/-/g, ' ')
}


export function formatCurrencyValue(price: number): string {
  const str = price.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
  return (str.endsWith('.00')) ? str.replace('.00', '') : str 
}

export const getFacetValuesMutator = (level: number, cmmc: CommerceService): StringMutator => {

  const setLevel = (value: string, level: number ): void  => {
    const facets = cmmc.selectedPaths
    facets[level] = [value]
    cmmc.selectPaths(facets)
    const subFacets = cmmc.getSelectedNodesAtLevel(level)
    if (subFacets) {
      const facets = cmmc.selectedPaths
      facets[level + 1] = [subFacets[0].skuToken]
      cmmc.selectPaths(facets)
    }
  }

  const getLevelValueSafe = (level: number): string | null => {
    const facets = cmmc.selectedPaths
    if (!(level in facets) || facets[level].length === 0 ) {
      return null
    }
    return facets[level][0]
  }

  return {
    get: (): string | null => (getLevelValueSafe(level)),
    set: (v: string): void => {setLevel(v, level)}
  } satisfies StringMutator
}

export { default as useSyncSkuParamWithCurrentItem } from './use-sync-sku-param-w-current-item'
export { default as processSquareCardPayment } from './square-payment'
export { default as ObsStringMutator } from './obs-string-mutator'
export { default as ProductMediaAccessor } from './product-media-accessor'

export * from './selection-ui-specifiers'

export { getErrorMessage } from './error'

export { default as accessItemOptions } from './item-selector-options-accessor'
export { default as accessMultiSelectorOptions } from './multi-family-selector-options-accessor'

export { default as LineItemRef} from './line-item-ref'