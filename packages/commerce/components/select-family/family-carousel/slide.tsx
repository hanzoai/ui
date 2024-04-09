'use client'
import React from 'react'

import {
  ApplyTypography,
  MediaStack
} from '@hanzo/ui/primitives'
import type { Dimensions } from '@hanzo/ui/types'

import type { FamilyCarouselSlideOptions, Family, LineItem, ItemSelector } from '../../../types'
import { ButtonItemSelector } from '../..'
import { cn } from '@hanzo/ui/util'

const FamilySlide: React.FC<Omit<ItemSelector, 'items'> & {
  family: Family
  mediaConstraint: Dimensions
  clx?: string
  mobile?: boolean,
  options?: FamilyCarouselSlideOptions
}> = ({
  family,
  selectedItemRef,
  selectSku,
  mediaConstraint: cnst = {w: 200, h: 200},
  clx='',
  mobile=false,
  options={}
}) => {

  const titleSpec = 'title' in options ? options.title : 'short'
  const showByline = 'showByline' in options ? options.showByline : true
  const title = titleSpec === 'long' ? 
    family.title 
    : 
    (
      titleSpec === 'short' ? 
        (family.titleShort ? family.titleShort : family.title ) 
        : 
        undefined
    )

  const byline = (showByline && family.byline) ? family.byline : undefined
  /*
  let byline: string | undefined = undefined
  if (showByline) {
    if (family.byline) {
        // if byline names another field thats a function, call it
      if (family.byline in family && typeof (family as any)[family.byline] === 'function') {
        byline = (family as any)[family.byline]() as string
      }
      else {
        byline = family.byline
      }
    }
  }
  */

  return (
    <div className={cn('flex flex-col items-center gap-4', clx)}>
      {title && (
        <ApplyTypography className='flex flex-col items-center !gap-1 [&>*]:!m-0'>
          <h6 className='font-bold text-lg'>{title}</h6>
          {byline && (<p className={''}>{byline}</p>)}
        </ApplyTypography>
      )}
      <MediaStack 
        media={selectedItemRef.item!} 
        constrainTo={cnst}
      />
      <ButtonItemSelector
        items={family.products as LineItem[]}
        selectedItemRef={selectedItemRef}
        selectSku={selectSku}
        scrollable={false}
        mobile={mobile}
        options={options}
        itemClx='text-sm'
      />
    </div>
  )
}

export default FamilySlide
