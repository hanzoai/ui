import { 
  computed, 
  makeObservable, 
  observable, 
  runInAction, 
  action,
  toJS
} from 'mobx'

import type {
  CommerceService, 
  Category, 
  LineItem,
  FacetsValue, 
  FacetsDesc
} from '../../../types'

import {
  createOrder as createOrderHelper,
  updateOrder as updateOrderHelper
} from './orders'

import ActualLineItem, { type ActualLineItemSnapshot } from './actual-line-item'

type StandaloneServiceOptions = {
  levelZeroPrefix?: string
  dbName: string
  ordersTable: string
}

interface StandaloneServiceSnapshot {
  items: ActualLineItemSnapshot[]  
}

class StandaloneService 
  implements CommerceService
{
  private _categoryMap = new Map<string, Category>()
  private _facetsDesc: FacetsDesc 
  private _selectedFacets: FacetsValue = {}

  private _options : StandaloneServiceOptions
  private _currentItem: ActualLineItem | undefined = undefined

  constructor(
    categories: Category[],
    facets: FacetsDesc,
    options: StandaloneServiceOptions,
    serviceSnapshot?: StandaloneServiceSnapshot,
  ) {

    this._facetsDesc = facets
    this._options = options

    categories.forEach((c) => {
      c.products = c.products.map((p) => { 
        if (serviceSnapshot) {
          const itemSnapshot = serviceSnapshot.items.find((is) => (is.sku === p.sku))
          if (itemSnapshot) {
            return new ActualLineItem(p, itemSnapshot)
          }
        }
        return new ActualLineItem(p)
      })
      this._categoryMap.set(c.id, c)
    })

    makeObservable<
      StandaloneService, 
        '_selectedFacets' | 
        '_currentItem' 
    >(this, {
      _selectedFacets :  observable.deep,
      _currentItem: observable,
    })

    makeObservable(this, {
      cartItems: computed,
      cartTotal: computed, 
      specifiedItems: computed,
      specifiedCategories: computed, 
      setCurrentItem: action,
      currentItem: computed,
      item: computed,
      facetsValue: computed
      /* NOT setFacets. It implements it's action mechanism */
    })
  }

  async createOrder(email: string, paymentMethod: string): Promise<string | undefined> {
    const snapshot = this.takeSnapshot()
    const order = await createOrderHelper(email, paymentMethod, snapshot.items, this._options) // didn't want to have two levels of 'items'
    return order.id
  }

  async updateOrder(orderId: string, email: string, paymentMethod: string): Promise<void> {
    const snapshot = this.takeSnapshot()
    updateOrderHelper(orderId, email, paymentMethod, snapshot.items, this._options) // didn't want to have two levels of 'items'
  }

  takeSnapshot = (): StandaloneServiceSnapshot => ({
    items : (this.cartItems as ActualLineItem[]).map((it) => (it.takeSnapshot()))
  })

  get cartItems(): LineItem[] {
    let result: LineItem[] = []
    this._categoryMap.forEach((cat) => {
      result = [...result, ...(cat.products as LineItem[]).filter((item) => (item.isInCart))]
    })
    return result.sort((it1, it2) => ((it1 as ActualLineItem).timeAdded - (it2 as ActualLineItem).timeAdded))
  }
  
  get cartTotal(): number {
    return this.cartItems.reduce(
      (total, item) => (total + item.price * item.quantity), 
      0
    )
  }

  setCurrentItem(skuToFind: string | undefined): boolean {

    if (skuToFind === undefined || skuToFind.length === 0) {
      this._currentItem = undefined
      return true
    }
      // self calling function
    this._currentItem = ((): ActualLineItem | undefined  => {

      const categoriesTried: string[] = []
      if (this.specifiedCategories && this.specifiedCategories.length > 0) {
          for (let category of this.specifiedCategories) {
          categoriesTried.push(category.id)
          const foundItem = category.products.find((p) => (p.sku === skuToFind))
          if (foundItem) {
            return foundItem as ActualLineItem
          }
        }
      }
      for( const [categoryId, category] of this._categoryMap.entries()) {
        if (categoriesTried.includes(categoryId)) continue
        const foundItem = category.products.find((p) => (p.sku === skuToFind)) as ActualLineItem | undefined
        if (foundItem) {
          return foundItem as ActualLineItem
        }
      }
      return undefined
    })();

    return !!this._currentItem
  }


  /* ObsLineItemRef */
  get item(): LineItem | undefined {
    return this._currentItem
  }

  get currentItem(): LineItem | undefined {
    return this._currentItem
  }

  setFacets(sel: FacetsValue): Category[] {
    runInAction (() => {
      const res = this._processAndValidate(sel) 
      if (res) {
        this._selectedFacets = res
      }
    })
    return this.specifiedCategories
  }

  get facetsValue(): FacetsValue {
    const result: FacetsValue = {}
    for( let level in this._selectedFacets ) {
      result[level] = [...this._selectedFacets[level]]
    }
    return result
  }

  get specifiedCategories(): Category[] {
    if (Object.keys(toJS(this._selectedFacets)).length === 0) {
      // FacetsDesc have never been set or unset, so cannot evaluate them
      return []
    }
    const keysStr = Object.keys(this._facetsDesc)
      // 1-base, visiting two per iteration
    let current: string[] = this._selectedFacets[1] 
    for (let i = 2; i <= keysStr.length; i++) {
      current = StandaloneService._visit(current, this._selectedFacets[i])
    }
    const prefix = this._options.levelZeroPrefix ?? ''
    return current.map((almostTheCatId) => (this._categoryMap.get(prefix + almostTheCatId)!))
  }

  private static _visit(current: string[], next: string[]): string[] {
    const result: string[] = []
    current.forEach((c) => {
      next.forEach((n) => {
        result.push(`${c}-${n}`)
      })
    })
    return result
  }

  private _processAndValidate(partial: FacetsValue): FacetsValue | undefined {
    const result: FacetsValue = {}
    const keysStr = Object.keys(this._facetsDesc)
    const keysNum = keysStr.map((key) => (parseInt(key)))
    keysNum.forEach((key) => {
        // if not present, assume the facet is "off" and allow all (include all in the set).
      if (!partial[key]) {
        result[key] = this._facetsDesc[key].map((fv) => (fv.value))
      }
        // If present, filter out the bad values if any
      const filtered = partial[key].filter((fv) => this._facetsDesc[key].find((fvDesc) => (fvDesc.value === fv)))
      result[key] = filtered
    })
    return result
  }

  get specifiedItems(): LineItem[] {
    if (Object.keys(toJS(this._selectedFacets)).length === 0) {
      // FacetsDesc have never been set or unset, so cannot evaluate them
      return []
    }

    return this.specifiedCategories.reduce(
      (allProducts, cat) => ([...allProducts, ...(cat.products as LineItem[])]), [] as LineItem[])
  }

  getCartCategorySubtotal(categoryId: string): number {
    const c = this._categoryMap.get(categoryId)!
    return (c.products as LineItem[]).reduce(
        // avoid floating point bs around zero
      (total, item) => (item.quantity > 0 ? total + item.price * item.quantity : total),
      0
    )
  }
}

export {
  type StandaloneServiceOptions, 
  type StandaloneServiceSnapshot,
  StandaloneService as default
} 
