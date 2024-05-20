import { 
  action,
  computed, 
  makeObservable, 
  observable, 
} from 'mobx'

import type { ImageDef, MediaTransform, VideoDef } from '@hanzo/ui/types'

import type { Product, LineItem, CommerceService } from '../../../types'

interface ActualLineItemSnapshot {
  sku: string  
  familyId: string  // helps impl of restoreFromSnapshot
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
  optionLabelShort?: string  
  familyTitle: string
  familyId: string  
  byline?: string
  desc?: string
  price: number
  img?: ImageDef 
  video?: VideoDef 
  animation?: string
  mediaTransform?: MediaTransform 
  optionImg?: ImageDef
  timeAdded: number = 0 // timeAdded of being added to cart

  constructor(prod: Product, snap?: ActualLineItemSnapshot) {
    this.id = prod.id
    this.sku = prod.sku
    this.fullTitle = prod.fullTitle
    this.optionLabel = prod.optionLabel
    this.optionLabelShort = prod.optionLabelShort
    this.familyTitle = prod.familyTitle
    this.familyId = prod.familyId
    this.byline = prod.byline
    this.desc = prod.desc
    this.price = prod.price
    this.img = prod.img
    this.video = prod.video
    this.animation = prod.animation
    this.optionImg = prod.optionImg
    this.mediaTransform = prod.mediaTransform

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
    return this.fullTitle ? this.fullTitle : (this.familyTitle + ', ' + this.optionLabel)
  }

  takeSnapshot = (cmmc: CommerceService): ActualLineItemSnapshot => {

    const title = this.fullTitle ? 
      this.fullTitle 
      : 
      ((cmmc.getFamilyById(this.familyId)?.title ?? this.familyTitle) + ', ' + this.optionLabel)

    return({
      sku: this.sku,
      familyId: this.familyId,
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
}

export {
  type ActualLineItemSnapshot,
  ActualLineItem as default
}