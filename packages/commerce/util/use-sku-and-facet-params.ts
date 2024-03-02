import { 
  useEffect, 
  useRef,
} from 'react'
import { autorun, toJS, type IReactionDisposer } from 'mobx'

import {
  useQueryState,
  parseAsString,
  parseAsBoolean,
} from 'next-usequerystate'

import type { Category, FacetsValue, StringMutator } from '../types'
import { useCommerce } from '../service'

interface GetMutator {
  (level: 1 | 2): StringMutator
}

const useSkuAndFacetParams = (
  setLoading?: (l: boolean) => void
) => {

  const cmmc = useCommerce()

  const encRef = useRef<{
    category: Category | undefined
    usingSkuMode: boolean
    autoRunDisposer: IReactionDisposer | undefined
  }>({
    category: undefined,
    usingSkuMode: false,
    autoRunDisposer: undefined,
  })

  const [level1, setLevel1] = useQueryState('lev1',  
    parseAsString.withDefault('').withOptions({ clearOnDefault: true })
  )
   const [level2, setLevel2] = useQueryState('lev2',  
    parseAsString.withDefault('').withOptions({ clearOnDefault: true })
  )

  const [skuParam, setSkuParam] = useQueryState('sku')
  const [addParam, setAddParam] = useQueryState('add', 
    parseAsBoolean.withDefault(false).withOptions({ clearOnDefault: true })
  )

  let message = ''

  const directMutator: GetMutator = (level: 1 | 2): StringMutator => {

    const setLevel = (value: string, level: 1 | 2 ): void  => {
      const facets = cmmc.facetsValue
      facets[level] = [value]
      cmmc.setFacets(facets)
    }
  
    const getLevelValueSafe = (level: 1 | 2): string | null => {
      const facets = cmmc.facetsValue
      if (!(level in facets) || facets[level].length === 0 ) {
        return null
      }
      return facets[level][0]
    }

    return {
      get: () => (getLevelValueSafe(level)),
      set: (v: string) => {setLevel(v, level)}
    }
  } 

  const paramsMutator: GetMutator = (level: 1 | 2): StringMutator => {
    return level === 1 ? {
      get: () => (level1),
      set: setLevel1
    } : {
      get: () => (level2),
      set: setLevel2
    }
  }

  useEffect(() => {
    
    const setCurrentCategoryFromSku = (sku: string) => {
      const toks: string[] = sku.split('-')
      const categories = cmmc.setFacets({
        1: [toks[1]],
        2: [toks[2]]
      })
      encRef.current.category = categories[0] 
    }

    if (skuParam) {
      cmmc.setCurrentItem(skuParam)
      if (addParam && cmmc.currentItem!.quantity === 0) {
        cmmc.currentItem!.increment()  
        setAddParam(false)
      }
        // Marks that we've been here so no need to 
        // create an autorun() instance twice.
      if (!encRef.current.usingSkuMode) {
        setCurrentCategoryFromSku(skuParam)
        encRef.current.autoRunDisposer = autorun(() => {
          if (cmmc.currentItem && cmmc.currentItem.sku !== skuParam) {
            setSkuParam(cmmc.currentItem.sku)
          }
        })
      }
      encRef.current.usingSkuMode = true
    }
    else if (encRef.current.category) {
      //const catMutators = [{val: level1, set: setLevel1} , {val: level2, set: setLevel2}]
      cmmc.setCurrentItem(encRef.current.category.products[0].sku)
    }
    setLoading && setLoading(false)
  }, [skuParam, encRef.current.category])

    // supposed to be when component unmounts
  useEffect(() => (() => {
    if (encRef.current.autoRunDisposer) {
      //encRef.current.autoRunDisposer() // no idea why this seems to be called prematurely and so many times <shrug>
    }
  }), [])


    // Level Params Mode
  useEffect(() => {

    if (encRef.current.usingSkuMode) return
    
    const facets: FacetsValue = { }
    if (level1) { facets[1] = [level1] }
    if (level2) { facets[2] = [level2] }
    if (level1 && level2) {
      const categories = cmmc.setFacets(facets)
      if (categories.length > 1) {
        console.error("CAT", categories.map((c) => (c.title)))
        throw new Error ( "CategoryContents: More than one specified Category should never be possible with this UI!")
      }
      encRef.current.category = categories[0] 
    }
    else {
      message = 'Please select an option from each group above.'
    }
    setLoading && setLoading(false)
  }, [level1 , level2])

  return {
    category: encRef.current.category,
    message,
    getMutator: encRef.current.usingSkuMode ?
      directMutator : paramsMutator
  }

}

export default useSkuAndFacetParams
