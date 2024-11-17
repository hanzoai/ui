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

interface SelectElement {
  value: string,
  label?: string,
  imageUrl?: string
}

const IMAGE_SIZE = 32

const ElementImage: React.FC<{
  url: string | undefined
  alt?: string
  w: number
  h: number
}> = ({
  url,
  alt,
  w,
  h
}) => (url &&
  <img
    src={url}
    alt={alt ?? 'image'}
    height={h}
    width={w}
    loading="eager"
    className="rounded-sm object-contain"
  />
)


const Combobox: React.FC<{
  elements: SelectElement[]
  buttonClx?: string 
  popoverClx?: string
  buttonPlaceholder?: string
  searchPlaceholder?: string
  initial?: SelectElement,
  elementSelected: (e: SelectElement) => void
  disabled?: boolean
}> = ({
  elements,
  buttonClx='',
  popoverClx='',
  initial,
  searchPlaceholder='Search...',
  buttonPlaceholder='Select...',
  elementSelected,
  disabled=false
}) => {

  const [open, setOpen] = useState<boolean>(false)
  const [current, setCurrent] = useState<SelectElement | null>(initial ?? null)

  const handleSelect = (selectedValue: string) => {

      // some issue w case... I know, right??
    const found = elements.find((el: SelectElement) => (el.value.toUpperCase() === selectedValue.toUpperCase()) )

    if (found) {
      setCurrent(found)
      elementSelected(found)
    }
    setOpen(false)
  }

  const isCurrent = (el: SelectElement): boolean => (
    !!current && (el.value.toUpperCase() === current.value.toUpperCase())
  )  

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
              <ElementImage url={current.imageUrl} w={IMAGE_SIZE} h={IMAGE_SIZE} alt={current.value + ' image'}/>
            )}
            <span>{ current ? (current.label ?? current.value) : buttonPlaceholder }</span>
          </div>
          <ChevronDown className={open ? '' : 'opacity-50'} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={'p-0 ' + popoverClx}>
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>No element found.</CommandEmpty>
            <CommandGroup>
            {elements.map((element) => (
              <CommandItem
                key={element.value}
                value={element.value}
                onSelect={handleSelect}
                className='flex justify-between'
              >
                <div className='flex justify-start items-center gap-2'>
                  <ElementImage url={element.imageUrl} w={IMAGE_SIZE} h={IMAGE_SIZE} alt={element.value + ' image'}/>
                  <span>{ element.label ?? element.value }</span>
                </div>
                <div>
                  <Check className={cn('ml-auto', (isCurrent(element)) ? '' : 'invisible' )} />
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

export {
  type SelectElement,
  Combobox as default
} 
