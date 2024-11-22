'use client'
import React, { useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

import { cn } from '../util'
import Button from './button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './command'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './popover'

import type ListAdaptor from './list-adaptor'

const ElementImage: React.FC<{
  url: string | undefined
  alt?: string
  w: number
  h: number
  className?: string
}> = ({
  url,
  alt,
  w,
  h,
  className=''
}) => (url ? (
    <img
      src={url}
      alt={alt ?? 'image'}
      height={h}
      width={w}
      loading="eager"
      className={className}
    />
  ) : null
)
// "rounded-sm object-contain"

const Combobox = <T,>(
  {
    elements,
    adaptor,
    buttonClx='',
    popoverClx='',
    imageClx='',
    initial,
    searchPlaceholder='Search...',
    buttonPlaceholder='Select...',
    noneFoundMessage='None found.',
    elementSelected,
    disabled=false,
    imageSize=32
  }: {
    elements: T[]
    adaptor: ListAdaptor<T>
    elementSelected: (e: T) => void
    buttonClx?: string 
    popoverClx?: string
    imageClx?: string
    buttonPlaceholder?: string
    searchPlaceholder?: string
    noneFoundMessage?: string
    initial?: T,
    disabled?: boolean
    imageSize?: number
}) => {

  const [open, setOpen] = useState<boolean>(false)
  const [current, setCurrent] = useState<T | null>(initial ?? null)

  const handleSelect = (selString: string) => {

    const found = elements.find((el: T) => (adaptor.valueEquals(el, selString)))
    if (found) {
      setCurrent(found)
      elementSelected(found)
    }
    setOpen(false)
  }

  const isCurrent = (el: T): boolean => (!!current && (adaptor.equals(el, current)))  

  let currentValue: string | undefined
  let currentLabel: string | undefined
  let currentImageUrl: string | undefined

  if (current) {
    currentValue = adaptor.getValue(current)
    currentLabel = adaptor.getLabel ? adaptor.getLabel(current) : undefined
    currentImageUrl = adaptor.getImageUrl ? adaptor.getImageUrl(current) : undefined
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className={'flex justify-between ' + buttonClx}
          disabled={disabled}
        >
          <div className='flex justify-start items-center gap-2'>
            {current && (
              <ElementImage url={currentImageUrl} w={imageSize} h={imageSize} className={imageClx} alt={currentValue + ' image'}/>
            )}
            <span>{ current ? (currentLabel ?? currentValue) : buttonPlaceholder }</span>
          </div>
          <ChevronDown className={open ? '' : 'opacity-50'} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={'p-0 ' + popoverClx}>
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{noneFoundMessage}</CommandEmpty>
            <CommandGroup>
            {elements.map((el) => (
              <CommandItem
                key={adaptor.getValue(el)}
                value={adaptor.getValue(el)}
                onSelect={handleSelect}
                className='flex justify-between'
              >
                <div className='flex justify-start items-center gap-2'>
                  <ElementImage 
                    url={adaptor.getImageUrl ? adaptor.getImageUrl(el) : undefined} 
                    w={imageSize} 
                    h={imageSize}  
                    className={imageClx} 
                    alt={adaptor.getValue(el) + ' image'}
                  />
                  <span>{ adaptor.getLabel ? adaptor.getLabel(el) : adaptor.getValue(el) }</span>
                </div>
                <div>
                  <Check className={cn('ml-auto', (isCurrent(el)) ? '' : 'invisible' )} />
                </div>
              </CommandItem>
            ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default Combobox
