import { reaction } from 'mobx'
import StandaloneService, { type StandaloneServiceSnapshot } from './standalone-service'

const LS_KEY = 'lux-cart'

const readSnapshot = (): StandaloneServiceSnapshot | undefined  => {
  const snapshotAsStr = localStorage.getItem(LS_KEY)
  return snapshotAsStr ? JSON.parse(snapshotAsStr) as StandaloneServiceSnapshot : undefined
}

const listenAndWriteSnapshots = (cmmc: StandaloneService): void => {

  if (typeof window !== 'undefined') {
    reaction(
      () => (cmmc.cartTotal),
      (total) => {
        if (total > 0) {
          const snapshot = cmmc.takeSnapshot()
//          console.log(`CMMC LOCAL STORAGE UPDATE. (CART TOTAL: ${total}`)
          localStorage.setItem(LS_KEY, JSON.stringify(snapshot) )
        }
        else {
          localStorage.removeItem(LS_KEY)  
        }
      }
    )
  }
}

export {
  readSnapshot,
  listenAndWriteSnapshots  
}

