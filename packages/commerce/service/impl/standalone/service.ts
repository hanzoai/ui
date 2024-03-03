import { 
  computed, 
  makeObservable, 
  observable, 
  runInAction, 
  action,
  toJS
} from 'mobx'

import type { 
  Category, 
  LineItem,
  FacetsValue, 
  FacetsDesc
} from '../../../types'

import type CommerceService from '../../commerce-service'

import ObservableLineItem from './obs-line-item'

export type StandaloneServiceOptions = {
  levelZeroPrefix?: string
}

class StandaloneCommerceService 
  implements CommerceService
{
  private _categoryMap = new Map<string, Category>()
  private _facetsDesc: FacetsDesc 
  private _selectedFacets: FacetsValue = {}

  private _options : StandaloneServiceOptions

  private _currentItem: LineItem | undefined = undefined

  constructor(
    categories: Category[],
    facets: FacetsDesc,
    options: StandaloneServiceOptions={}
  ) {

    this._facetsDesc = facets
    this._options = options

    categories.forEach((c) => {
      c.products = c.products.map((p) => (new ObservableLineItem(p)))
      this._categoryMap.set(c.id, c)
    })

    makeObservable<
      StandaloneCommerceService, 
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

  get cartItems(): LineItem[] {
    let result: LineItem[] = []
    this._categoryMap.forEach((cat) => {
      result = [...result, ...(cat.products as LineItem[]).filter((item) => (item.isInCart))]
    })
    return result
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
    
    this._currentItem = ((): LineItem | undefined  => {
      const categoriesTried: string[] = []
      if (this.specifiedCategories && this.specifiedCategories.length > 0) {
  
        for (let category of this.specifiedCategories) {
          categoriesTried.push(category.id)
          const foundItem = 
            (category.products as LineItem[]).find((item) => (item.sku === skuToFind))
          if (foundItem) {
            return foundItem
          }
        }
      }
      
      let foundItem: LineItem | undefined = undefined
      this._categoryMap.forEach((category, categoryId) => {
        if (foundItem) return
        if (categoriesTried.includes(categoryId)) return
        foundItem = (category.products as LineItem[]).find((item) => (item.sku === skuToFind))
      }) 
    })();

    return !!this._currentItem
  }


  /* ObsLineItemRef */
  get item(): LineItem | undefined {
    return this.currentItem
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
      current = StandaloneCommerceService._visit(current, this._selectedFacets[i])
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

export default StandaloneCommerceService
