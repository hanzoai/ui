'use client'
import React, { useState } from 'react'

import { ToggleGroup, ToggleGroupItem,} from "@hanzo/ui/primitives"
import { cn } from '@hanzo/ui/util'

import type { FacetValueDesc } from '../../types'
import FacetImage from './facet-image'

interface FacetMutatorSingle {
  val: string | null
  set(v: string | null): void
}

interface FacetMutatorMultiple {
  val: string[] | null
  set(v: string[] | null): void
}

const FacetTogglesWidget: React.FC<{
  facetValues: FacetValueDesc[]
  mutator: FacetMutatorSingle | FacetMutatorMultiple
  multiple?: boolean
  className?: string
  isMobile?: boolean
}> = ({
  facetValues,
  mutator,
  multiple='',
  className='',
  isMobile=false
}) => {

  const [last, setLast] = useState<string | undefined>(undefined)

  const handleChangeMultiple = (selected: string[]) => {
    (mutator as FacetMutatorMultiple).set(selected)
    if (selected.length === 1) {
      setLast(selected[0])
    }
    else {
      setLast(undefined)   
    }
  }

  const handleChangeSingle = (selected: string) => {
    (mutator as FacetMutatorSingle).set(selected)
    if (selected) {
      setLast(selected)
    }
  }

  const roundedToSpread: any = {}
  if (multiple) {
    roundedToSpread.rounded = 'xl'   
  }

  return (
    <ToggleGroup 
      type={multiple ? 'multiple' : 'single'} 
      value={multiple ? mutator.val as string[] : mutator.val as string}
      variant='default'
      size={isMobile ? 'sm' : 'default'}
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
          disabled={(last && last === fv.value || fv.value === mutator.val)} 
          aria-label={`Select ${fv.label}`}
          {...roundedToSpread}
        >
          <span className={cn('flex flex-row justify-center gap-1 h-4 items-center')} >
            <FacetImage facetValueDesc={fv} />
            <span className='hidden md:block whitespace-nowrap'>{fv.label}</span>
          </span>
        </ToggleGroupItem>
      )
    })}
    </ToggleGroup>  
  )
}

export {
  FacetTogglesWidget as default,
  type FacetMutatorSingle,
  type FacetMutatorMultiple
}
