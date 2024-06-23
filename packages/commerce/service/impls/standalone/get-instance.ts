import { enableStaticRendering } from 'mobx-react-lite'

import type { CommerceService, CommerceConfig } from '../../../types'
import { StandaloneService }  from './index'
import { initSelectionUI } from '../../../util'

import { readSnapshot, writeSnapshotsOnChange } from './persistence'

enableStaticRendering(typeof window === "undefined")

const _LOG = false
const _log = (s: string) => {
  if (!_LOG) return;
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
    _log("NEW INSTANCE: SERVER") //////////
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
    _log("NEW INSTANCE: CLIENT") ///////////
    const snapShot = readSnapshot(options.localStorageKey)
    instance = new StandaloneService(
      families, 
      rootNode, 
      options,
      snapShot
    )
    writeSnapshotsOnChange(instance, options.localStorageKey)
  }  

  return instance
}

