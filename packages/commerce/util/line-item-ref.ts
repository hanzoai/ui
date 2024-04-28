import { observable, action, computed, makeObservable } from 'mobx'

import type { LineItem, ObsLineItemRef } from '../types'

class LineItemRef implements ObsLineItemRef {

  _item: LineItem | undefined = undefined

  constructor() {

    makeObservable(this, {
      _item: observable,
      item: computed,
      set: action
    })
  }

  get item(): LineItem | undefined { return this._item  }
  set = (v: LineItem | undefined): void => { this._item = v  }
}

export default LineItemRef
