'use client'
import React, { useState } from 'react'
import Image from 'next/image'
import { observer } from 'mobx-react-lite'

import { cn } from '@hanzo/ui/util'
import { Skeleton } from '@hanzo/ui/primitives'

import { useCommerce } from '../service'
import type { Category, LineItem, ObsLineItemRef } from '../types'
import { formatPrice } from '../util'
import { Icons } from './Icons'

import AddToCartWidget from './add-to-cart-widget'
import ProductSelectionRadioGroup from './product-selection-radio-group'
import ProductSelectionMobilePicker from './product-selection-mobile-picker'

const SelectItemInCategoryView: React.FC<React.HTMLAttributes<HTMLDivElement> & {
  category: Category
  lineItemRef: ObsLineItemRef
  handleItemSelected: (sku: string) => void 
  isLoading?: boolean
  mobile?: boolean
}> = ({
  category,
  lineItemRef,
  handleItemSelected, 
  className, 
  isLoading = false, 
  mobile = false, 
  ...props
}) => {

  const waiting = (): boolean => (isLoading || !category)

  const CategoryImage: React.FC<{ className?: string }> = ({ className = '' }) => {

    if (waiting()) {
      // deliberately not Skeleton to have a better overall pulse effect.
      return <div className={cn(
        'bg-level-1 rounded-xl aspect-square ' +
        ' min-h-[100px] sm:min-h-[200px] lg:aspect-auto lg:h-[300px] lg:w-[200px] 2xl:w-auto 2xl:aspect-square',
        className)} />
    }

    if (!category.img) {
      return (
        <div
          aria-label='Placeholder'
          role='img'
          aria-roledescription='placeholder'
          className={cn('h-60 flex items-center justify-center', className)}
        >
          <Icons.barcode className='h-9 w-9 text-muted' aria-hidden='true' />
        </div>
      )
    }

    return (
      <div className={cn('flex flex-col justify-start', className)}>
        <div className={cn('w-full border rounded-xl p-6 ')}>
          <div className={cn('w-full aspect-square  relative')}>
            <Image
              src={category.img!}
              fill
              sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1200px) 50vw, 20vw"
              alt={category.title}
              className=''
              loading='lazy'
              style={{ objectFit: 'contain' }} />
          </div>
        </div>
      </div>
    )
  }

  const AvailableAmounts: React.FC<{ className?: string }> = observer(({ className = '' }) => {

    const soleOption = !waiting() && category.products.length === 1
    const mobilePicker = !waiting() && (mobile && category.products.length > 8) 

    return waiting() ? (
      <Skeleton className={'min-h-[120px] w-pr-60 mx-auto ' + className} />
    ) : (
      <div /* id='CV_AVAIL_AMOUNTS' */ className={cn(
        'sm:w-pr-80 sm:mx-auto md:w-full  flex flex-col justify-start items-center',
        (soleOption ? 'gap-2' : mobilePicker ? 'gap-4' : 'gap-8'),
        className
      )}>
        <div className='w-full flex flex-col justify-start items-center'>
          <h6 className='text-center font-semibold'>{`Available size${soleOption ? '' : 's'}`}</h6>
          <div className={'h-[1px] bg-muted-3 ' + (mobilePicker ?  'w-pr-55' :  'w-pr-80') } />
        </div>
        {soleOption ? (
          <p>{category.products[0].titleAsOption}</p>
        ) : ( mobilePicker ? (
            <ProductSelectionMobilePicker
              products={category.products}
              selectedSku={lineItemRef.item?.sku ?? undefined}  
              onValueChange={handleItemSelected}
              height={180}
              itemHeight={30}
              outerClx='mb-4'
            />
          ) : (
            <ProductSelectionRadioGroup 
              products={category.products}
              selectedSku={lineItemRef.item?.sku ?? undefined}  
              onValueChange={handleItemSelected}
              groupClx='grid grid-cols-2 gap-0 gap-y-3 gap-x-8 '
              itemClx='flex flex-row gap-2 items-center'
            />
          )
        )}
      </div>
    )
  })

  const AddToCartArea: React.FC<{ className?: string }> = observer(({ className = '' }) => (
    (lineItemRef.item && !isLoading) ? (
      <AddToCartWidget size='default' item={lineItemRef.item} className={className}/>
    ) : (
      <div className={cn('h-6 w-12 invisible', className)} />
    )
  ))

  const TitleArea: React.FC<{ className?: string }> = observer(({ className = '' }) => (
    waiting() ? (<Skeleton className={'h-12 w-pr-80 mx-auto ' + className} />) : (

      <div className={cn('flex flex-col justify-start items-center mb-6', className)}>
        <h3 className='text-base md:text-lg lg:text-2xl md:mt-[2vw] font-nav text-center'>
          <span className='xs:inline md:hidden'>
            {category.title.split(', ').map((s, i) => (<p key={i}>{s}</p>))}
          </span>
          <span className='xs:hidden md:inline '>
            {category.title}
          </span>
        </h3>
        {lineItemRef.item?.sku ? (
          <h6 className='text-center font-semibold'>
            {lineItemRef.item.titleAsOption + ': ' + formatPrice(lineItemRef.item.price)}
          </h6>
        ) : ''}
      </div>
  )))

  const Desc: React.FC<{ className?: string }> = ({ className = '' }) => (
    waiting() ? (
      <Skeleton className={'min-h-20 w-full grow mx-auto ' + className} />
    ) : (
      <p className={cn('text-base lg:text-lg mb-6 xs:mb-0', className)}>{category.desc}</p>
    )
  )

  return mobile ? (
    <div /* id='CV_OUTER' */ 
      className={cn(
        'w-full h-[calc(100svh-96px)] max-h-[700px] flex flex-col justify-between ' + 
        'items-stretch gap-[4vh] mt-[2vh] pb-[6vh]', 
        className
      )} 
      {...props}
    >
      <div /* id='CV_TITLE_AND_IMAGE_ROW' */ className='flex flex-row justify-between items-start w-full'>
      {waiting() ? ( <Skeleton className={'min-h-30 w-full '} /> ) : (<>
        <CategoryImage className='w-pr-33' />
        <TitleArea className='grow pt-3 mb-0' />
      </>)}
      </div> 
      <Desc className='' />
      <AvailableAmounts className='mb-[3vh]' />
      <AddToCartArea className='w-pr-70 mx-auto' />
    </div>
  ) : (
    <div /* id='CV_OUTERMOST' */>
      <div /* id='CV_OUTER' */ className={cn('w-full flex flex-row justify-between items-stretch gap-6 sm:gap-4', className)} {...props}>
        <div /* id='CV_IMAGE_COL_SEP' */ className={'relative ' + (!isLoading ? 'md:hidden sm:min-w-[185px] xl:flex xl:w-pr-40' : '')}>
          <CategoryImage className='w-full' />
        </div>
        <div /* id='CV_CONTENT_COL */ className='flex flex-col gap-y-6 xl:w-pr-60'>
          <div /* id='CV_MD_IMAGE_AND_TITLE */ className='hidden md:flex xl:hidden flex-row gap-x-3'>
            <CategoryImage className='min-w-pr-30' />
            <TitleArea className='grow' />
          </div>
          
          <div /*  id='CV_CONTENT' */ className={'flex flex-col gap-2.5 ' + (isLoading ? 'justify-between h-full' : '')}>
            <TitleArea className='md:hidden xl:flex' />
            <Desc className='' />
          </div>
          <div /* id='CV_CTA_AREA_BIG' */ className='hidden lg:flex p-4 flex-col justify-start items-center gap-6'>
            <AvailableAmounts />
            <AddToCartArea className='' />
          </div>
        </div>
      </div>
      <div /* id='CV_CTA_AREA_COMPACT' */ className='lg:hidden flex p-4 flex-col justify-start items-center gap-6'>
        <AvailableAmounts />
        <AddToCartArea className='' />
      </div>
    </div>
  )
}


export default SelectItemInCategoryView