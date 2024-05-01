import { 
  action,
  computed, 
  makeObservable, 
  observable, 
} from 'mobx'
import type { CommerceService, LineItem, ObsLineItemRef } from '../types'


interface CommerceUI extends ObsLineItemRef {
  showBuyOptions: (skuPath: string) => void
  hideBuyOptions: () => void
  get buyOptionsSkuPath(): string | undefined

  itemQuantityChanged(item: LineItem, val: number, prevVal: number): void
}

class CommerceUIStore implements CommerceUI {

  static readonly TIMEOUT = 1500
  _buyOptionsSkuPath: string | undefined = undefined
  _paused: boolean = false
  _activeItem: LineItem | undefined = undefined
  _lastActivity: number | undefined = undefined
  _service: CommerceService

  constructor(s: CommerceService) {
    this._service = s
    makeObservable(this, {
      _buyOptionsSkuPath: observable,
      _activeItem: observable.shallow, 
      showBuyOptions: action,
      hideBuyOptions: action,
      buyOptionsSkuPath: computed,
      itemQuantityChanged: action,
      tick: action,
      item: computed
    })
  }

  showBuyOptions = (skuPath: string): void => {
    this._service.setCurrentItem(undefined)
    this._buyOptionsSkuPath = skuPath
    this._paused = true
  } 

  hideBuyOptions = (): void => {
    this._buyOptionsSkuPath = undefined
    this._paused = false
    if (this._lastActivity) {
      this._lastActivity = Date.now()
    }
  }

  get buyOptionsSkuPath(): string | undefined {
    return this._buyOptionsSkuPath
  } 

  tick = () => {
    if (
      !this._paused
      &&
      this._lastActivity 
      && 
      (Date.now() - this._lastActivity >= CommerceUIStore.TIMEOUT)
    ) {
      this._activeItem = undefined
      this._lastActivity = undefined
    }
  }

  itemQuantityChanged = (item: LineItem, val: number, oldVal: number, ): void  => {

    if (val === 0) {
      if (this._activeItem?.sku === item.sku) {
        this._activeItem = undefined
        this._lastActivity = undefined
      }
      // otherwise ignore
    }
    else if (val < oldVal) {
      if (this._activeItem?.sku === item.sku) {
        this._lastActivity = Date.now()
      }
      // otherwise ignore
    }
    else {
        this._activeItem = item
        this._lastActivity = Date.now()
    }
  } 

  get item(): LineItem | undefined {
    return this._activeItem
  }
}

export {
  CommerceUIStore,
  type CommerceUI
}