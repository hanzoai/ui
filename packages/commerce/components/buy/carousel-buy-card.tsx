'use client'
import React, { useRef, useEffect, type ComponentType, useState } from 'react'
import { observer } from 'mobx-react-lite'

import { cn } from '@hanzo/ui/util'
import { ApplyTypography, Button, MediaStack, Skeleton } from '@hanzo/ui/primitives'

import type { 
  ItemSelectorProps, 
  LineItem, 
  Family, 
  CategoryNode,
  CategoryNodeRole,
  SelectionUISpecifier,
  ItemSelectorOptions, 
} from '../../types'

import { useCommerce } from '../../service/context'
import { getSelectionUISpecifier } from '../../util'

import { CarouselItemSelector, ButtonItemSelector } from '../item-selector'
import FamilyCarousel from '../select-family/family-carousel'

import AddToCartWidget from './add-to-cart-widget'

const SCROLL = {
  scrollAfter: 5,
  scrollHeightClx: 'h-[65vh]'
}

const MEDIA_CONSTRAINT = {w: 200, h: 200}

const CarouselBuyCard: React.FC<{
  skuPath: string
  clx?: string
  mobile?: boolean
  handleCheckout: () => void
  onQuantityChanged?: (sku: string, oldV: number, newV: number) => void
}> = observer(({
  skuPath,
  clx='',
  mobile=false,
  handleCheckout,
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
  } | undefined>(undefined)

  const [changeMeToRerender, setChangeMeToRerender] = useState<boolean>(false)

  useEffect(() => {

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

      const items = peek.family!.products as LineItem[]
      const Selector: ComponentType<ItemSelectorProps> = 
        (uiSpec.singleFamily?.type === 'buttons') ? ButtonItemSelector : CarouselItemSelector
      const selOptions = uiSpec.singleFamily?.options

      r.current.single = {
        items,
        Selector,
        selOptions,
        scrollable: !!(items.length > SCROLL.scrollAfter),
        showItemMedia: uiSpec.singleFamily?.type !== 'carousel'
      }

      const currItem = peek.item ?? peek.family!.products[0]
      cmmc.setCurrentItem(currItem.sku)
    }
    else {
      const initialFamily = peek.family ? peek.family : peek.families![0]
      const currItem = peek.item ?? initialFamily.products[0]
      cmmc.setCurrentItem(currItem.sku)
    }

      // Must do this since Dialog code takes this comp out of the React shadow DOM
      // (only in prod apparently.)
    setChangeMeToRerender(!changeMeToRerender)

  }, [skuPath])

  const TitleArea: React.FC<{
    title: string
    byline?: string
    clx?: string
    bylineClx?: string
  }> = ({
    title,
    byline,
    clx='',
    bylineClx='' 
  }) => (
    <ApplyTypography className={clx}>
      <h3>{title}</h3>
      {byline && (<h6 className={bylineClx}>{byline}</h6>)}
    </ApplyTypography>
  )

  return (
    <div className={cn(
      'px-4 md:px-6 pt-3 pb-4 flex flex-col gap-4 items-center min-h-[40vh]', 
      clx,
      r.current?.single?.scrollable ? SCROLL.scrollHeightClx : 'h-auto'
    )}>
    {r.current?.single ? (<>
      <TitleArea title={r.current?.family?.title ?? ''} clx=''/>
      {(r.current.single.showItemMedia && cmmc.currentItem ) && (
        <MediaStack 
          media={cmmc.currentItem} 
          constrainTo={MEDIA_CONSTRAINT} 
          clx={(r.current.single.scrollable ? 'shrink-0' : '')}
        />
      )}
      {(r.current.single.showItemMedia && !cmmc.currentItem ) && (
        <Skeleton className={'w-[200px] h-[200px] my-4 ' + (r.current.single.scrollable ? 'shrink-0' : '')}/>
      )}
      {r.current.single.items && (
        <r.current.single.Selector 
          items={r.current.single.items}
          selectedItemRef={cmmc}
          selectSku={cmmc.setCurrentItem.bind(cmmc)}
          scrollable={r.current.single.scrollable}
          mobile={mobile}
          options={r.current.single.selOptions}
        />  
      )}
    </>) : (<>
      {r.current?.uiSpec.multiFamily?.showParentTitle && (
        <TitleArea 
          title={r.current?.node.label ?? ''} 
          byline={r.current?.node.subNodesLabel} 
          clx={'mb-2 '}
          bylineClx='!text-center font-bold text-muted mt-3'
        />
      )}
      {r.current?.families && ( // safegaurd for first render etc.
        <FamilyCarousel 
          families={r.current?.families}
          clx='w-full'
          slideOptions={r.current?.uiSpec.multiFamily?.slide.options}
          mediaConstraint={MEDIA_CONSTRAINT}
          mobile={mobile}
        />
      )}
    </>)}
    {(cmmc.currentItem) && (
      <div className={cn(
        'self-stretch mt-4 flex flex-col items-center gap-3',
        (r.current?.single?.scrollable ? 'shrink-0' : '')
      )}>
        <AddToCartWidget 
          size='default' 
          item={cmmc.currentItem}
          onQuantityChanged={onQuantityChanged} 
          variant={cmmc.cartEmpty ? 'primary' : 'outline'}
          className='min-w-[160px] w-full sm:max-w-[320px]' 
        />
        {!cmmc.cartEmpty && (
          <Button 
            onClick={handleCheckout} 
            variant='primary' 
            rounded='lg' 
            className='min-w-[160px] w-full sm:max-w-[320px]'
          >
            Checkout
          </Button>
        )}
      </div>
    )} 
    </div >
  )
})

export default CarouselBuyCard
