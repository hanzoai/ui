import React from 'react'

import type { SiteDef } from '../../types'
import Logo from '../logo'
import { type ButtonVariants } from '../../primitives'
import { NavItems, Icons, DrawerMenu } from '../../common'
import MobileNav from './mobile-nav'

import { cn } from '../../util'

const Header: React.FC<{
  siteDef: SiteDef
  className?: string
}> = ({
  siteDef,
  className = ''
}) => {

  const { nav: {elements, featuredCTA}} = siteDef
  const allElements = (featuredCTA) ? [...elements, featuredCTA] : elements

  return (
    <header className={cn('bg-background sticky z-10 top-0 ', className)} >
      {/* md or larger */}
      <div className="hidden md:flex flex-row md:h-[80px] items-center justify-between px-[32px] 2xl:mx-auto max-w-screen-2xl">
        <Logo size='md' className='hidden lg:flex' key='two'/>
        <Logo size='sm' className='hidden md:flex lg:hidden' key='one'/>
        {/* lg or larger */}
        <NavItems 
          currentAs={siteDef.currentAs}
          items={allElements} 
          className='hidden lg:flex justify-between gap-[24px] text-[13px]/[13px] min-w-[690px]' 
          itemClassName='font-heading h-[32px] tracking-[-0.3px]' 
          itemClassNameFromVariant={(variant: ButtonVariants) => (variant === 'primary' ? 'min-w-[174px]' : '')}
          key='three'
        />
        {/* md exactly */}
        <NavItems 
          currentAs={siteDef.currentAs}
          items={allElements} 
          className='hidden md:flex lg:hidden gap-4 text-[13px]/[13px] ' 
          itemClassName='font-heading h-[32px] tracking-[-0.3px]'  
          itemClassNameFromVariant={(variant: ButtonVariants) => (variant === 'primary' ? 'min-w-0 text-[13px]/[13px]' : '')}
          key='four'
        />
      </div>
      {/* smaller than md: mobile style drawer menu */}
      <div className="flex md:hidden h-[44px] items-center justify-between px-2">
        <Logo size='sm' />
        <DrawerMenu 
          className='p-0 text-primary' // ui has 'text-inherit', so need this for close buttons to appear.
          trigger={<Icons.burger className='h-7 w-7 text-inherit'/>}
        >
          <MobileNav 
            siteDef={siteDef}
            className='pt-12' 
            navElementClasses='px-10 text-l h-10 justify-start border-b rounded-none' 
          />
        </DrawerMenu>
      </div>
    </header>
  )
}

export default Header
