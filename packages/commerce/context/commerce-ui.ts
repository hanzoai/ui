import { 
  action,
  computed, 
  makeObservable, 
  observable, 
} from 'mobx'

interface CommerceUI {
  showBuyOptions: (skuPath: string) => void
  hideBuyOptions: () => void

  get buyOptionsShowing(): boolean

  get skuPath(): string | undefined
  clearSkuPath: () => void
}

class CommerceUIStore implements CommerceUI {

  _skuPath: string | undefined = undefined
  _optionsShowing: boolean = false

  constructor() {
    makeObservable(this, {
      _skuPath: observable, 
      _optionsShowing: observable,
      showBuyOptions: action,
      hideBuyOptions: action,
      buyOptionsShowing: computed,
      skuPath: computed,
      clearSkuPath: action
    })
  }

  showBuyOptions = (skuPath: string): void => {
    this._skuPath = skuPath
    this._optionsShowing = true
  } 

  hideBuyOptions = (): void => {
    this._optionsShowing = false
  }

  get buyOptionsShowing(): boolean {
    return this._optionsShowing
  } 

  get skuPath(): string | undefined {
    return this._skuPath
  } 

  clearSkuPath = (): void => {
    this._skuPath = undefined
    this._optionsShowing = false
  }
}

export {
  CommerceUIStore,
  type CommerceUI
}