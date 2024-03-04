import type AuthService from './auth-service'
import type { AuthServiceConf, HanzoUserInfoValue } from '../types'
import AuthServiceImpl from './impl'

  // https://dev.to/ivandotv/mobx-server-side-rendering-with-next-js-4m18
let instance: AuthServiceImpl | undefined =  undefined

const _log = (s: string) => {
  const d = new Date()
  console.log(`TIMESTAMPED: ${d.getUTCMinutes()}:${d.getUTCSeconds()}:${d.getUTCMilliseconds()}`)
  console.log(s)
}


const getSingleton = (
  conf: AuthServiceConf, 
  serverSideUser: HanzoUserInfoValue | null
): AuthService => {

    // For server side rendering always create a new store
  if (typeof window === "undefined") {
    //_log("NEW INSTANCE FOR SERVER")
    return new AuthServiceImpl(conf, serverSideUser)
  }

    // Client side, create the store only once in the client
  if (!instance) {
    //_log("NEW INSTANCE FOR CLIENT")
    instance = new AuthServiceImpl(conf, serverSideUser)
  }  
  else {
    //_log("INSTANCE EXISTS ON CLIENT")
    instance.setServerSideUser(serverSideUser) 
  }

  return instance
}

export default getSingleton
