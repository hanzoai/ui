import { enableStaticRendering } from 'mobx-react-lite'

import type { CommerceService, Family, CategoryNode, SelectionUISpecifier, CommerceConfig } from '../../../types'
import StandaloneService, {type StandaloneServiceOptions} from './standalone-service'
import { initSelectionUI } from '../../../util'

import { readSnapshot, listenAndWriteSnapshots } from './localStorage'

enableStaticRendering(typeof window === "undefined")

const _log = (s: string) => {
  const d = new Date()
  console.log(`TIMESTAMPED: ${d.getUTCMinutes()}:${d.getUTCSeconds()}:${d.getUTCMilliseconds()}`)
  console.log(s)
}

// https://dev.to/ivandotv/mobx-server-side-rendering-with-next-js-4m18

let instance: StandaloneService | undefined =  undefined

export const getInstance = ({
  families, 
  rootNode, 
  options, 
  uiSpecifiers 
}: CommerceConfig) : CommerceService => {

  if (!options) {
    throw new Error('cmmc getInstance(): Standalone Commerce Service requires config options!')
  }

   if (typeof window === "undefined") {
    if (uiSpecifiers) {
      initSelectionUI(uiSpecifiers)
    }
    //_log("NEW INSTANCE FOR SERVER")
    return new StandaloneService(
      families, 
      rootNode, 
      options
    )
  }

    // Client side, create the store only once in the client
  if (!instance) {
    if (uiSpecifiers) {
      initSelectionUI(uiSpecifiers)
    }
    //_log("NEW INSTANCE FOR CLIENT")
    const snapShot = readSnapshot()
    instance = new StandaloneService(
      families, 
      rootNode, 
      options,
      snapShot
    )
    listenAndWriteSnapshots(instance)
  }  

  return instance
}

