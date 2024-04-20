"use client"
import {  useEffect } from 'react'
import { reaction } from 'mobx'

import {
  useQueryState,
  parseAsString,
  parseAsBoolean,
} from 'next-usequerystate'

import { useCommerce } from '../context'
import type { SelectedPaths } from '../types'
import sep from '../service/sep'

const PLEASE_SELECT_FACETS = 'Please select an option from each group.'

const useSyncSkuParamWithCurrentItem = (
  familyLevel: number,
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
      specifiedCat: cmmc.selectedFamilies.length === 1 ? cmmc.selectedFamilies[0] : undefined, 
      currentItem: cmmc.currentItem
    }),
    ({specifiedCat, currentItem}) => {
      //console.log("REACTION: " + `CAT ID: ${family?.id} SKU: ${item?.sku}`)
      if (currentItem) {
          // if we set the currentItem w sku, then user selects other facets
        if (specifiedCat && currentItem.familyId != specifiedCat.id ) {
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
    
    const setCurrentFamilyFromSku = (sku: string) => {
      const toks: string[] = sku.split(sep.tok)
      const fv: SelectedPaths = {}
        // TODO: confirm that extra trailing nonsense tokens won't break selectPaths()
      for (let i = 1; i < familyLevel; i++) {
        if (i in toks) {
          fv[i] = [toks[i]]
        } 
      } 
      cmmc.selectPaths(fv)
    }

      // setCI returns true if it's a recognized sku
    if (skuParam && cmmc.setCurrentItem(skuParam)) {
      if (addParam) {
        if (cmmc.currentItem!.quantity === 0) {
          cmmc.currentItem!.increment()  
        }
        setAddParam(false)
      }
      setCurrentFamilyFromSku(skuParam)
      setMessage(undefined)
    }
    else {
      setMessage(PLEASE_SELECT_FACETS)
    }

    setLoading && setLoading(false)
  }, [skuParam])
}

export default useSyncSkuParamWithCurrentItem
