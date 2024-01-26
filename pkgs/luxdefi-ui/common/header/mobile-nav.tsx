'use client'
import React from 'react'

import { type ButtonVariants, LinkElement }  from '../../primitives'
import type { SiteDef } from '../../types'

const MobileNav: React.FC<{
  siteDef: SiteDef
  itemVariant?: ButtonVariants
  className?: string
  itemClassName?: string
  onAction?: () => void // eg, for close functionality
}> = ({
  siteDef,
  onAction,
  className='',
  itemClassName='',
  itemVariant
}) => (
  siteDef.mainNav.full.length ? (
    <nav className={className} >
    {siteDef.mainNav.full.map((el, index) => (
      <LinkElement 
        def={el}
        key={index}
        size='lg'
        className={itemClassName}
        variant={itemVariant}
        onClick = {onAction}  // in adition to the link action itself
      />
    ))}
    </nav>
  ) 
  : null
)

export default MobileNav
