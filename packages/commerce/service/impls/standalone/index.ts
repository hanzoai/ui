import { enableStaticRendering } from 'mobx-react-lite'

import type { CommerceService, Category, FacetValueDesc } from '../../../types'
import StandaloneService, {type StandaloneServiceOptions} from './standalone-service'

import { readSnapshot, listenAndWriteSnapshots } from './localStorage'

enableStaticRendering(typeof window === "undefined")

const _log = (s: string) => {
  const d = new Date()
  console.log(`TIMESTAMPED: ${d.getUTCMinutes()}:${d.getUTCSeconds()}:${d.getUTCMilliseconds()}`)
  console.log(s)
}

// https://dev.to/ivandotv/mobx-server-side-rendering-with-next-js-4m18

let instance: StandaloneService | undefined =  undefined

export const getInstance = (
  categories: Category[], 
  rootFacet: FacetValueDesc, 
  options?: StandaloneServiceOptions
): CommerceService => {

  if (!options) {
    throw new Error('cmmc getInstance(): Standalone Commerce Service requires config options!')
  }

   if (typeof window === "undefined") {
    //_log("NEW INSTANCE FOR SERVER")
    return new StandaloneService(
      categories, 
      rootFacet, 
      options
    )
  }

    // Client side, create the store only once in the client
  if (!instance) {
    //_log("NEW INSTANCE FOR CLIENT")
    const snapShot = readSnapshot()
    instance = new StandaloneService(
      categories, 
      rootFacet, 
      options,
      snapShot
    )
    listenAndWriteSnapshots(instance)
  }  

  return instance
}

