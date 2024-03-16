'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { observer } from 'mobx-react-lite'

import { ArrowLeft } from 'lucide-react'

import { ApplyTypography, Button, useToast } from '@hanzo/ui/primitives'
import { cn } from '@hanzo/ui/util'

import { useAuth } from '../service'
import { Facebook, Google, GitHub } from '../icons'
import EmailPasswordForm from './email-password-form'

const Login: React.FC<{
  redirectUrl?: string,
  getStartedUrl?: string,
  returnToUrl?: string,
  className?: string,
  hideHeader?: boolean
}> = observer(({
  redirectUrl,
  getStartedUrl,
  returnToUrl,
  className,
  hideHeader
}) => {
  const router = useRouter()
  
  const auth = useAuth()

  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const loginWithEmailPassword = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const res = await auth.loginEmailAndPassword(email, password)
      if (res.success ) {
        if (redirectUrl) {
          router.push(redirectUrl)
        }
      }
    } 
    catch (e) {
      toast({title: "User with this email already signed up using a different provider"})
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
  //     toast({title: "No Ethereum provider found"})
  //   }
  //   setIsLoading(false)
  // }

  const loginWithProvider = async (provider: 'google' | 'facebook' | 'github') => {
    setIsLoading(true)
    const res = await auth.loginWithProvider(provider)
    if (res.success && redirectUrl) {
      router.push(redirectUrl)
    }
    setIsLoading(false)
  }

  const logout = async () => {
    setIsLoading(true)
    const res = await auth.logout()
    if (res.success && redirectUrl) {
      router.push(redirectUrl)
    }
    setIsLoading(false)
  }

  return (
    <ApplyTypography className={cn('w-full', className)}>
      <div className='w-full mx-auto'>
      {auth.loggedIn && !redirectUrl ? (
        <div className='flex flex-col text-center gap-4'>
          <h3>Welcome!</h3>
          {auth.user && (<> {/*  this means the hanzo user isn't loaded yet ...*/}
            <p>You are signed in as {auth.user?.displayName ?? auth.user?.email}</p>
            <div className='flex flex-col gap-4 items-center justify-center'>
              {getStartedUrl && <Button variant='primary' onClick={() => router.push(getStartedUrl)}>GET STARTED</Button>}
              <Button onClick={() => logout()} variant='outline' disabled={isLoading}>Sign Out</Button>
            </div>
          </>)}
        </div>
      ) : (
        <div className='flex flex-col gap-4 text-center'>
          {!hideHeader && (
            <div className='mb-4 items-center flex'>
              {returnToUrl && (
                <Button size='icon' variant='ghost' className='absolute' onClick={() => router.push(returnToUrl)}>
                  <ArrowLeft/>
                </Button>
              )}
              <h2 className='mx-auto'>Login</h2>
            </div>
          )}
          {redirectUrl === 'checkout' && <p>You will be redirected to checkout after login.</p>}
          <EmailPasswordForm onSubmit={loginWithEmailPassword} isLoading={isLoading} className='mb-4'/>
          <p>- <span className='font-normal font-nav'>or</span> -</p>
          {/* <Button onClick={loginWithEthereum} className='w-full mx-auto flex items-center gap-2' disabled={isLoading}>
            <Ethereum height={20}/>Login with your wallet
          </Button> */}
          <Button onClick={() => loginWithProvider('google')} className='w-full mx-auto flex items-center gap-2' disabled={isLoading}>
            <Google height={20}/>Login with Google
          </Button>
          <Button onClick={() => loginWithProvider('facebook')} className='w-full mx-auto flex items-center gap-2' disabled={isLoading}>
            <Facebook height={20}/>Login with Facebook
          </Button>
          <Button onClick={() => loginWithProvider('github')} className='w-full mx-auto flex items-center gap-2' disabled={isLoading}>
            <GitHub height={20}/>Login with Github
          </Button>
        </div>
      )}
      </div>
    </ApplyTypography>
  )
})

export default Login