import { 
  computed, 
  makeObservable, 
  observable, 
  runInAction, 
  action,
  toJS
} from 'mobx'

import { computedFn } from 'mobx-utils'

import type {
  CommerceService, 
  Category, 
  LineItem,
  FacetsValue, 
  FacetValueDesc
} from '../../../types'

import {
  createOrder as createOrderHelper,
  updateOrderShippingInfo as updateOrderShippingInfoHelper,
  updateOrderPaymentInfo as updateOrderPaymentInfoHelper
} from './orders'

import ActualLineItem, { type ActualLineItemSnapshot } from './actual-line-item'

const SEP = '-'

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
  private _rootFacet: FacetValueDesc 
  private _selectedFacets: FacetsValue = {}

  private _options : StandaloneServiceOptions
  private _currentItem: ActualLineItem | undefined = undefined

  constructor(
    categories: Category[],
    rootFacet: FacetValueDesc,
    options: StandaloneServiceOptions,
    serviceSnapshot?: StandaloneServiceSnapshot,
  ) {

    this._rootFacet = rootFacet
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
      cartQuantity: computed,
      cartTotal: computed, 
      cartEmpty: computed,
      specifiedItems: computed,
      specifiedCategories: computed, 
      setCurrentItem: action,
      currentItem: computed,
      item: computed,
      facetsValue: computed
      /* NOT setFacets. It implements it's action mechanism */
    })
  }


  getCategory(id: string): Category | undefined {
    return this._categoryMap.get(id)
  }

  getFacetValuesAtSkuPath(skuPath: string): FacetValueDesc[] | undefined {
    const toks = skuPath.split(SEP)
    let level = 1
    let valuesAtLevel: FacetValueDesc[] | undefined  = this._rootFacet.sub
    do {
      const fvalue = valuesAtLevel!.find((vf) => (vf.value === toks[level])) 
      valuesAtLevel = fvalue ? fvalue.sub : undefined
      level++
    }
    while (valuesAtLevel && (level < toks.length))
    return level === toks.length ? valuesAtLevel : undefined 
  } 

  getFacetValuesSpecified = computedFn((level: number): FacetValueDesc[] | undefined => {

    let lvl = 1
    let valuesAtLevel: FacetValueDesc[] | undefined  = this._rootFacet.sub

    do {
      let selectedAtLevel: FacetValueDesc[] | undefined = undefined
        // If not specified, assume all
      if (lvl in this._selectedFacets) {
        selectedAtLevel = valuesAtLevel!.filter((fv) => (this._selectedFacets[lvl].includes(fv.value))) 
      }
      else {
        selectedAtLevel = valuesAtLevel 
      }
      let allSubsOfSelected: FacetValueDesc[] = []
      selectedAtLevel?.forEach((fvd: FacetValueDesc) => {
        if (fvd.sub) {
          allSubsOfSelected = [...allSubsOfSelected, ...fvd.sub] 
        }  
      })

      valuesAtLevel = allSubsOfSelected
      lvl++
    } while (valuesAtLevel.length > 0 && lvl <= level)

    return (valuesAtLevel.length > 0 && ((lvl - 1) === level)) ? valuesAtLevel : undefined
  })


  //async createOrder(email: string, paymentMethod: string): Promise<string | undefined> {
  async createOrder(email: string, name?: string): Promise<string | undefined> {
    const snapshot = this.takeSnapshot()
    const order = await createOrderHelper(email, snapshot.items, this._options, name) // didn't want to have two levels of 'items'
    return order.id
  }

  // TODO: add shippingInfo type
  async updateOrderShippingInfo(orderId: string, shippingInfo: any): Promise<void> {
    updateOrderShippingInfoHelper(orderId, shippingInfo, this._options)
  }

  // TODO: add paymentInfo type
  async updateOrderPaymentInfo(orderId: string, paymentInfo: any): Promise<void> {
    updateOrderPaymentInfoHelper(orderId, paymentInfo, this._options)
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
  
  get cartEmpty(): boolean {
    return this.cartItems.length === 0    
  }

  get cartTotal(): number {
    return this.cartItems.reduce(
      (total, item) => (total + item.price * item.quantity), 
      0
    )
  }

  get cartQuantity(): number {
    return this.cartItems.reduce(
      (total, item) => (total + item.quantity), 
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
      this._selectedFacets = this._processAndValidate(sel) 
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

    return this._rootFacet.sub!.reduce(
      (acc: Category[], subFacet: FacetValueDesc) => (
          // Pass the root token as a one member array
        this._reduceNode([this._rootFacet.value], acc, subFacet)   
      ), 
      []
    )
  }

  private _reduceNode(parentPath: string[], acc: Category[], node: FacetValueDesc): Category[] {
    const path = [...parentPath, node.value] // Don't mutate original please :) 
    const level = path.length - 1
      // If there is no token array supplied for this level,
      // assume all are specified.  Otherwise, see if the 
      // current node is in the array
    const specified = (
      !this._selectedFacets[level] 
      || 
      this._selectedFacets[level].includes(node.value)
    ) 
    if (specified) {
        // Process subnodes
      if (node.sub && node.sub.length > 0) {
        return node.sub.reduce((acc, n) => (
          this._reduceNode(path, acc, n)
        ) 
        , acc)
      }
        // Process leaf
      const cat = this._categoryMap.get(path.join(SEP))
      if (!cat) {
        throw new Error("specifiedCategories WTF?!" + path.join(SEP))
      }
      acc.push(cat)    
    }
    return acc
  }

  private _processAndValidate(partial: FacetsValue): FacetsValue  {

    const result: FacetsValue = {}

    let level = 1
    let currentSet = this._rootFacet.sub!
    
    while (true) {
      let possibleCurrent = currentSet.map((el) => (el.value))
      const validTokens = !partial[level] ? undefined : partial[level].filter((tok) => possibleCurrent.includes(tok))
      if (!validTokens) {
        break
      }
      result[level] = validTokens
      currentSet = validTokens.map((tok) => {
        const fd = currentSet.find((node) => ( node.value === tok ))
        return (fd && fd.sub && fd.sub.length > 0) ? fd.sub : []
      }).flat()
      level++
    }
    
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
