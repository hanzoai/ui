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

const DEFAULT_IMAGE_SIZE = 32

interface ComboboxTriggerProps<T> {
  current: T | null
  currentLabel: string | null
  imageUrl: string | null
  placeholder?: string 
  buttonClx?: string
  imageClx?: string
  disabled?: boolean
  imageSize?: number  
  noChevron?: boolean
  open: boolean
}

/*
function createTrigger<T, P extends ComboboxTriggerProps<T>>(
  func: (
    props: P,
    ref: React.ForwardedRef<HTMLButtonElement>
  ) => React.ReactNode
) : 
  <T, P>(props: P & { ref?: React.ForwardedRef<HTMLButtonElement> }) => React.ReactNode
{
  return React.forwardRef(func) as <T, P>(props: P & { ref?: React.ForwardedRef<HTMLButtonElement> }) => React.ReactNode
}
*/
const DefaultTriggerInner = <T,>(
  {
    current,
    currentLabel,
    imageUrl,
    buttonClx='',
    imageClx='',
    placeholder='(select)',
    disabled=false,
    imageSize=DEFAULT_IMAGE_SIZE,  
    noChevron=false,
    open,
    ...rest
  }: ComboboxTriggerProps<T>,
  ref: React.ForwardedRef<HTMLButtonElement>
) => (
  <Button
    ref={ref}
    {...rest}
    variant='outline'
    role='combobox'
    aria-expanded={open}
    className={cn(
      'flex',
      noChevron ? 'justify-start' : 'justify-between',
      buttonClx
    )}
    disabled={disabled}
  >
    <div className='flex justify-start items-center gap-2'>
    {current ? (
      <img
        src={imageUrl!}
        alt={currentLabel + ' image'}
        height={imageSize}
        width={imageSize}
        loading="eager"
        className={imageClx}
      />
    ) : (
      <div style={{width: imageSize, height: imageSize}} />
    )}
      <span>{currentLabel}</span>
    </div>
    {!noChevron && (<ChevronDown className={open ? '' : 'opacity-50'} />)}
  </Button>
)


//type CBTrigger = <T>(props: ComboboxTriggerProps<T> & { ref?: React.ForwardedRef<HTMLButtonElement> }) => React.ReactNode

// const DefaultTrigger = <T,>(props: (ComboboxTriggerProps<T> & { ref?: React.ForwardedRef<HTMLButtonElement>})) =>(createTrigger<T>(DefaultTriggerInner(props, ref)))
const DefaultTrigger = React.forwardRef(DefaultTriggerInner) as <T, P>(props: P & { ref?: React.ForwardedRef<HTMLButtonElement> }) => React.ReactNode


const Combobox = <T, P extends ComboboxTriggerProps<T>>({
  elements,
  adaptor,
  popoverClx='',
  listItemClx='',
  listItemSelectedClx='',
  noCheckmark=false,
  listItemImageClx='',
  initial,
  searchPlaceholder='Search...',
  noneFoundMessage='None found.',
  elementSelected,
  listItemImageSize=DEFAULT_IMAGE_SIZE,
  noSearch=false,
  popoverAlign = 'center', 
  popoverSideOffset = 4,
  Trigger, 
  triggerProps
}: {
  elements: T[]
  adaptor: ListAdaptor<T>
  elementSelected: (e: T) => void
  popoverClx?: string
  listItemClx?: string
  listItemSelectedClx?: string
  noCheckmark?: boolean
  listItemImageClx?: string
  searchPlaceholder?: string
  noneFoundMessage?: string
  initial?: T
  listItemImageSize?: number
  noSearch?: boolean
  popoverAlign?: "center" | "end" | "start"
  popoverSideOffset?: number
    /** 
     * If (custom) Trigger is not supplied, 
     * passed to default trigger */
  triggerProps: P
    /**
     * should be result of calling createTrigger
     */
  Trigger?: 
    <T, P>(props: P & { ref?: React.ForwardedRef<HTMLButtonElement> }) => React.ReactNode
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

  const toSpread = current ? {
    ...triggerProps,
    current,
    currentLabel: adaptor.getLabel ? adaptor.getLabel(current) : adaptor.getValue(current),
    imageUrl: adaptor.getImageUrl ? adaptor.getImageUrl(current) : null
  } : {
    ...triggerProps,
    current: null,
    currentLabel: null,
    imageUrl: null 
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {Trigger ? (
          <Trigger<T, P> {...toSpread} />
        ) : (
          <DefaultTrigger<T, P> {...toSpread} />
        )}
      </PopoverTrigger>
      <PopoverContent className={cn('p-0', popoverClx)} align={popoverAlign} sideOffset={popoverSideOffset}>
        <Command>
          {!noSearch && (<CommandInput placeholder={searchPlaceholder} />)}
          <CommandList>
            <CommandEmpty>{noneFoundMessage}</CommandEmpty>
            <CommandGroup>
            {elements.map((el) => (
              <CommandItem
                key={adaptor.getValue(el)}
                value={adaptor.getValue(el)}
                onSelect={handleSelect}
                className={cn(
                  'flex', 
                  noCheckmark ? 'justify-start' : 'justify-between', 
                  listItemClx, 
                  (isCurrent(el) ? listItemSelectedClx : '')
                )}
              >
                <div className='flex justify-start items-center gap-2'>
                { (adaptor.getImageUrl && adaptor.getImageUrl(el)) ? (
                  <img
                    src={adaptor.getImageUrl(el)}
                    alt={adaptor.getValue(el) + ' image'}
                    height={listItemImageSize}
                    width={listItemImageSize}
                    loading="eager"
                    className={listItemImageClx}
                  />
                ) : (
                  <div style={{width: listItemImageSize, height: listItemImageSize}} />
                )}
                  <span>{ adaptor.getLabel ? adaptor.getLabel(el) : adaptor.getValue(el) }</span>
                </div>
                {!noCheckmark && (
                <div>
                  <Check className={cn('ml-auto', (isCurrent(el)) ? '' : 'invisible' )} />
                </div>
                )}
              </CommandItem>
            ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export {
  Combobox as default,
//  createTrigger,
  type ComboboxTriggerProps
} 
