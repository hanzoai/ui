'use client'
import React from 'react'
import Image from 'next/image'
import { observer } from 'mobx-react-lite'

import { cn } from '@hanzo/ui/util'
import { Skeleton } from '@hanzo/ui/primitives'

import type { Family, ObsLineItemRef, LineItem } from '../../types'
import { formatCurrencyValue } from '../../util'
import { Icons } from '../Icons'

import AddToCartWidget from './add-to-cart-widget'
import { ButtonItemSelector } from '../item-selector'

const SelectFamilyItemPanel: React.FC<
  React.HTMLAttributes<HTMLDivElement> &   
  {
    family: Family
    selectedItemRef: ObsLineItemRef
    selectSku: (sku: string) => void 
    showQuantity?: boolean
    isLoading?: boolean
    mobile?: boolean
  }
> = /* NOT observer */ ({
  family,
  selectedItemRef,
  selectSku, 
  className, 
  showQuantity=true,
  isLoading = false, 
  mobile = false, 
  ...props
}) => {

  const soleOption = family.products.length === 1

  const FamilyImage: React.FC<{ className?: string }> = ({ className = '' }) => {

    if (isLoading) {
      // deliberately not Skeleton to have a better overall pulse effect.
      return <div className={cn(
        'bg-level-1 rounded-xl aspect-square w-full min-h-1 ', // +
        //' min-h-[100px] sm:min-h-[200px] lg:aspect-auto  2xl:w-auto 2xl:aspect-square',
        className)} />
    }

    return family.img ? (
      // TODO: Why so many div's?
      <div className={cn('flex flex-col justify-start', className)}>
        <div className={cn('w-full border rounded-xl p-6 ')}>
          <div className={cn('w-full aspect-square  relative')}>
            <Image
              src={family.img.src}
              fill
              sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1200px) 50vw, 20vw"
              alt={family.title}
              className=''
              loading='lazy'
              style={{ objectFit: 'contain' }} />
          </div>
        </div>
      </div>
    ) : (
      <div
        aria-label='Placeholder'
        role='img'
        aria-roledescription='placeholder'
        className={cn('w-full flex items-center justify-center aspect-square' , className)}
      >
        <Icons.barcode className='h-9 w-9 text-muted' aria-hidden='true' />
      </div>
    )
  }

  const AvailableAmounts: React.FC<{ className?: string }> = observer(({ className = '' }) => {

    if (soleOption) return null
    const mobilePicker = (mobile && family.products.length > 8) 

    return isLoading ? (
      <Skeleton className={'min-h-[120px] w-pr-60 mx-auto ' + className} />
    ) : (
      <div /* id='CV_AVAIL_AMOUNTS' */ className={cn(
        'sm:w-pr-80 sm:mx-auto md:w-full  flex flex-col justify-start items-center',
        (mobilePicker ? 'gap-4' : 'gap-8'),
        className
      )}>
        <div className='w-full flex flex-col justify-start items-center'>
          <h6 className='text-center font-semibold'>Available options</h6>
          <div className={'h-[1px] bg-muted-3 ' + (mobilePicker ?  'w-pr-55' :  'w-pr-60') } />
        </div>
          <ButtonItemSelector 
            items={family.products as LineItem[]}
            selectedItemRef={selectedItemRef}  
            selectSku={selectSku}
            options={{ showQuantity }}
            scrollable={false}
            clx='block columns-2 gap-4'
            itemClx='flex flex-row gap-2 items-center mb-2.5'
          />
      </div>
    )
  })

  const AddToCartArea: React.FC<{ className?: string }> = observer(({ className = '' }) => (
    (selectedItemRef.item && !isLoading) ? (
      <AddToCartWidget size='default' item={selectedItemRef.item} className={className}/>
    ) : (
      <div className={cn('h-6 w-12 invisible', className)} />
    )
  ))

  const TitleArea: React.FC<{ className?: string }> = observer(({ className = '' }) => (

    isLoading ? (<Skeleton className={'h-12 w-pr-80 mx-auto ' + className} />) : (

      <div className={cn('flex flex-col justify-start items-center', className)}>
        <h3 className='text-base md:text-lg lg:text-2xl font-heading text-center'>
        {family.parentTitle && (
          <span>{family.parentTitle}<br className='md:hidden' /><span className='xs:hidden md:inline '>,&nbsp;</span></span>
        )}
          <span>{family.title}</span>
        </h3>
        {selectedItemRef.item?.sku ? (
          <h6 className='text-center font-semibold'>
            {(soleOption ? '' : (selectedItemRef.item.optionLabel + ': ')) + formatCurrencyValue(selectedItemRef.item.price)}
          </h6>
        ) : ''}
      </div>
  )))

  const Desc: React.FC<{ className?: string }> = ({ className = '' }) => (
    isLoading ? (
      <Skeleton className={'min-h-20 w-full grow mx-auto ' + className} />
    ) : (
      <p className={cn('text-base lg:text-lg mb-6 xs:mb-0', className)}>{family.desc}</p>
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
      {isLoading ? ( <Skeleton className={'min-h-30 w-full '} /> ) : (<>
        <FamilyImage className='w-pr-33' />
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
          <FamilyImage className='w-full' />
        </div>
        <div /* id='CV_CONTENT_COL */ className={'flex flex-col xl:w-pr-60 justify-center ' + (soleOption ? '' : 'gap-6') }>
          <div /* id='CV_MD_IMAGE_AND_TITLE */ className='hidden md:flex xl:hidden flex-row gap-x-3'>
            <FamilyImage className='min-w-pr-30' />
            <TitleArea className='grow' />
          </div>
         
          <div /*  id='CV_CONTENT' */ className={'flex flex-col gap-2.5 ' + (isLoading ? 'justify-between h-full' : '')}>
            <TitleArea className='md:hidden xl:flex' />
            <Desc className='' />
          </div>
          <div /* id='CV_CTA_AREA_BIG' */ className='hidden lg:flex flex-col justify-start items-center gap-6'>
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


export default SelectFamilyItemPanel