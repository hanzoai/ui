'use client'
import React, { useRef, useEffect, type ComponentType } from 'react'
import { autorun  } from 'mobx'
import { observer } from 'mobx-react-lite'

import { cn } from '@hanzo/ui/util'

import type { SelectedPaths, ItemSelectorProps, LineItem } from '../../types'
import { useCommerce } from '../../service/context'
import { getFacetValuesMutator } from '../../util'

import FacetValuesWidget from '../facet-values-widget'
import AddToCartWidget from './add-to-cart-widget'
import ItemMedia from '../item/item-media'
import { ApplyTypography } from '@hanzo/ui/primitives'

const BuyCard: React.FC<{
  skuPath: string
  selector: ComponentType<ItemSelectorProps>
  selShowPrice?: boolean
  selShowQuantity?: boolean
  selClx?: string
  selSoleItemClx?: string
  selItemClx?: string
  selExt?: any
  allVariants?: boolean
  className?: string
  facetsWidgetClx?: string
  facetsAs?: 'image' | 'label' | 'image-and-label'
  addWidgetClx?: string
  mobile?: boolean
  onQuantityChanged?: (sku: string, oldV: number, newV: number) => void
}> = observer(({
  skuPath,
  className='',
  facetsWidgetClx='',
  selector: Selector,
  selShowPrice=true,
  selShowQuantity=false,
  selClx='',
  selItemClx='',
  selSoleItemClx='',
  selExt,
  addWidgetClx='',
  facetsAs='image-and-label', 
  allVariants=true,
  mobile=false,
  onQuantityChanged,
}) => {

  const cmmc = useCommerce()
  const levelRef = useRef<number>(-1)

  const requestedCat = cmmc.getCategory(skuPath) 
  const levelNode = requestedCat ? undefined : cmmc.getNodeAtPath(skuPath)

  useEffect(() => {

    const toks = skuPath.split('-')
    levelRef.current = toks.length - 1
    if (levelRef.current === 0) {
      throw new Error('BuyCard.useEffect(): must specify at least a Level 1 skuPath!') 
    }
    const fsv: SelectedPaths = {}
    for (let level = 1; level <= levelRef.current; level++ ) {
      fsv[level] = [toks[level]]   
    } 
      // Actually specify the requested Cat, 
      // or the first Cat if no Cats at this level
    if (!requestedCat) {
      fsv[levelRef.current + 1] = [levelNode!.subNodes![0].skuToken]
    }
    cmmc.selectPaths(fsv)

    return autorun(() => {
      const cats = cmmc.selectedCategories
        // Original requestedCat was legit
      if (requestedCat /* && (cats.length === 0 || cats[0].id !== requestedCat.id) */) {
        if (
          !cmmc.currentItem 
          || 
          cmmc.currentItem.categoryId !== requestedCat.id 
          || 
          requestedCat.products.length === 1
        ) {
          cmmc.setCurrentItem(requestedCat.products[0].sku)
        }
      }
      else if (cats.length > 0) {
        if (!cmmc.currentItem || cmmc.currentItem.categoryId !== cats[0].id) {
          cmmc.setCurrentItem(cats[0].products[0].sku)
        }
      }
    })
  }, [requestedCat, levelNode?.subNodes])

  const TitleArea: React.FC<{
    title: string
    byline?: string
    clx?: string
  }> = ({
    title,
    byline,
    clx='' 
  }) => (
    <ApplyTypography className={clx}>
      <h3>{title}</h3>
      {byline && (<h6>{byline}</h6>)}
    </ApplyTypography>
  )

  const catTitle = requestedCat ? requestedCat.title : cmmc.selectedCategories?.[0]?.title

  return (
    <div className={cn('px-4 md:px-6 pt-3 pb-4 flex flex-col items-center', className)} >
    {levelNode && (<>
      <ApplyTypography className=''>
        <h3>{levelNode.label}</h3>
        {levelNode.subNodesLabel && (
          <h6 className='!text-center mt-4 mb-1'>{levelNode.subNodesLabel}</h6>
        )}
      </ApplyTypography>
      <FacetValuesWidget
        className={cn(
          'grid gap-0 ' + `grid-cols-${levelNode!.subNodes!.length}`, 
          'border-b-2 rounded-lg border-level-3 mb-4 -mr-2 -ml-2 max-w-[460px]',
          facetsWidgetClx  
        )} 
        mobile={mobile}
        mutator={getFacetValuesMutator(levelRef.current + 1, cmmc)} 
        itemClx='flex-col h-auto gap-0 py-1 px-3'
        buttonClx={
          'h-full ' +
          '!border-level-3'
        }
        facetValues={levelNode!.subNodes!}
        show={facetsAs}
      />
    </>)} 
    {!levelNode && catTitle && (
      <TitleArea title={catTitle} clx=''/>
    )}
    {(cmmc.currentItem) && (<ItemMedia item={cmmc.currentItem} />)} 
    {cmmc.selectedCategories[0] && (
      <Selector 
        items={cmmc.selectedCategories[0].products as LineItem[]}
        selectedItemRef={cmmc}
        selectSku={cmmc.setCurrentItem.bind(cmmc)}
        clx={selClx}
        itemClx={selItemClx}
        soleItemClx={selSoleItemClx}
        ext={selExt}
        showPrice={selShowPrice}
        showQuantity={selShowQuantity}
      />  
    )}
    {(cmmc.currentItem) && (
      <AddToCartWidget 
        size='default' 
        item={cmmc.currentItem}
        onQuantityChanged={onQuantityChanged} 
        className={cn('min-w-[160px] mx-auto mt-4', addWidgetClx)}
      />
    )} 
    </div >
  )
})

export default BuyCard
