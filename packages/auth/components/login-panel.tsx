'use client'
import { useState, type PropsWithChildren } from 'react'
import { useRouter } from 'next/navigation'
import { observer } from 'mobx-react-lite'
import Link from 'next/link'

import { ApplyTypography, Button, Separator, toast } from '@hanzo/ui/primitives'
import { cn } from '@hanzo/ui/util'

import { useAuth } from '../service'
import { Facebook, Google, GitHub } from '../icons'
import EmailPasswordForm from './email-password-form'
import { sendGAEvent } from '../util/analytics'

const ProviderLoginButton: React.FC<PropsWithChildren & {
  provider: 'google' | 'facebook' | 'github',
  loginWithProvider: (provider: 'google' | 'facebook' | 'github') => Promise<void>,
  isLoading: boolean
}> = ({
  provider,
  loginWithProvider,
  isLoading,
  children
}) => {
  
  return (
    <Button
      onClick={() => loginWithProvider(provider)}
      className='w-full mx-auto flex items-center gap-2'
      disabled={isLoading}
      variant='outline'
    >
      {children}
    </Button>
  )
}

const LoginPanel: React.FC<PropsWithChildren & {
  redirectUrl?: string,
  getStartedUrl?: string,
  className?: string,
  inputClx?: string,
  noHeading?: boolean
  onLoginChanged?: (loggedIn: boolean) => void
  termsOfServiceUrl?: string
  privacyPolicyUrl?: string
}> = observer(({
  children,
  redirectUrl,
  getStartedUrl,
  className,
  inputClx,
  noHeading,
  onLoginChanged,
  termsOfServiceUrl,
  privacyPolicyUrl
}) => {
  const router = useRouter()
  
  const auth = useAuth()

  const [isLoading, setIsLoading] = useState(false)

  const succeed = (loggedOut = false) => {
      // If a callback is provide, don't redirect.
      // Assume host code is handling (eg, mobile menu)
    if (onLoginChanged) {
      onLoginChanged(!loggedOut)
    }
    else if (redirectUrl) {
      router.push(redirectUrl)
    }
  }

  const loginWithEmailPassword = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const res = await auth.loginEmailAndPassword(email, password)
      if (res.success) {
        sendGAEvent('login', {
          method: 'email'
        })
        succeed()
      }
    } 
    catch (e) {
      toast('User with this email already signed up using a different provider')
    }
    setIsLoading(false)
  }

  // const loginWithEthereum = async () => {
  //   setIsLoading(true)
  //   try {
  //     const res = await signInWithEthereum()
  //     if (res.success && res.user) {
  //       setUser({email: res.user?.email, displayName: res.user?.displayName, walletAddress: res.user?.walletAddress})
  //       if (redirectUrl) {
  //         router.push(redirectUrl)
  //       }
  //     }
  //   } catch (e) {
  //     toast({title: 'No Ethereum provider found'})
  //   }
  //   setIsLoading(false)
  // }

  const loginWithProvider = async (provider: 'google' | 'facebook' | 'github') => {
    setIsLoading(true)
    const res = await auth.loginWithProvider(provider)
    if (res.success ) {
      sendGAEvent('login', {
        method: provider
      })
      succeed()
    }
    setIsLoading(false)
  }

  const logout = async () => {
    setIsLoading(true)
    const res = await auth.logout()
    if (res.success) {
      succeed(false)
    }
    setIsLoading(false)
  }

  return (
    <ApplyTypography className={cn('w-full flex flex-col text-center !gap-3 LOGIN_OUTER', className)}>
      {auth.loggedIn && !redirectUrl ? (
        <>
          <h4>Welcome!</h4>
          {auth.user && (<> {/*  this means the hanzo user isn't loaded yet ...*/}
            <p>You are signed in as {auth.user?.displayName ?? auth.user?.email}</p>
            <div className='flex flex-col md:flex-row gap-3 items-center justify-center'>
              {getStartedUrl && <Button variant='primary' onClick={() => router.push(getStartedUrl)} className='w-full'>GET STARTED</Button>}
              <Button onClick={() => logout()} variant='outline' disabled={isLoading} className='w-full'>Sign Out</Button>
            </div>
          </>)}
        </>
      ) : (
        <>
          {!noHeading && (
            <h4 className='text-center'>Login</h4>
          )}
          {children}
          <EmailPasswordForm onSubmit={loginWithEmailPassword} isLoading={isLoading} className='mb-4' inputClx={inputClx}/>

          <div className='flex gap-2 whitespace-nowrap items-center my-1 sm:my-3 text-xs text-muted'>
            <Separator className='grow w-auto'/><div className='shrink-0 mx-1'>or continue with</div><Separator className='grow w-auto'/>
          </div>

          {/* <Button onClick={loginWithEthereum} className='w-full mx-auto flex items-center gap-2' disabled={isLoading}>
            <Ethereum height={20}/>Login with your wallet
          </Button> */}
          <ProviderLoginButton provider='google' isLoading={isLoading} loginWithProvider={loginWithProvider}>
            <Google height={20}/>Google
          </ProviderLoginButton>
          <ProviderLoginButton provider='facebook' isLoading={isLoading} loginWithProvider={loginWithProvider}>
            <Facebook height={20}/>Facebook
          </ProviderLoginButton>
          <ProviderLoginButton provider='github' isLoading={isLoading} loginWithProvider={loginWithProvider}>
            <GitHub height={20}/>Github
          </ProviderLoginButton>
          <p className='text-sm text-muted-2'>By logging in, you agree to our <Link href={termsOfServiceUrl ?? ''}>Terms of Service</Link> and <Link href={privacyPolicyUrl ?? ''}>Privacy Policy</Link>.</p>
        </>
      )}
    </ApplyTypography>
  )
})

export default LoginPanel
