import type { SelectionUISpecifier } from '../types'
import sep from '../service/sep'

const DEFAULT = {
  multiFamily: {
    familySelector: 'carousel',
    showParentTitle: false, 
    slide: { 
      type: 'buttons' 
    }
  },
  singleFamily: { type: 'carousel' }
} satisfies SelectionUISpecifier

const map = new Map<string, SelectionUISpecifier>()

  // key: first two tokens of path
export const initSelectionUI = (v: Record<string, SelectionUISpecifier>) => {
  
    // Might have multiple calls client and server side
  if (map.size > 0) {
    map.clear()
  }

  for (let [key, value] of Object.entries(v)) {
    map.set(key, value)
  }
}

export const getSelectionUISpecifier = (skuPath: string): SelectionUISpecifier => {
  const key = skuPath.split(sep.tok).slice(0, 2).join(sep.tok)
  const result = map.get(key)
  return result ?? DEFAULT
}