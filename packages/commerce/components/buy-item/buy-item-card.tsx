'use client'
import React, { useRef, useEffect } from 'react'
import { autorun  } from 'mobx'
import { observer } from 'mobx-react-lite'

import { cn } from '@hanzo/ui/util'

import type { FacetsValue } from '../../types'
import { useCommerce } from '../../service/context'
import { getFacetValuesMutator } from '../../util'
import FacetValuesWidget from '../facet-values-widget'
import SelectCategoryItemCard from './select-category-item-card'


const BuyItemCard: React.FC<{
  skuPath: string
  mobile?: boolean
  className?: string
  onQuantityChanged?: (sku: string, oldV: number, newV: number) => void
}> = observer(({
  skuPath,
  mobile=false,
  className='',
  onQuantityChanged
}) => {

  const cmmc = useCommerce()
  const levelRef = useRef<number>(-1)

  const cat = cmmc.getCategory(skuPath) 
  const facets = cat ? undefined : cmmc.getFacetValuesAtSkuPath(skuPath)

  useEffect(() => {

    const toks = skuPath.split('-')
    levelRef.current = toks.length - 1
    const fsv: FacetsValue = {}
    for (let level = 1; level <= levelRef.current; level++ ) {
      fsv[level] = [toks[level]]   
    } 
    if (facets) {
      fsv[levelRef.current + 1] = [facets[0].value]
    }
    cmmc.setFacets(fsv)

    return autorun(() => {
      const cats = cmmc.specifiedCategories
        // Original cat was legit
      if (cat && (cats.length === 0 || cats[0].id !== cat.id)) {
        if (!cmmc.currentItem || cmmc.currentItem.categoryId !== cat.id) {
          cmmc.setCurrentItem(cat.products[0].sku)
        }
      }
      else if (cats.length > 0) {
        if (!cmmc.currentItem || cmmc.currentItem.categoryId !== cats[0].id) {
          cmmc.setCurrentItem(cats[0].products[0].sku)
        }
      }
    })
  }, [cat, facets])

  const renderFacetTabs = facets && levelRef.current > 0

  return (
    <div className={className} >
    {renderFacetTabs && (
      <FacetValuesWidget
        className={cn('grid gap-0 ' + `grid-cols-${facets.length}` + ' self-start ', 'border-b-2 border-level-3 mb-2 -mr-2 -ml-2')} 
        isMobile={false}
        mutator={getFacetValuesMutator(levelRef.current + 1, cmmc)} 
        itemClx='flex-col h-auto gap-0 pb-1 pt-3 px-3'
        buttonClx={'h-full !rounded-bl-none !rounded-br-none !rounded-tl-lg !rounded-tr-lg ' +
        '!border-r !border-t !border-level-3'}
        facetValues={facets}
      />
    )}
    {cmmc.specifiedCategories[0] && (
      <SelectCategoryItemCard 
        noTitle
        mobile={mobile}
        category={cmmc.specifiedCategories[0]}
        selectedItemRef={cmmc /* ...conveniently. :) */ }
        selectSku={cmmc.setCurrentItem.bind(cmmc)}
        className=''
        onQuantityChanged={onQuantityChanged}
      />  
    )}
    </div >
  )
})

export default BuyItemCard
