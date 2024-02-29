'use client'

import React, {
  useContext,
  type PropsWithChildren
} from 'react'

import type { AuthServiceConf, HanzoUserInfo, HanzoUserInfoValue} from '../types'
import type AuthService from './auth-service'
import getSingleton from './get-singleton' 

const AuthServiceContext = React.createContext<AuthService | undefined>(undefined)

const useAuth = (): AuthService => {
  const context = useContext(AuthServiceContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthServiceProvider')
  }
  return context
}

const AuthServiceProvider: React.FC<
  PropsWithChildren & {
    conf: AuthServiceConf
    user: HanzoUserInfoValue | null
  }
> = ({
  children,
  user,
  conf
}) => {
  return (
    <AuthServiceContext.Provider value={getSingleton(conf, user)}>
      {children}
    </AuthServiceContext.Provider>
  )
}

export {
  AuthServiceProvider,
  useAuth
}

