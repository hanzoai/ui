'use client'
import React from 'react'

import { observer } from 'mobx-react-lite'

import { 
  Button, 
  LinkElement, 
  Popover, 
  PopoverContent, 
  PopoverTrigger, 
  Separator 
} from '@hanzo/ui/primitives'

import type { LinkDef } from '@hanzo/ui/types'
import { cn } from '@hanzo/ui/util'

import { useAuth } from '../service'

import Ethereum from '../icons/ethereum'

const AuthWidget: React.FC<{
  className?: string
}> = observer(({
  className
}) => {

  const auth = useAuth()
  
  if (!auth.loggedIn()) {
    return (
      <LinkElement
        def={{href: '/login', title: 'Login', variant: 'primary'} as LinkDef}
        className='font-heading h-8 tracking-[-0.3px] !text-[13px]/[13px] w-fit !min-w-0'
      />
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size='icon' 
          className={cn('rounded-full text-foreground uppercase w-9 h-9', className)}
        >{auth.user?.email[0]}</Button>
      </PopoverTrigger>
      <PopoverContent className='bg-level-0'>
        <div className="grid gap-4">
          <div className="space-y-2 truncate">
            {auth.user?.displayName ? (
              <>
                <h4 className="font-medium leading-none truncate">{auth.user.displayName}</h4>
                <p className="text-sm opacity-50 truncate">{auth.user.email}</p>
              </>
            ) : (
              <h4 className="font-medium leading-none truncate">{auth.user?.email}</h4>
            )}
            {auth.user?.walletAddress ? (
              <p className="text-sm opacity-50 truncate">{auth.user.walletAddress}</p>
            ) : (
              <Button variant="outline" className='w-full flex items-center gap-2' onClick={auth.associateWallet.bind(auth)}>
                <Ethereum height={20}/>Connect your wallet
              </Button>
            )}
          </div>
          <Separator />
          <Button variant="outline" onClick={auth.logout.bind(auth)}>Logout</Button>
        </div>
      </PopoverContent>
    </Popover>
  )
})

export default AuthWidget