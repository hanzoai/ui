
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


export { default as useSyncSkuParamWithCurrentItem } from './use-sync-sku-param-w-current-item'
export { default as processSquareCardPayment } from './square-payment'