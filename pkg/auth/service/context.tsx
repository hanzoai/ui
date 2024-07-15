'use client'

import React, {
  useContext,
  type PropsWithChildren
} from 'react'

import type { AuthServiceConf, HanzoUserInfoValue} from '../types'
import type AuthService from './auth-service'
import getSingleton from './get-singleton' 

const AuthServiceContext = React.createContext<AuthService | undefined>(undefined)

/* PLEASE LEAVE
const _log = (s: string) => {
  const d = new Date()
  console.log(`TIMESTAMPED: ${d.getUTCMinutes()}:${d.getUTCSeconds()}:${d.getUTCMilliseconds()}`)
  console.log(s)
}
*/

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

