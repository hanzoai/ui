'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { reaction } from 'mobx'
import { observer } from 'mobx-react-lite'

import { cn } from '@hanzo/ui/util'

import {
  ApplyTypography,
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  MediaStack,
} from '@hanzo/ui/primitives'

import type { MultiFamilySelectorProps, LineItem } from '../../../types'
import { 
  formatCurrencyValue, 
  accessItemOptions, 
  accessMultiSelectorOptions 
} from '../../../util'

import QuantityIndicator from '../../item-selector/quantity-indicator'
import { ButtonItemSelector, useCommerce } from '../../..'

const debugBorder = (c: 'r' | 'g' | 'b', disable: boolean = true): string => {

  if (disable) {
    return ''
  }
  switch (c) {
    case 'r': return ' border border-[#ffaaaa] '
    case 'g': return ' border border-[#aaffaa] '
    case 'b': return ' border border-[#aaaaff] '
  }
}

const DEFAULT_CONSTRAINT = {w: 250, h: 250}

const AllVariantsCarousel: React.FC<MultiFamilySelectorProps> = ({ 
  families,
  parent,
  clx='',
  itemClx='',
  itemOptions,
  selectorOptions,
  mediaConstraint=DEFAULT_CONSTRAINT,
  mobile=false, // not relavant to any children
}) => {
   
  const cmmc = useCommerce()
  const r = useRef<{
    api: CarouselApi | undefined 
    items: LineItem[] 
    dontRespond: boolean
    initialIndex: number 
  } | undefined>(undefined)


  const [changeMeToRerender, setChangeMeToRerender] = useState<boolean>(false)
    // Safe, since Carousel is only render (and this method passed), once the ref is initialized.
  const setApi = (api: CarouselApi) => { r.current!.api = api }
  
  const onSelect = useCallback((emblaApi: CarouselApi) => {
    if (r.current?.dontRespond) {
      r.current.dontRespond = false
      return
    }
    const index = emblaApi.selectedScrollSnap()
    if (index !== -1) {
      const item = r.current?.items[index]
      cmmc.setCurrentItem(item?.sku) // (sets currentFamily as well)
    }
    if (r.current) {
      r.current.dontRespond = false  
    }
  }, [])

  useEffect(() => {

    const items = families.map((fam) => (fam.products as LineItem[])).flat()
    const foundIndex = cmmc.currentItem ? items.findIndex((item) => (cmmc.currentItem!.sku == item.sku)) : -1
    r.current = {
      items,
      initialIndex: foundIndex === -1 ? 0 : foundIndex,
      dontRespond: false,
      api: undefined
    }

    setChangeMeToRerender(!changeMeToRerender)

      // This responds to the swatch clicks
    return reaction(
      () => (cmmc.currentItem),
      (item) => {
        if (r.current && r.current.api) {
          const index = r.current.items.findIndex((_item: LineItem) => (_item.sku === item?.sku))  
          if (index && index !== -1) {
              // no need to sync family, since ui only allows selecting within a family            
            r.current.dontRespond = true
            r.current.api.scrollTo(index) 
          }
        }
      }  
    )
  }, [])

  const Header: React.FC<{clx?: string}> = observer(({
    clx=''
  }) => {

    const { showParentTitle, parentByline: parentBylineMode  } = accessMultiSelectorOptions(selectorOptions)
    const { familyTitle, showFamilyByline } = accessItemOptions(itemOptions)

    const parentTitleDisplay = showParentTitle ? parent.label : undefined
    const parentBylineDisplay = (parentBylineMode === 'own-line') ? parent.subNodesLabel : ''

    const title = (familyTitle === 'none' ? 
      undefined 
      : 
      (familyTitle === 'long' ? 
        cmmc.currentFamily?.title 
        : 
        (cmmc.currentFamily?.titleShort ?? cmmc.currentFamily?.title)
      ) 
    )

    let titleLinePrefix = (parentBylineMode === 'none' || parentBylineMode ===  'own-line') ? '' : (parent.subNodesLabel ?? '')
    if (titleLinePrefix.length > 0 && title && parentBylineMode === 'comma-sep') {
        titleLinePrefix += ', '
    }
    else if (titleLinePrefix.length > 0 && title && parentBylineMode === 'colon-sep') {
        titleLinePrefix += ': '
    }
    const titleDisplay = title ? (titleLinePrefix + title) : undefined
    const bylineDisplay = (familyTitle !== 'none') && showFamilyByline ? cmmc.currentFamily?.byline :  undefined

    return (
      <ApplyTypography className={cn('flex flex-col items-center !gap-0 [&>*]:!m-0 ', clx)} >
        {parentTitleDisplay && <h4>{parentTitleDisplay}</h4>}
        {parentBylineDisplay && <h4>{parentBylineDisplay}</h4>}
        {titleDisplay && <h4>{titleDisplay}</h4>}
        {bylineDisplay && (<h6 >{bylineDisplay}</h6>)}
      </ApplyTypography>
    )
  })

  const ItemInfo: React.FC<{
    clx?: string
    labelClx?: string
  }> = observer(({
    clx='',
    labelClx=''
  }) => {

    const {
      showPrice, 
      showQuantity,
      showFamilyInOption,
      showByline,
    } = accessItemOptions(itemOptions)
    
    const optionLabel = () => (
      showFamilyInOption ? 
        (cmmc.currentItem!.familyTitle + ', ' + cmmc.currentItem!.optionLabel) 
        : 
        cmmc.currentItem!.optionLabel 
    )

    return (cmmc.currentItem && (
      <ApplyTypography className={cn('flex flex-col items-center [&>*]:!m-0 !gap-1 ', clx)}>
        <div className={
          'flex items-center gap-1 [&>*]:!m-0 ' + 
          debugBorder('g') + 
          (showFamilyInOption ? 'flex-col' : 'flex-row')
        }>
          <h6 className={cn('font-semibold', labelClx)}>
            {optionLabel() + (showPrice && !showFamilyInOption ? ',' : '')}
          </h6>
          <div className={
            'flex items-center gap-1 [&>*]:!m-0 flex-row ' +  debugBorder('b') +  
            (showFamilyInOption ? 'w-full justify-between' : '')
          }>
            {showPrice && (<p>{formatCurrencyValue(cmmc.currentItem.price)}</p>)}
            {showQuantity && (
              <QuantityIndicator 
                item={cmmc.currentItem} 
                clx='h-[22px] ml-4' 
                iconClx='fill-foreground'
                digitClx='not-typography font-semibold text-primary-fg leading-none font-sans text-xs' 
              />
            )}
          </div>
        </div>
        {showByline && cmmc.currentItem.byline && (<p>{cmmc.currentItem.byline}</p>)}
      </ApplyTypography>
    ))
  })

  const Swatches: React.FC<{
    clx?: string
  }> = observer(({
    clx=''
  }) => {
    const { showItemSwatches } = accessMultiSelectorOptions(selectorOptions)
    if (
      !showItemSwatches || 
      !cmmc.currentFamily 
      //|| cmmc.currentFamily.products.length === 1
    ) {
      return null
    }
    return <ButtonItemSelector
      items={cmmc.currentFamily.products as LineItem[]}
      selectedItemRef={cmmc}
      selectSku={cmmc.setCurrentItem.bind(cmmc)}
      clx={clx}
      options={{
        buttonType: 'image',
        horizButtons: true
      }}      
    />
  })

  return ( 
    <div className={cn('w-full flex flex-col items-center', clx)}>
      <Header />
      {r.current && /* Only render once we've set the ref fields, or else bad things! */ (
        <Carousel 
          options={{loop: true, startIndex: r.current.initialIndex}} 
          className={'w-full px-2' + debugBorder('r')} 
          onCarouselSelect={onSelect} 
          setApi={setApi}
        >
          <CarouselContent>
          {r.current.items.map((item) => (
            <CarouselItem key={item.sku} className={cn('p-2 flex flex-col justify-center items-center', itemClx)}>
              <MediaStack media={item} constrainTo={mediaConstraint} clx='my-4'/>
            </CarouselItem>
          ))}
          </CarouselContent>
          <CarouselPrevious className='left-1'/>
          <CarouselNext className='right-1'/>
        </Carousel>
      )}
      <ItemInfo labelClx='!text-base font-medium'/>
      <Swatches clx='mt-2'/> 
    </div>
  )
}

export {
  AllVariantsCarousel as default 
}
