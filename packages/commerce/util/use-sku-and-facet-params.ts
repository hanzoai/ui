import { 
  useEffect, 
  useRef,
  useState,
} from 'react'
import { autorun, toJS, type IReactionDisposer } from 'mobx'

import {
  useQueryState,
  parseAsString,
  parseAsBoolean,
} from 'next-usequerystate'

import type { Category, FacetsValue, StringMutator } from '../types'
import { useCommerce } from '../service'

const PLEASE_SELECT_FACETS = 'Please select an option from each group above.'

interface GetMutator {
  (level: 1 | 2): StringMutator
}

const useSkuAndFacetParams = (
  setLoading?: (l: boolean) => void
) => {

  const cmmc = useCommerce()

  const encRef = useRef<{
    usingSkuMode: boolean
    autoRunDisposer: IReactionDisposer | undefined
  }>({
    usingSkuMode: false,
    autoRunDisposer: undefined,
  })

  const [level1, setLevel1] = useQueryState('lev1',  
    parseAsString.withDefault('').withOptions({ clearOnDefault: true })
  )
   const [level2, setLevel2] = useQueryState('lev2',  
    parseAsString.withDefault('').withOptions({ clearOnDefault: true })
  )

  const [skuParam, setSkuParam] = useQueryState('sku',  
    parseAsString.withDefault('').withOptions({ clearOnDefault: true })
  )

  const [addParam, setAddParam] = useQueryState('add', 
    parseAsBoolean.withDefault(false).withOptions({ clearOnDefault: true })
  )

  const [message, setMessage] = useState<string | undefined>(undefined)

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
      cmmc.setFacets({
        1: [toks[1]],
        2: [toks[2]]
      })
    }

    if (skuParam) {
        // true if a valid sku
      if (cmmc.setCurrentItem(skuParam)) {
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
        setMessage(undefined)
        encRef.current.usingSkuMode = true
      }
      else {
        setSkuParam('')
          // if sent here w an invalid sku, 
          // it will effectively put us in facet params mode
        setMessage('Invalid sku. ' + PLEASE_SELECT_FACETS)
      }
    }

    setLoading && setLoading(false)
  }, [skuParam])

    // supposed to be when component unmounts
  /*  
  useEffect(() => (() => {
    if (encRef.current.autoRunDisposer) {
      //encRef.current.autoRunDisposer() // no idea why this seems to be called prematurely and so many times <shrug>
    }
  }), [])
  */


    // Level Params Mode
  useEffect(() => {

    if (encRef.current.usingSkuMode) return
      
    const facets: FacetsValue = { }
    if (level1) { facets[1] = [level1] }
    if (level2) { facets[2] = [level2] }
    //console.log(`LEV1: ${level1}, LEV2: ${level2}`)
    if (level1 && level2) {
      const categories = cmmc.setFacets(facets)
      if (categories && categories.length > 0) {
        cmmc.setCurrentItem(categories?.[0].products[0].sku)
        setMessage(undefined)
      }
      else {
        cmmc.setCurrentItem(undefined)
        setMessage('Unrecognized facets. ' + PLEASE_SELECT_FACETS)
      }
    }
    else {
      setMessage(PLEASE_SELECT_FACETS)
    }
    setLoading && setLoading(false)
  }, [level1 , level2])

  return {
    message,
    getMutator: encRef.current.usingSkuMode ?
      directMutator : paramsMutator
  }

}

export default useSkuAndFacetParams
