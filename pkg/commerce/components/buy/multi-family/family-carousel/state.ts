import type { Family, LineItem, ObsLineItemRef, Product } from '../../../../types'
import { observable, action, computed, makeObservable } from 'mobx'

class SlideState implements ObsLineItemRef {

  _fam: Family
  _item: Product
  _syncSku: (sku: string) => void
  _selected: boolean

  constructor(fam: Family, initiallySelected: boolean, sync: (sku: string) => void) {
    this._fam = fam
    this._item = fam.products[0]
    this._selected = initiallySelected
    this._syncSku = sync

    makeObservable(this, {
      _item: observable,
      item: computed,
      selectSku: action
    })
  }

  selectSku = (sku: string) => {
    if (this._item.sku === sku) return;
    const found = this._fam.products.find((i) => (i.sku === sku))
    if (found) {
      this._item = found
      if (this._selected) {
        this._syncSku(sku)
      }
    }
    else {
      throw new Error('SlideState.selectSku(): no item found!')
    }
  }

  setSelected = (b: boolean) => {this._selected = b}

  get id(): string {return (this._fam.id)}

  get item(): LineItem | undefined {
    return this._item as LineItem
  }
}

class FamilyCarouselState {

  _map = new Map<string, SlideState>()
  _syncSku: (sku: string) => void

  constructor(
    fams: Family[], 
//    initialFamilyId: string,
    syncSkuToCurrentSlide: (sku: string) => void
  ) {

    fams.forEach((f, index) => {this._map.set(f.id, new SlideState(
      f,
      (index === 0),
      syncSkuToCurrentSlide
    ))})
    this._syncSku = syncSkuToCurrentSlide
  }

  setCurrentFamily = (id: string) => {

    this._map.forEach((s) => {
      s.setSelected(s.id === id)
    })

    const slideState = this._map.get(id)
    if (slideState) {
      this._syncSku(slideState.item!.sku)
    }
    else {
      throw new Error(`FamilyCarouselState.setCurrentFamily: no state object for id '${id}'!`)
    }
  }

  getSlideState = (familyId: string): SlideState | undefined => (this._map.get(familyId))
}

export {
  SlideState,
  FamilyCarouselState
} 
