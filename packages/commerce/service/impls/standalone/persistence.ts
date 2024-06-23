import { reaction } from 'mobx'
import { StandaloneService, type StandaloneServiceSnapshot } from './index'

const LS_KEY = 'lux-cart'

const readSnapshot = (key: string): StandaloneServiceSnapshot | undefined  => {
  const snapshotAsStr = localStorage.getItem(key)
  return snapshotAsStr ? JSON.parse(snapshotAsStr) as StandaloneServiceSnapshot : undefined
}

const writeSnapshotsOnChange = (cmmc: StandaloneService, key: string): void => {

  if (typeof window !== 'undefined') {
    reaction(
      () => (cmmc.cartTotal),
      (total) => {
        if (total > 0) {
          const snapshot = cmmc.takeSnapshot()
          localStorage.setItem(key, JSON.stringify(snapshot) )
        }
        else {
          localStorage.removeItem(key)  
        }
      }
    )
  }
}

export {
  readSnapshot,
  writeSnapshotsOnChange  
}

