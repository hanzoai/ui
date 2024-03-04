'use client'

import React, {
  useContext,
  type PropsWithChildren
} from 'react'

import type { AuthServiceConf, HanzoUserInfoValue} from '../types'
import type AuthService from './auth-service'
import getSingleton from './get-singleton' 

const AuthServiceContext = React.createContext<AuthService | undefined>(undefined)

const _log = (s: string) => {
  const d = new Date()
  console.log(`TIMESTAMPED: ${d.getUTCMinutes()}:${d.getUTCSeconds()}:${d.getUTCMilliseconds()}`)
  console.log(s)
}


const useAuth = (): AuthService => {
  
  const service = useContext(AuthServiceContext) as AuthService
  //_log('USE_AUTH: ' + !!service ? 'CONTEXT OK' : 'CONTEXT UNDEFINED')
  return service
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
  //_log('AUTH_PROVIDER')

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

