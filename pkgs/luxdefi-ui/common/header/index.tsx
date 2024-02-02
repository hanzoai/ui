import React from 'react'

import type { SiteDef } from '../../types'
import Logo from '../logo'
import { type ButtonVariants, LinkElement, DrawerMenu } from '../../primitives'
import { NavItems, Icons } from '../../common'
import MobileNav from './mobile-nav'

import { cn } from '../../util'

const Header: React.FC<{
  siteDef: SiteDef
  className?: string
}> = ({
  siteDef,
  className = ''
}) => (
  <header className={cn('bg-background sticky z-10 top-0 ', className)} >
    <div className="hidden md:flex flex-row md:h-[80px] items-center justify-between px-[32px] 2xl:mx-auto max-w-screen-2xl">
      <Logo size='md' className='hidden lg:flex' key='two'/>
      <Logo size='sm' className='hidden md:flex lg:hidden' key='one'/>
      <NavItems 
        currentAs={siteDef.currentAs}
        items={siteDef.mainNav.full} 
        className='hidden lg:flex justify-between gap-[24px] text-[13px]/[13px] min-w-[690px]' 
        itemClassName='font-heading h-[32px] tracking-[-0.3px]' 
        itemClassNameFromVariant={(variant: ButtonVariants) => (variant === 'primary' ? 'min-w-[174px]' : '')}
        key='three'
      />
      <NavItems 
        currentAs={siteDef.currentAs}
        items={siteDef.mainNav.short ?? siteDef.mainNav.full} 
        className='hidden md:flex lg:hidden gap-4' 
        itemClassName='text-sm font-heading'  
        itemClassNameFromVariant={(variant: ButtonVariants) => (variant === 'link' ? 'text-muted-1' : '')}
        key='four'
      />
      { siteDef.mainNav.aux && /* TODO unhack */ (
        <LinkElement def={siteDef.mainNav.aux[0]} size='sm' className='min-w-0 hidden md:flex lg:hidden' />
      )}
    </div>
    <div className="flex md:hidden h-[44px] items-center justify-between px-2">
      <Logo size='sm' />
      <DrawerMenu 
        className='p-0 text-primary' // ui has 'text-inherit', so need this for close buttons to appear.
        triggerIcon={<Icons.burger className='h-7 w-7 text-primary'/>} 
      >
        <MobileNav 
          siteDef={siteDef}
          itemVariant='link' 
          className='pt-12' 
          itemClassName='px-8 text-xl h-14 justify-start border-b' 
        />
      </DrawerMenu>
    </div>
  </header>
)


export default Header
