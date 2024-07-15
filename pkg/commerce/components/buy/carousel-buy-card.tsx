'use client'
import React, { 
  useRef, 
  useEffect, 
  type ComponentType, 
  useState 
} from 'react'
import { observer } from 'mobx-react-lite'

import { cn } from '@hanzo/ui/util'

import type { 
  ItemSelectorProps, 
  LineItem, 
  Family, 
  CategoryNode,
  CategoryNodeRole,
  SelectionUISpecifier,
  ItemSelectorOptions,
  MultiFamilySelectorProps,
  MultiFamilySelectorOptions, 
} from '../../types'

import { useCommerce } from '../../service/context'
import { getSelectionUISpecifier } from '../../util'

import { CarouselItemSelector, ButtonItemSelector } from '../item-selector'
import SingleFamilySelector from './single-family-selector'
import { FamilyCarousel, AllVariantsCarousel } from './multi-family'

import AddToCartWidget from '../add-to-cart-widget'

const SCROLL = {
  scrollAfter: 5,
  scrollHeightClx: 'h-[65vh]'
}

const MEDIA_CONSTRAINT = {w: 200, h: 200}

const sortItems = (items: LineItem[], sort: 'asc' | 'desc' | 'none'): LineItem[] => (
  ((sort === 'asc') ? 
    items.sort((a: LineItem, b: LineItem): number => (a.price - b.price))
    :
    ((sort === 'desc') ?   
      items.sort((a: LineItem, b: LineItem): number => (b.price - a.price ))
      :
      items
    )
  )
)

const CarouselBuyCard: React.FC<{
  skuPath: string
  checkoutButton: React.ReactNode
  clx?: string
  selectorClx?: string
  addBtnClx?: string
  buttonsAreaClx?: string
  mobile?: boolean
  onQuantityChanged?: (sku: string, oldV: number, newV: number) => void
}> = ({
  skuPath,
  checkoutButton,
  clx='',
  selectorClx='',
  addBtnClx='',
  buttonsAreaClx='',
  mobile=false,
  onQuantityChanged,
}) => {

  const cmmc = useCommerce()

  const r = useRef<{
    role: CategoryNodeRole
    item: LineItem | undefined
    family: Family | undefined
    families: Family[] | undefined
    node: CategoryNode 
    uiSpec: SelectionUISpecifier
    single?: {
      items: LineItem[]
      Selector: ComponentType<ItemSelectorProps>
      selOptions: ItemSelectorOptions | undefined
      scrollable: boolean
      showItemMedia: boolean
    }
    multi?: {
      Selector: ComponentType<MultiFamilySelectorProps>
      selectorOptions: MultiFamilySelectorOptions | undefined
      itemOptions: ItemSelectorOptions | undefined
      initialFamilyId: string
    }  
  } | undefined>(undefined)

  const [changeMeToRerender, setChangeMeToRerender] = useState<boolean>(false)

  useEffect(() => {

    if (!skuPath || skuPath.length === 0 ) {
      // The component is being hidden (w an amination)
      // keep things the same so no layout jump
      return 
    }

    const peek = cmmc.peek(skuPath)
    if (typeof peek === 'string') {
      throw new Error(peek)
    }
    if (peek.role === 'non-outermost') {
      throw new Error(`BuyCard: skuPath ${skuPath} isn't an outermost tree node or product family!`)
    }

    const uiSpec = getSelectionUISpecifier(skuPath)

    r.current = {
      ...peek,
      node: peek.node!, // else exception was thrown.
      uiSpec,
    }

    if (peek.role === 'single-family') {

      const sort = (): 'none' | 'asc' | 'desc' => {
        const options = uiSpec.singleFamily?.options ?? {}
        const showSlider = 'showSlider' in options ? options.showSlider! : true
        return ('sort' in options) ? 
          options.sort!
          :
          (showSlider ? 'asc' : 'none')
      }

      const items = peek.family!.products as LineItem[]
      const Selector: ComponentType<ItemSelectorProps> = 
        (uiSpec.singleFamily?.type === 'buttons') ? ButtonItemSelector : CarouselItemSelector
      const selOptions = uiSpec.singleFamily?.options

      r.current.single = {
        items: sortItems(items, sort()),
        Selector,
        selOptions,
        scrollable: !!(items.length > SCROLL.scrollAfter),
        showItemMedia: uiSpec.singleFamily?.type !== 'carousel'
      }

      const currItem = peek.item ?? r.current.single.items[0]
      cmmc.setCurrentItem(currItem.sku)
    }
    else {
      const initialFamily = peek.family ? peek.family : peek.families![0]
        // TODO: Does this ever need to be sorted??
      const currItem = peek.item ?? initialFamily.products[0]

          // sets currentFamily as well
      cmmc.setCurrentItem(currItem.sku)

      r.current.multi = {
        Selector:  (uiSpec.multiFamily?.type === 'family-carousel') ? 
          FamilyCarousel 
          : 
          AllVariantsCarousel,
        itemOptions: uiSpec.multiFamily?.itemOptions,
        selectorOptions: uiSpec.multiFamily?.selectorOptions,
        initialFamilyId: initialFamily.id
      }
    }

      // Must do this since Dialog code takes this comp out of the React shadow DOM
      // (only in prod apparently.)
    setChangeMeToRerender(!changeMeToRerender)
  }, [skuPath])

  const MultiFamilyUI: React.FC<{      
    Selector: ComponentType<MultiFamilySelectorProps>
    selectorOptions: MultiFamilySelectorOptions | undefined
    itemOptions: ItemSelectorOptions | undefined
    families: Family[]
    parent: CategoryNode
    clx?: string
  }> = ({
    Selector,
    itemOptions,
    selectorOptions,
    families,
    parent,
    clx=''
  }) => (
    <Selector 
      families={families}
      parent={parent}
      clx={clx}
      itemOptions={itemOptions}
      selectorOptions={selectorOptions}
      mediaConstraint={MEDIA_CONSTRAINT}
      mobile={mobile}
    />
  )

  const Buttons: React.FC<{clx?: string}> = observer(({
    clx=''
  }) => (cmmc.currentItem ? (
    <div className={clx}>
      <AddToCartWidget 
        item={cmmc.currentItem}
        onQuantityChanged={onQuantityChanged} 
        variant={cmmc.cartEmpty ? 'primary' : 'outline'}
        className={addBtnClx} 
      />
      {!cmmc.cartEmpty && checkoutButton}
    </div>
  ) : null))

  return (
    <div className={cn(
      'px-4 md:px-6 pt-3 pb-4 flex flex-col gap-1 items-center', 
      r.current?.single?.scrollable ? SCROLL.scrollHeightClx : 'h-auto',
      clx,
    )}>
      {r.current?.single ? ( 
        <SingleFamilySelector 
          {...r.current.single} 
          mediaConstraint={MEDIA_CONSTRAINT}
          mobile={mobile} 
          clx={selectorClx}
        /> 
      ) : (r.current?.multi && r.current.families && /* safegaurd for first render, etc. */ (
        <MultiFamilyUI 
          {...r.current.multi} 
          families={r.current.families} 
          parent={r.current.node}
          clx={selectorClx}
        />
      ))}
      <Buttons clx={cn(
        'self-stretch mt-8 flex flex-col items-center gap-3 shrink-0 grow-0',
        buttonsAreaClx
      )}/>
    </div >
  )
}

export default CarouselBuyCard
