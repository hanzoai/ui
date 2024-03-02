import type AuthService from './auth-service'
import type { AuthServiceConf, HanzoUserInfoValue } from '../types'
import AuthServiceImpl from './impl'

  // https://dev.to/ivandotv/mobx-server-side-rendering-with-next-js-4m18
let instance: AuthServiceImpl | undefined =  undefined

const getSingleton = (
  conf: AuthServiceConf, 
  serverSideUser: HanzoUserInfoValue | null
): AuthService => {

    // For server side rendering always create a new store
  if (typeof window === "undefined") {
    return new AuthServiceImpl(conf, serverSideUser)
  }

    // Client side, create the store only once in the client
  if (!instance) {
    instance = new AuthServiceImpl(conf, serverSideUser)
  }  
  else {
    instance.setServerSideUser(serverSideUser) 
  }

  return instance
}

export default getSingleton
