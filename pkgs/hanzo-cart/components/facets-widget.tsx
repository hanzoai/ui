'use client'
import React, { type PropsWithChildren } from 'react'

import { cn } from '@hanzo/ui/util'

import type { FacetsDesc } from '../types'

import FacetTogglesWidget, { 
  type FacetMutatorSingle, 
  type FacetMutatorMultiple
} from './facet-toggles-widget'

const FacetsWidget: React.FC<PropsWithChildren & {
  facets: FacetsDesc
  facetClassNames?: string[]
  mutators:  FacetMutatorSingle[] | FacetMutatorMultiple[]
  multiple?: boolean
  isMobile?: boolean
  id?: string
  className?: string
}> = ({
  children,
  facets,
  mutators,
  multiple=false,
  facetClassNames,
  isMobile=false,
  className='',
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
        className={cn((horiz ? '' : 'mb-2'), (i !== 0 && !horiz) ? 'mt-2' : '', (facetClassNames?.[i]) ?? '')} 
      />
    ))}
      {children}
    </div>
  )
}

export default FacetsWidget
