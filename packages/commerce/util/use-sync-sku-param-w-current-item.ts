"use client"
import {  useEffect } from 'react'
import { reaction } from 'mobx'

import {
  useQueryState,
  parseAsString,
  parseAsBoolean,
} from 'next-usequerystate'

import { useCommerce } from '../service/context'

const PLEASE_SELECT_FACETS = 'Please select an option from each group above.'

const useSyncSkuParamWithCurrentItem = (
  setMessage: (m: string | undefined) => void,
  setLoading?: (l: boolean) => void
) => {

  const cmmc = useCommerce()

  const [skuParam, setSkuParam] = useQueryState('sku',  
    parseAsString.withDefault('').withOptions({ clearOnDefault: true })
  )

  const [addParam, setAddParam] = useQueryState('add', 
    parseAsBoolean.withDefault(false).withOptions({ clearOnDefault: true })
  )

  useEffect(() => {

    return reaction(() => ({
      specifiedCat: cmmc.specifiedCategories.length === 1 ? cmmc.specifiedCategories[0] : undefined, 
      currentItem: cmmc.currentItem
    }),
    ({specifiedCat, currentItem}) => {
      //console.log("REACTION: " + `CAT ID: ${category?.id} SKU: ${item?.sku}`)
      if (currentItem) {
          // if we set the currentItem w sku, then user selects other facets
        if (specifiedCat && currentItem.categoryId != specifiedCat.id ) {
          cmmc.setCurrentItem(specifiedCat.products[0].sku)
        }
        setSkuParam(cmmc.currentItem!.sku)
      }
      else if (specifiedCat) {
        cmmc.setCurrentItem(specifiedCat.products[0].sku)
        setSkuParam(cmmc.currentItem!.sku)
      }
    })
  }, [])

  useEffect(() => {
    
    const setCurrentCategoryFromSku = (sku: string) => {
      const toks: string[] = sku.split('-')
      cmmc.setFacets({
        1: [toks[1]],
        2: [toks[2]]
      })
    }

      // setCI returns true if it's a recognized sku
    if (skuParam && cmmc.setCurrentItem(skuParam)) {
      if (addParam) {
        if (cmmc.currentItem!.quantity === 0) {
          cmmc.currentItem!.increment()  
        }
        setAddParam(false)
      }
      setCurrentCategoryFromSku(skuParam)
      setMessage(undefined)
    }
    else {
      setMessage(PLEASE_SELECT_FACETS)
    }

    setLoading && setLoading(false)
  }, [skuParam])
}

export default useSyncSkuParamWithCurrentItem
