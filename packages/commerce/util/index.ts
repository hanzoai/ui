import type { StringMutator, CommerceService, Promo } from '../types'

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


export function formatPrice(price: number): string {
  const str = price.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
  return (str.endsWith('.00')) ? str.replace('.00', '') : str 
}

export function promoPrice(price: number, promo?: Promo | null): number {
  if (promo) {
    if (promo.type === 'percent') {
      return price * (1 - promo.value / 100)
    }
    else {
      return price - promo.value
    }
  }

  return price
}

export const getFacetValuesMutator = (level: number, cmmc: CommerceService): StringMutator => {

  const setLevel = (value: string, level: number ): void  => {
    const facets = cmmc.facetsValue
    facets[level] = [value]
    cmmc.setFacets(facets)
    const subFacets = cmmc.getFacetValuesSpecified(level)
    if (subFacets) {
      const facets = cmmc.facetsValue
      facets[level + 1] = [subFacets[0].value]
      cmmc.setFacets(facets)
    }
  }

  const getLevelValueSafe = (level: number): string | null => {
    const facets = cmmc.facetsValue
    if (!(level in facets) || facets[level].length === 0 ) {
      return null
    }
    return facets[level][0]
  }

  return {
    get: () => (getLevelValueSafe(level)),
    set: (v: string) => {setLevel(v, level)}
  } satisfies StringMutator
}


export { default as useSyncSkuParamWithCurrentItem } from './use-sync-sku-param-w-current-item'
export { default as processSquareCardPayment } from './square-payment'