import React from 'react'

import type { LinkDef }  from '../types'
import  LinkElement from './link-element'
import { cn } from '../util'

const NavItems: React.FC<{
  items: LinkDef[]
  className?: string,
  as?: React.ElementType
  itemClx?: string | ((def: LinkDef) => string),
  currentAs?: string
}> = ({ 
  items,
  className='', 
  itemClx,
  as: Tag='nav',  
  currentAs 
}) => ( items.length ? (
  <Tag className={className} >
  {items.map((item, index) => {

    const variant = item.variant ?? 'link'
    let internalClx = '' 

      // note that linkFG (or any other variant of 'link') 
      // will not get assigned these classes,
      // and will remain styles is 'foreground' (hence the name)
    if (variant === 'link') {
      internalClx += 'text-nav hover:text-nav-hover '
      if (currentAs && currentAs === item.href) {
        internalClx += 'text-nav-current '
      }
    } 
    else {
      internalClx += 'min-w-0 lg:min-w-0 '   
    }

    const _itemClx = (itemClx) ? (typeof itemClx === 'string' ? itemClx : itemClx(item)) : '' 
    return (<LinkElement def={item} key={index} className={cn( internalClx, _itemClx)} />)
  })}
  </Tag>) : null
)

export default NavItems
