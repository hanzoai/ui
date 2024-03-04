import { 
  action,
  computed, 
  makeObservable, 
  observable, 
} from 'mobx'

import type { Product, LineItem } from '../../../types'

interface ActualLineItemSnapshot {
  sku: string  
  categoryId: string  // helps impl of restoreFromSnapshot
  title: string
  price: number
  quantity: number
  timeAdded: number   // helps to sort view of order and cart
}

class ActualLineItem 
  implements LineItem  
{

  qu: number = 0

  id: string    
  sku: string   
  title: string
  titleAsOption: string
  categoryId: string  
  desc?: string
  price: number
  img?: string 
  timeAdded: number = 0 // timeAdded of being added to cart

  constructor(prod: Product, snap?: ActualLineItemSnapshot) {
    this.id = prod.id
    this.sku = prod.sku
    this.title = prod.title
    this.titleAsOption = prod.titleAsOption
    this.categoryId = prod.categoryId
    this.desc = prod.desc
    this.price = prod.price
    this.img = prod.img

    if (snap) {
      this.qu = snap.quantity
      this.timeAdded = snap.quantity
    }

    makeObservable(this, {
      qu: observable,
      timeAdded: observable,
      canDecrement: computed,  
      isInCart: computed,
      
      increment: action,
      decrement: action,
    })
  }

  takeSnapshot = (): ActualLineItemSnapshot => ({
    sku: this.sku,
    categoryId: this.categoryId,
    title: this.title,
    price: this.price,
    quantity: this.qu,
    timeAdded: this.timeAdded
  } satisfies ActualLineItemSnapshot)
 
  get canDecrement(): boolean { return this.qu > 0 }
  get quantity(): number {return this.qu}
  get isInCart(): boolean {return this.qu > 0}

  increment(): void { 
    if (this.qu === 0) {
      this.timeAdded = new Date().getTime()
    }
    this.qu++ 
  }

  decrement(): void {
    if (this.canDecrement) {
      this.qu--
      if (this.qu === 0) {
        this.timeAdded = 0  
      }
    }
  }

  inCategory(id: string): boolean {
      // TODO: will break for level one (which is ok for lux, but not generally)
    return this.sku.includes(`-${id}-`)
  }

}

export {
  type ActualLineItemSnapshot,
  ActualLineItem as default
}