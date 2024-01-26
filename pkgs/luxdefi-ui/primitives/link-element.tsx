import React from 'react'
import Link from 'next/link'

import type { LinkDef, Icon }  from '../types'
import { buttonVariants, type ButtonSizes, type ButtonVariants } from './button'
import { cn } from '../util'

const LinkElement: React.FC<{
  def: LinkDef,
  variant? : ButtonVariants // overrides def
  size?: ButtonSizes    // overrides def
  onClick?: () => void  // for UI changes in addition to link (eg, close menu)
  className?: string,
  icon?: Icon           // overrides def (eg, for title area)
  iconAfter?: boolean   // overrides def
}> = ({ 
  def,
  className = '',
    // DO NOT provide a default to any of the props that also appear in def!
  size, 
  onClick,
  variant,
  icon,     
  iconAfter 
} ) => {

  const {
    href,
    external,
    newTab,
    variant: defVariant,
    size: defSize, 
    title
  } = def

  const toSpread = {
    ...((href) ? { href } : { href: '#'}),
    ...((external) ?  { 
      rel: 'noreferrer',
        // As per comments in LinkDef
      target: (newTab !== undefined && (newTab === false)) ? '_self' : '_blank'
    } : {
      target: (newTab !== undefined && (newTab === true)) ? '_blank' : '_self' 
    }),
    ...(onClick ? { onClick } : {})
  }

  const iicon = (icon) ? icon : (def.icon) ? def.icon : undefined
  const iiconAfter = (iconAfter) ? iconAfter : (def.iconAfter) ? def.iconAfter : false

  return (
    <Link
      className={
          cn(buttonVariants({ 
            variant: variant ?  variant : (defVariant ? defVariant : 'link'), 
            size: (!defVariant || defVariant.includes('link') || variant?.includes('link'))  ? 'link' 
              : (size ? size : defSize)
          }
          ), 
          ((href || onClick) ? '' : 'pointer-events-none'), 
          className 
        )}
      {...toSpread}
    >
      {iicon && !iiconAfter && (<div className='pr-1'>{iicon as React.ReactNode}</div>)}
      <div>{title}</div>
      {iicon && iiconAfter && (<div className='pl-1'>{iicon as React.ReactNode}</div>)}
    </Link>
  )
}

export default LinkElement
