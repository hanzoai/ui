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
    {(current && imageUrl) ? (
      <img
        src={imageUrl}
        alt={currentLabel + ' image'}
        height={imageSize}
        width={imageSize}
        loading="eager"
        className={cn('block', imageClx)}
      />
    ) : (
      <div style={{width: imageSize, height: imageSize}} />
    )}
      <span className='block'>{currentLabel}</span>
    </div>
    {!noChevron && (<ChevronDown className={cn('block', open ? '' : 'opacity-50')} />)}
  </Button>
)

const DefaultTrigger = React.forwardRef(DefaultTriggerInner) as <T, P>(props: P & { ref?: React.ForwardedRef<HTMLButtonElement> }) => React.ReactNode

const Combobox = <T, P extends ComboboxTriggerProps<T>>({
  elements,
  initial,
  current,
  setCurrent,
  closeOnSelect=true,
  adaptor,
  popoverClx='',
  listItemClx='',
  listItemSelectedClx='',
  listItemDisabledClx='',
  noCheckmark=false,
  listItemImageClx='',
  searchPlaceholder='Search...',
  noneFoundMessage='None found.',
  listItemImageSize=DEFAULT_IMAGE_SIZE,
  noSearch=false,
  popoverAlign = 'center', 
  popoverSideOffset = 4,
  Trigger, 
  triggerProps
}: {
  elements: T[]
  initial?: T | null
  current?: T | null
  setCurrent: (c: T | null) => void 
  closeOnSelect?: boolean
  adaptor: ListAdaptor<T>
  popoverClx?: string
  listItemClx?: string
  listItemSelectedClx?: string
  listItemDisabledClx?: string
  listItemImageClx?: string
  listItemImageSize?: number
  noCheckmark?: boolean
  searchPlaceholder?: string
  noneFoundMessage?: string
  noSearch?: boolean
  popoverAlign?: "center" | "end" | "start"
  popoverSideOffset?: number
    /** If (custom) Trigger is not supplied, 
     * passed to default trigger */
  triggerProps: P
  Trigger?: 
    <T, P>(props: P & { ref?: React.ForwardedRef<HTMLButtonElement> }) => React.ReactNode
}) => {

  const [_open, _setOpen] = useState<boolean>(false)
    // for non-controlled base (must declare the hook either way)
  const [_current, _setCurrent] = useState<T | null>(initial ?? null)

  const handleSelect = (selString: string) => {

    const found = elements.find((el: T) => (adaptor.valueEquals(el, selString)))
    if (found) {
        // non-controlled ('initial' supplied (may have been null))
      if (initial !== undefined) {
        _setCurrent(found)
      }
      setCurrent(found)
    }
    if (closeOnSelect) {
      _setOpen(false)
    }
  }

  const isCurrent = (el: T): boolean => {

      // non-controlled?
    const curr = (current === undefined) ? _current : current
    return !!curr && adaptor.equals(el, curr)
  }  

  const _triggerProps = current ? {
    ...triggerProps,
    current,
    currentLabel: adaptor.getLabel ? adaptor.getLabel(current) : adaptor.getValue(current),
    imageUrl: adaptor.getImageUrl ? adaptor.getImageUrl(current) : null,
    open: _open
  } : {
    ...triggerProps,
    current: null,
    currentLabel: null,
    imageUrl: null,
    open: _open 
  }

  return (
    <Popover open={_open} onOpenChange={_setOpen}>
      <PopoverTrigger asChild>
        {Trigger ? (
          <Trigger<T, P> {..._triggerProps} />
        ) : (
          <DefaultTrigger<T, P> {..._triggerProps} />
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
                disabled={adaptor.isDisabled ? adaptor.isDisabled(el) : false}
                className={cn(
                  'flex', 
                  noCheckmark ? 'justify-start' : 'justify-between', 
                  listItemClx, 
                  (isCurrent(el) ? listItemSelectedClx : ''),
                  ((adaptor.isDisabled && adaptor.isDisabled(el)) ? listItemDisabledClx : '')
                )}
              >
                <div className='flex justify-start items-center gap-2'>
                { (adaptor.getImageUrl && adaptor.getImageUrl(el)) ? (
                  <img
                    src={adaptor.getImageUrl(el)!}
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
  type ComboboxTriggerProps
} 
