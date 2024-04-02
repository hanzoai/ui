'use client'
import React, { useRef, useEffect, type ComponentType } from 'react'
import { reaction, type IReactionDisposer } from 'mobx'
import { observer } from 'mobx-react-lite'

import { cn } from '@hanzo/ui/util'

import type { 
  SelectedPaths, 
  ItemSelectorProps, 
  ItemSelectorCompProps,
  LineItem, 
  Category, 
  ProductTreeNode, 
} from '../../types'

import { useCommerce } from '../../service/context'
import { getFacetValuesMutator, ObsStringMutator } from '../../util'

import LevelNodesWidget from '../level-nodes-widget'
import AddToCartWidget from './add-to-cart-widget'
import ItemMedia from '../item/item-media'
import { ApplyTypography } from '@hanzo/ui/primitives'

const BuyCard: React.FC<{
  skuPath: string

    /** For any selectors that show a list of choices,
     * starting with 'scrollAfter' elements, 
     * the list will scroll, and the card will
     * have 'scrollHeightClx' applied to it to define and fix the height.
     * This is most like something like '80vh' 
     * defaults are '5' and 'h-[70vh]'
     * */
  scrollAfter?: number
  scrollHeightClx?: string

  clx?: string
  catWidgetClx?: string
  addWidgetClx?: string

  selector: ComponentType<ItemSelectorProps>
  selectorProps?: ItemSelectorCompProps 

    /** Show all items from all sibling categories
     * If skuPath defines a Category, the first of it's items will 
     * be selected. The facet widget will just select a the first 
     * item in the chosen Category without changings the overall set
     * of choices. */
  allVariants?: boolean

  categoryTabAs?: 'image' | 'label' | 'image-and-label'
  showItemMedia?: boolean

  onQuantityChanged?: (sku: string, oldV: number, newV: number) => void
  mobile?: boolean
}> = observer(({
  skuPath,
  scrollAfter=5,
  scrollHeightClx='h-[80vh]',
  clx='',
  catWidgetClx='',
  addWidgetClx='',
  selector: Selector,
  selectorProps={
    clx: '',
    soleItemClx: '',
    itemClx: '',
    ext: {}
  },
  categoryTabAs='image-and-label', 
  showItemMedia=true,
  allVariants=false,
  mobile=false,
  onQuantityChanged,
}) => {

  const cmmc = useCommerce()
  const inst = useRef<{
    level: number,
    requestedCat : Category | undefined
    requestedNode: ProductTreeNode | undefined
    currentCat: ObsStringMutator
    disposers: IReactionDisposer[]
  } | undefined>(undefined)


  useEffect(() => {

    let requestedCat = cmmc.getCategory(skuPath) 
    let requestedNode = requestedCat ? undefined : cmmc.getNodeAtPath(skuPath)
    let initialCat = undefined
    const toks = skuPath.split('-')
    const level = toks.length - 1
    if (level === 0) {
      throw new Error('BuyCard.useEffect(): must specify at least at least one Level in skuPath!') 
    }
    const paths: SelectedPaths = {}
    for (let l = 1; l <= level; l++ ) {
      paths[l] = [toks[l]]   
    } 
    if (requestedCat) { 
      if (allVariants && level >= 2) {
          // select all siblings of requestedCat.
          // ie, go one level back
        delete paths[level]
        initialCat = requestedCat
        requestedCat = undefined
        requestedNode = cmmc.getNodeAtPath(toks.slice(0, -1).join('-'))
      }
    }
    else {
        // select siblings paths
      if (allVariants) {
        paths[level + 1] = [...requestedNode!.subNodes!.map((node) => (node.skuToken))]
      }
        // Actually select the the first cat at the cat level, 
      else {
        paths[level + 1] = [requestedNode!.subNodes![0].skuToken]
      }
    }

    const selectedCats = cmmc.selectPaths(paths)
    initialCat = initialCat ? initialCat : (requestedCat ? requestedCat : selectedCats[0])
    cmmc.setCurrentItem(initialCat.products[0].sku)
    const currentCat = new ObsStringMutator(initialCat!.id.split('-').pop()!)

    inst.current = {
      level,
      requestedCat,
      requestedNode,
      currentCat,
      disposers: []
    }

    if (!allVariants) {
      inst.current?.disposers.push(reaction(
        () => {
          const cats = cmmc.selectedCategories
          return (cats.length > 0) ? cats[0].id : undefined
        },
        (catId) => {
          if (catId && catId !== cmmc.currentItem?.categoryId) {
            const cat = cmmc.getCategory(catId)
            cmmc.setCurrentItem(cat?.products[0].sku)
          }
        }
      ))
    }

    return () => {
      inst.current?.disposers.forEach((d) => {d()})
    }

  }, [])

  const setCatPath = (pathValue: string | null) => {
    if (inst.current?.currentCat.get() !== pathValue) {
      inst.current?.currentCat.set(pathValue) 
    }
    const found = cmmc.selectedItems.find((item) => (item.categoryId.endsWith(pathValue!)))
    if (found) { 
      cmmc.setCurrentItem(found.sku) 
    }
  }

  const selectSku = (sku: string) => {
    cmmc.setCurrentItem(sku)
    const pathValue = cmmc.currentItem?.categoryId.split('-').pop()!
    if (pathValue !== inst.current?.currentCat.get()) {
      inst.current?.currentCat.set(pathValue) 
    }
  }

  const catTitle = inst.current?.requestedCat ? inst.current.requestedCat.title : cmmc.selectedCategories?.[0]?.title

  const itemsToShow = (!cmmc.hasSelection) ? undefined : 
    allVariants ? cmmc.selectedItems : cmmc.selectedCategories[0].products as LineItem[]


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

  const scroll = !!(itemsToShow && itemsToShow.length > scrollAfter)
  return (
    <div className={cn(
      'px-4 md:px-6 pt-3 pb-4 flex flex-col items-center min-h-[60vh]', 
      clx,
      scroll ? scrollHeightClx : 'h-auto'
    )} >
    {inst.current?.requestedNode && (<>
      <ApplyTypography className={'mb-2 ' + (scroll ? 'shrink-0' : '')}>
        <h3>{inst.current!.requestedNode.label}</h3>
        {inst.current!.requestedNode.subNodesLabel && (
          <h6 className='!text-center font-bold text-muted mt-3'>{inst.current!.requestedNode.subNodesLabel}</h6>
        )}
      </ApplyTypography>
      <LevelNodesWidget
        className={cn(
          'grid gap-0 ' + `grid-cols-${inst.current.requestedNode.subNodes!.length}`, 
          'border-b-2 rounded-lg border-level-3 mb-4 -mr-2 -ml-2 max-w-[460px]',
          (scroll ? 'shrink-0' : ''),
          catWidgetClx  
        )} 
        mobile={mobile}
        mutator={allVariants ? 
          {
            get: () => (inst.current!.currentCat.s),
            set: setCatPath
          }
          : 
          getFacetValuesMutator(inst.current.level + 1, cmmc)
        } 
        itemClx='flex-col h-auto gap-0 py-1 px-3'
        buttonClx={
          'h-full ' +
          '!border-level-3'
        }
        levelNodes={inst.current.requestedNode.subNodes!}
        show={categoryTabAs}
      />
    </>)} 
    {!inst.current?.requestedNode && catTitle && (
      <TitleArea title={catTitle} clx=''/>
    )}
    {(cmmc.currentItem && showItemMedia) && (
      <ItemMedia item={cmmc.currentItem} constrainTo={{w: 200, h: 200}} clx={(scroll ? 'shrink-0' : '')}/>
    )} 
    {itemsToShow && (
      <Selector 
        items={itemsToShow}
        selectedItemRef={cmmc}
        selectSku={selectSku}
        {...selectorProps}
        scrollList={scroll}
        showCategory={selectorProps.showCategory ? 
          selectorProps.showCategory
          :
          (allVariants && !inst.current?.requestedCat)
        }
      />  
    )}
    {(cmmc.currentItem) && (
      <AddToCartWidget 
        size='default' 
        item={cmmc.currentItem}
        onQuantityChanged={onQuantityChanged} 
        className={cn('min-w-[160px] mx-auto mt-4', (scroll ? 'shrink-0' : ''), addWidgetClx)}
      />
    )} 
    </div >
  )
})

export default BuyCard
