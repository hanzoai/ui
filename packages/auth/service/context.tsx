'use client'

import React, {
  useContext,
  type PropsWithChildren
} from 'react'

import type { AuthServiceConf, HanzoUserInfoValue} from '../types'
import type AuthService from './auth-service'
import getSingleton from './get-singleton' 

const AuthServiceContext = React.createContext<AuthService | undefined>(undefined)

const useAuth = (): AuthService => (
  useContext(AuthServiceContext) as AuthService
)

const AuthServiceProvider: React.FC<
  PropsWithChildren & {
    conf: AuthServiceConf
    user: HanzoUserInfoValue | null
  }
> = ({
  children,
  user,
  conf
}) => (
  <AuthServiceContext.Provider value={getSingleton(conf, user)}>
    {children}
  </AuthServiceContext.Provider>
)


export {
  AuthServiceProvider,
  useAuth
}

