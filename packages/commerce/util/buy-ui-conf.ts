import type { BuyUISpec } from '../types'

const map = new Map<string, BuyUISpec>([
  ['LXM_AU', {
    selector: 'radio',
    allVariants: false
  }],
  ['LXM_AG', {
    selector: 'radio',
    allVariants: false
  }],  
  ['LXM_CN', {
    selector: 'image',
    allVariants: false
  }],  
    // only one option so image / radio doesn't have meaning
  ['LXM_PS', {
    selector: 'image',
    allVariants: false
  }],  
  ['LXM-VL', {
    selector: 'radio',
    allVariants: false
  }],
  ['LXM-CR', {
    selector: 'carousel',
    allVariants: true
  }],
])

export default (skuPath: string): BuyUISpec | undefined => {
  const key = skuPath.split('-').slice(0, 2).join('-')
  return map.get(key)
}