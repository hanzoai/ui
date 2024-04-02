import { 
  action,
  computed, 
  makeObservable, 
  observable, 
} from 'mobx'

import type { ImageDef, VideoDef } from '@hanzo/ui/types'

import type { Product, LineItem, CommerceService } from '../../../types'

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
  fullTitle?: string
  optionLabel: string
  categoryTitle: string
  categoryId: string  
  desc?: string
  price: number
  img?: ImageDef 
  video?: VideoDef 
  animation?: string 
  timeAdded: number = 0 // timeAdded of being added to cart

  constructor(prod: Product, snap?: ActualLineItemSnapshot) {
    this.id = prod.id
    this.sku = prod.sku
    this.fullTitle = prod.fullTitle
    this.optionLabel = prod.optionLabel
    this.categoryTitle = prod.categoryTitle
    this.categoryId = prod.categoryId
    this.desc = prod.desc
    this.price = prod.price
    this.img = prod.img
    this.video = prod.video
    this.animation = prod.animation

    if (snap) {
      this.qu = snap.quantity
      this.timeAdded = snap.timeAdded
    }

    makeObservable(this, {
      qu: observable,
      timeAdded: observable,
      canDecrement: computed,  
      isInCart: computed,
      title: computed,
      increment: action,
      decrement: action,
    })
  }

  get title(): string {
    return this.fullTitle ? this.fullTitle : (this.categoryTitle + ', ' + this.optionLabel)
  }

  takeSnapshot = (cmmc: CommerceService): ActualLineItemSnapshot => {

    const title = this.fullTitle ? 
      this.fullTitle 
      : 
      ((cmmc.getCategory(this.categoryId)?.title ?? this.categoryTitle) + ', ' + this.optionLabel)

    return({
      sku: this.sku,
      categoryId: this.categoryId,
      title,
      price: this.price,
      quantity: this.qu,
      timeAdded: this.timeAdded
    } satisfies ActualLineItemSnapshot)
  }
 
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