'use client'
import React, { useState } from 'react'

import { ToggleGroup, ToggleGroupItem} from "@hanzo/ui/primitives"
import { cn } from '@hanzo/ui/util'

import type { FacetValueDesc, StringMutator, StringArrayMutator } from '../../types'
import FacetImage from './facet-image'

const FacetValuesWidget: React.FC<{
  facetValues: FacetValueDesc[]
  mutator: StringMutator | StringArrayMutator
  multiple?: boolean
  className?: string
  buttonClx?: string
  itemClx?: string
  isMobile?: boolean
  tabSize?: string
}> = ({
  facetValues,
  mutator,
  multiple=false,
  buttonClx='',
  itemClx='',
  className='',
  isMobile=false,
  tabSize
}) => {

  const [last, setLast] = useState<string | undefined>(undefined)

  const handleChangeMultiple = (selected: string[]) => {
    (mutator as StringArrayMutator).set(selected)
    setLast(selected.length === 1 ? selected[0] : undefined)
  }

  const handleChangeSingle = (selected: string) => {
    (mutator as StringMutator).set(selected)
    if (selected) { setLast(selected) }
  }

  const roundedToSpread: any = {}
  if (multiple) {
    roundedToSpread.rounded = 'xl'   
  }

  const val = multiple ? 
    (mutator as StringArrayMutator).get() 
    : 
    (mutator as StringMutator).get()

  return (
    <ToggleGroup 
      type={multiple ? 'multiple' : 'single'} 
      value={val}
      variant='default'
      size={tabSize ? tabSize : (isMobile ? 'sm' : 'default')}
      onValueChange={multiple ? handleChangeMultiple : handleChangeSingle}
      className={className}
      {...roundedToSpread}
    >
    {facetValues.map((fv, index) => {
      const roundedToSpread: any = {}
      if (!multiple) {
        roundedToSpread.rounded = 'none'   
        if (index === 0) { roundedToSpread.rounded = 'llg' }
        else if (index === facetValues.length - 1) { roundedToSpread.rounded = 'rlg' } 
      }
      return (
        <ToggleGroupItem 
          key={fv.value}
          value={fv.value} 
          disabled={(last && last === fv.value || fv.value === mutator.get())} 
          aria-label={`Select ${fv.label}`}
          {...roundedToSpread}
          className={buttonClx}
        >
          <span className={cn('flex flex-row justify-center gap-1 h-6 items-center', itemClx)} >
            <FacetImage facetValueDesc={fv} />
            {(!isMobile || !fv.img) && (<span className='whitespace-nowrap'>{fv.label}</span>)}
          </span>
        </ToggleGroupItem>
      )
    })}
    </ToggleGroup>  
  )
}
// hidden md:block 

export default FacetValuesWidget
