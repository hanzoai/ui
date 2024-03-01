import type AuthService from './auth-service'
import type { AuthServiceConf, HanzoUserInfo, HanzoUserInfoValue } from '../types'
import AuthServiceImpl from './impl'

  // https://dev.to/ivandotv/mobx-server-side-rendering-with-next-js-4m18
let instance: AuthServiceImpl | undefined =  undefined

const getSingleton = (conf: AuthServiceConf, serverSideUser: HanzoUserInfoValue | null): AuthService => {

  const _instance = instance ?? 
    new AuthServiceImpl(conf, serverSideUser)

    // For server side rendering always create a new store
  if (typeof window === "undefined") {
    return _instance
  }

    // Create the store once in the client
  if (!instance) {
    instance = _instance
  }  
  instance.setServerSideUser(serverSideUser) 

  return instance
}

export default getSingleton
