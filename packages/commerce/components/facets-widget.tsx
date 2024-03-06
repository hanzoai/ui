'use client'
import React, { type PropsWithChildren } from 'react'

import { cn } from '@hanzo/ui/util'

import type { FacetsDesc, StringMutator, StringArrayMutator } from '../types'

import FacetTogglesWidget from './facet-toggles-widget'

const FacetsWidget: React.FC<PropsWithChildren & {
  facets: FacetsDesc
  mutators:  StringMutator[] | StringArrayMutator[]
  facetClx?: string[]
  facetItemClx?: string
  multiple?: boolean
  isMobile?: boolean
  id?: string
  className?: string
  tabSize?: string 
}> = ({
  children,
  facets,
  mutators,
  multiple=false,
  facetClx,
  facetItemClx='',
  isMobile=false,
  className='',
  tabSize,
  id='FacetsWidget'
}) => {
  const horiz = className.includes('flex-row')
  return (
    <div id={id} className={className} >
    {Object.keys(facets).map((key, i) => (
      <FacetTogglesWidget 
        key={i}
        multiple={multiple}
        mutator={mutators[i]} 
        isMobile={isMobile}
        facetValues={facets[parseInt(key)]} 
        className={cn((horiz ? '' : 'mb-2'), (i !== 0 && !horiz) ? 'mt-2' : '', (facetClx?.[i]) ?? '')}
        buttonClx={facetItemClx} 
        tabSize={tabSize}
      />
    ))}
      {children}
    </div>
  )
}

export default FacetsWidget
