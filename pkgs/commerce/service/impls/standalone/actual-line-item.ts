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
  timeAdded: number     
  timeModified: number  
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

  timeAdded: number = 0       // Timestamp when added
  timeModified: number = 0    // Timestamp quantity last modified (0 if not in cart)

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
      this.timeModified = snap.timeModified
    }

    makeObservable(this, {
      qu: observable,
      timeAdded: observable,
      timeModified: observable,
      canDecrement: computed,  
      isInCart: computed,
      title: computed,
      increment: action,
      decrement: action,
    })
  }

    // TODO: create a way to pass template strings to the ui conf per sku path!
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
      timeAdded: this.timeAdded,
      timeModified: this.timeModified
    } satisfies ActualLineItemSnapshot)
  }
 
  get canDecrement(): boolean { return this.qu > 0 }
  get quantity(): number {return this.qu}
  get isInCart(): boolean {return this.qu > 0}

  increment(): void { 
    if (this.qu === 0) {
      this.timeAdded = new Date().getTime()
      this.timeModified = this.timeAdded
    }
    else {
      this.timeModified = new Date().getTime()
    }
    this.qu++ 
  }

  decrement(): void {
    if (this.canDecrement) {
      this.qu--
      if (this.qu === 0) {
        this.timeAdded = 0  
        this.timeModified = 0  
      }
      else {
        this.timeModified = new Date().getTime()
      }
    }
  }
}

export {
  type ActualLineItemSnapshot,
  ActualLineItem as default
}