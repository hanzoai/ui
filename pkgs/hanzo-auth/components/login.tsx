'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { ArrowLeft } from 'lucide-react'

import { ApplyTypography, Button } from '@hanzo/ui/primitives'
import type { LinkDef } from '@hanzo/ui/types'
import { cn } from '@hanzo/ui/util'

import { useCurrentUser } from '../service/AuthContext'
import { signInWithProvider, signOut } from '../lib/firebase/auth'
import { Facebook, Google, GitHub } from '../icons'

const Login: React.FC<{
  redirectUrl?: string,
  getStartedUrl?: string,
  returnToUrl?: string,
  className?: string
}> = ({
  redirectUrl,
  getStartedUrl,
  returnToUrl,
  className
}) => {
  const router = useRouter()
  const {user, setUser} = useCurrentUser()
  const [isLoading, setIsLoading] = useState(false)

  const elements: LinkDef[] = [{title: 'Sign Out', variant: 'outline', href: '/'}];
  if (getStartedUrl) {
    elements.push({title: 'GET STARTED', variant: 'primary', href: getStartedUrl});
  }

  const login = async (provider: string) => {
    setIsLoading(true)
    const res = await signInWithProvider(provider)
    if (res.success && res.email) {
      setUser({email: res.email})
      if (redirectUrl) {
        router.push(redirectUrl)
      }
    }
    setIsLoading(false)
  }

  const logout = async () => {
    setIsLoading(true)
    const res = await signOut()
    if (res.success) {
      setUser(null)
      if (redirectUrl) {
        router.push(redirectUrl)
      }
    }
    setIsLoading(false)
  }

  return (
    <ApplyTypography className={cn('w-full', className)}>
      <div className='w-full max-w-[20rem] mx-auto'>
      {user ? (
        <div className='flex flex-col text-center gap-4'>
          <h3>Welcome!</h3>
          <p>You are signed in as {user.email}</p>
          <div className='flex gap-4 items-center justify-center'>
            <Button onClick={() => logout()} variant='outline' disabled={isLoading}>Sign Out</Button>
            {getStartedUrl && <Button variant='primary' onClick={() => router.push(getStartedUrl)}>GET STARTED</Button>}
          </div>
        </div>
      ) : (
        <div className='flex flex-col gap-4 text-center'>
          <div className='mb-4 items-center flex'>
            {returnToUrl && (
              <Button size='icon' variant='ghost' className='absolute' onClick={() => router.push(returnToUrl)}>
                <ArrowLeft/>
              </Button>
            )}
            <h2 className='mx-auto'>Login</h2>
          </div>
          <Button onClick={() => login('google')} className='w-full mx-auto flex items-center gap-2' disabled={isLoading}>
            <Google height={20}/>Sign in with Google
          </Button>
          <Button onClick={() => login('facebook')} className='w-full mx-auto flex items-center gap-2' disabled={isLoading}>
            <Facebook height={20}/>Sign in with Facebook
          </Button>
          <Button onClick={() => login('github')} className='w-full mx-auto flex items-center gap-2' disabled={isLoading}>
            <GitHub height={20}/>Sign in with Github
          </Button>
        </div>
      )}
      </div>
    </ApplyTypography>
  )
}

export default Login