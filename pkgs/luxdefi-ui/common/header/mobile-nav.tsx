'use client'
import React from 'react'

import { type ButtonVariants, LinkElement }  from '../../primitives'
import type { SiteDef } from '../../types'
import { cn } from '../../util'

// onAction is *in addition* to the link's navigation 
  // action itself.  eg, for also closing the modal menu
const MobileNav: React.FC<{
  siteDef: SiteDef
  className?: string
  navElementClasses?: string
  onAction?: () => void 
}> = ({
  siteDef,
  onAction,
  className='',
  navElementClasses='',
}) => {

  const {nav: {elements, featuredCTA}} = siteDef

  return (elements.length || featuredCTA) ? (
    <nav className={className} >
    {elements.map((el, index) => {
      const variant = el.variant ?? 'link'
      let extraClasses = '' 
        // note that linkFG (or any other variant of 'link') 
        // will not get assigned these classes,
        // and will remain styles is 'foreground' (hence the name)
      if (variant === 'link') {
        extraClasses+= ' text-nav hover:text-nav-hover active:text-nav-hover '
        if (siteDef.currentAs && siteDef.currentAs === el.href) {
          extraClasses += ' text-nav-current'
        }
      } 
      else {
        extraClasses+= ' min-w-0'   
      }
      if (siteDef.currentAs && siteDef.currentAs === el.href) {
        extraClasses += ' pointer-events-none'
      }
      return (
        <LinkElement 
          def={el}
          key={index}
          size='lg'
          className={cn(navElementClasses, extraClasses)}
          onClick = {onAction}  
        />
      )
    })}
    {featuredCTA && (
      <LinkElement 
        def={featuredCTA}
        key='featuredCTA'
        size='lg'
        className='mt-6 w-4/5 mx-auto'
        onClick = {onAction}  
      />
    )}
    </nav>
  ) 
  : null
}

export default MobileNav
