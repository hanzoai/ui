
import { makeObservable, observable, action  } from 'mobx'
import type { StringMutator } from '../types'

class ObsStringMutator implements StringMutator {

  s: string | null
  constructor(_s: string) {
    this.s = _s
    makeObservable(this, {
      s: observable,
      set: action,
      //get: computed 
    })
  }

  set(v: string | null): void { this.s = v }
  get(): string | null { return this.s }
}

export default ObsStringMutator

