import { enableStaticRendering } from 'mobx-react-lite'

import type AuthService from './auth-service'
import type { AuthServiceConf, HanzoUserInfoValue } from '../types'
import { getActiveProvider } from './provider-registry'
import { StubAuthService } from './impl/stub-auth-service'

enableStaticRendering(typeof window === "undefined")

// https://dev.to/ivandotv/mobx-server-side-rendering-with-next-js-4m18
let instance: AuthService | undefined = undefined

const getSingleton = (
  conf: AuthServiceConf,
  serverSideUser: HanzoUserInfoValue | null
): AuthService => {

  // Get the registered auth provider, or use stub if none configured
  const AuthServiceClass = getActiveProvider() ?? StubAuthService

  // For server side rendering always create a new store
  if (typeof window === "undefined") {
    return new AuthServiceClass(conf, serverSideUser)
  }

  // Client side, create the store only once in the client
  if (!instance) {
    instance = new AuthServiceClass(conf, serverSideUser)
  }
  else if ('setServerSideUser' in instance && typeof instance.setServerSideUser === 'function') {
    instance.setServerSideUser(serverSideUser)
  }

  return instance
}

export default getSingleton
