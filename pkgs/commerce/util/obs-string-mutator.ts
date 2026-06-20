import {makeObservable, observable, action} from 'mobx'

import type { StringMutator } from '../types'

class ObsStringMutator implements StringMutator {

  _s: string | null

  constructor(s: string) {
    this._s = s
    makeObservable(this, {
      _s: observable,
      set: action,
      //get: computed .// no need 
    })
  }

  set(v: string | null): void { this._s = v }
  get(): string | null { return this._s }
}

export default ObsStringMutator
