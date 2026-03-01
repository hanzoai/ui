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
    /** Does not show the 'login' button when no auth user. 
     * ie, Only shows the profile widget (when there's an auth user)
     */
  noLogin?: boolean
  className?: string
    /** Overrides default of navigating to '/login' route. 
     * eg, if client code provides it's own ogin form
     *  */
  handleLogin?: () => void
}> = observer(({
  noLogin=false,
  handleLogin,
  className
}) => {

  const auth = useAuth()

    // This safegaurds against a crash in the rare case
    // that multiple inistances of auth module are in play.
    // We safegaurd agains this in the by loading peer Deps from
    // the root in host mono repos, but this is another layer.
    // Also, this allows sites to opt-in to showing an auth widget without
    // configuration, by just providing the context.
  if (!auth || noLogin) {
    return null
  }
  
    // If that is the case, the widget will always show the 'login' 
    // button regardless of status.
  if (!auth.loggedIn && typeof window !== 'undefined') {

    return (handleLogin ? (
      <Button 
        variant='primary' 
        className='h-8 w-fit !min-w-0'
        onClick={handleLogin} 
      >
        Login
      </Button>
    ) : (
      <LinkElement
        def={{
          href: `${process.env.NEXT_PUBLIC_LOGIN_SITE_URL}?redirectUrl=${window.location.href}`,
          title: 'Login',
          variant: 'primary',
          newTab: false
        } satisfies LinkDef}
        className='h-8 w-fit !min-w-0'
      />
    ))
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size='icon' 
          className={cn('rounded-full text-muted border-2 border-muted bg-level-1 hover:bg-level-2 hover:border-foreground hover:text-foreground uppercase w-8 h-8', className)}
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
