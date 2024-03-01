import { 
  action,
  computed, 
  makeObservable, 
  observable, 
} from 'mobx'

import type { Product, LineItem } from '../../../types'

class ObsLineItem implements LineItem {

  qu: number = 0

  id: string    
  sku: string   
  title: string
  titleAsOption: string
  categoryId: string  
  desc?: string
  price: number
  img?: string  

  constructor(prod: Product) {
    this.id = prod.id
    this.sku = prod.sku
    this.title = prod.title
    this.titleAsOption = prod.titleAsOption
    this.categoryId = prod.categoryId
    this.desc = prod.desc
    this.price = prod.price
    this.img = prod.img

    makeObservable(this, {
      qu: observable,
      canDecrement: computed,  
      isInCart: computed,
      
      increment: action,
      decrement: action,
    })
  }

  get canDecrement(): boolean { return this.qu > 0 }
  get quantity(): number {return this.qu}
  get isInCart(): boolean {return this.qu > 0}

  increment(): void { this.qu++ }

  decrement(): void {
    if (this.canDecrement) {
      this.qu--
    }
  }

  inCategory(id: string): boolean {
      // TODO: will break for level one (which is ok for lux, but not generally)
    return this.sku.includes(`-${id}-`)
  }

}

export default ObsLineItem