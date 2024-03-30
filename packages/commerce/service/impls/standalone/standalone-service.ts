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
  SelectedPaths, 
  ProductTreeNode,
  Promo
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
  private _rootNode: ProductTreeNode 
  private _selectedPaths: SelectedPaths = {}
  private _promo: Promo | null = null

  private _options : StandaloneServiceOptions
  private _currentItem: ActualLineItem | undefined = undefined

  constructor(
    categories: Category[],
    rootNode: ProductTreeNode,
    options: StandaloneServiceOptions,
    serviceSnapshot?: StandaloneServiceSnapshot,
  ) {

    this._rootNode = rootNode
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
        '_selectedPaths' | 
        '_currentItem' |
        '_promo'
    >(this, {
      _selectedPaths :  observable.deep,
      _currentItem: observable,
      _promo: observable,
    })

    makeObservable(this, {
      cartItems: computed,
      cartQuantity: computed,
      cartTotal: computed,
      promoAppliedCartTotal: computed,
      cartEmpty: computed,
      selectedItems: computed,
      selectedCategories: computed, 
      setCurrentItem: action,
      currentItem: computed,
      item: computed,
      selectedPaths: computed,
      appliedPromo: computed,
      setAppliedPromo: action,
      /* NOT selectPaths. It implements it's action mechanism */
    })
  }

  getCategory(id: string): Category | undefined {
    return this._categoryMap.get(id)
  }

  getNodeAtPath(skuPath: string): ProductTreeNode | undefined {
    const toks = skuPath.split(SEP)
    let level = 1
    let desc: ProductTreeNode | undefined = this._rootNode
    do {
      desc = desc!.subNodes?.find((vf) => (vf.skuToken === toks[level])) 
      level++
    }
    while (desc && (level < toks.length))
    return level === toks.length ? desc : undefined 
  } 

  getSelectedNodesAtLevel = computedFn((level: number): ProductTreeNode[] | undefined => {

    let lvl = 1
    let valuesAtLevel: ProductTreeNode[] | undefined  = this._rootNode.subNodes

    do {
      let selectedAtLevel: ProductTreeNode[] | undefined = undefined
        // If not specified, assume all
      if (lvl in this._selectedPaths) {
        selectedAtLevel = valuesAtLevel!.filter((fv) => (this._selectedPaths[lvl].includes(fv.skuToken))) 
      }
      else {
        selectedAtLevel = valuesAtLevel 
      }
      let allSubsOfSelected: ProductTreeNode[] = []
      selectedAtLevel?.forEach((fvd: ProductTreeNode) => {
        if (fvd.subNodes) {
          allSubsOfSelected = [...allSubsOfSelected, ...fvd.subNodes] 
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

  _promoValue_unsafe(value: number): number {
    if (this._promo!.type === 'percent') {
      return value * (1 - this._promo!.value / 100)
    }
    return value - this._promo!.value
  }

  get promoAppliedCartTotal(): number {   
    if (!this._promo) {
      return this.cartTotal
    }
    if (!this._promo.skus) {
      return this._promoValue_unsafe(this.cartTotal)
    }
    let total = this.cartItems.reduce(
      (total, item) => {
        const itemPrice = this._promo!.skus!.includes(item.sku) ? 
          this._promoValue_unsafe(item.price)
          :
          item.price
        return total + itemPrice * item.quantity
      }, 
      0
    )
    return total
  }

  itemPromoPrice(item: LineItem): number | undefined {
    if (this._promo && (!this._promo.skus || this._promo.skus.includes(item.sku) )) {
      return this._promoValue_unsafe(item.price)
    }
    return undefined 
  }

  get cartQuantity(): number {
    return this.cartItems.reduce(
      (total, item) => (total + item.quantity), 
      0
    )
  }

  get appliedPromo(): Promo | null {
    return this._promo
  }

  setAppliedPromo(promo: Promo | null): void {
    this._promo = promo
  }

  setCurrentItem(skuToFind: string | undefined): boolean {

    if (skuToFind === undefined || skuToFind.length === 0) {
      this._currentItem = undefined
      return true
    }
      // self calling function
    this._currentItem = ((): ActualLineItem | undefined  => {

      const categoriesTried: string[] = []
      if (this.selectedCategories && this.selectedCategories.length > 0) {
          for (let category of this.selectedCategories) {
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

  selectPaths(sel: SelectedPaths): Category[] {
    runInAction (() => {
      this._selectedPaths = this._processAndValidate(sel) 
    })
    return this.selectedCategories
  }

  selectPath(skuPath: string): Category[] {
    const toks = skuPath.split(SEP)
    const highestLevel = toks.length - 1
    const fsv: SelectedPaths = {}
    for (let level = 1; level <= highestLevel; level++ ) {
      fsv[level] = [toks[level]]   
    } 
    return this.selectPaths(fsv)
  }

  get selectedPaths(): SelectedPaths {
    const result: SelectedPaths = {}
    for( let level in this._selectedPaths ) {
      result[level] = [...this._selectedPaths[level]]
    }
    return result
  }

  get selectedCategories(): Category[] {
    if (Object.keys(toJS(this._selectedPaths)).length === 0) {
      // FacetsDesc have never been set or unset, so cannot evaluate them
      return []
    }

    return this._rootNode.subNodes!.reduce(
      (acc: Category[], subFacet: ProductTreeNode) => (
          // Pass the root token as a one member array
        this._reduceNode([this._rootNode.skuToken], acc, subFacet)   
      ), 
      []
    )
  }

  private _reduceNode(parentPath: string[], acc: Category[], node: ProductTreeNode): Category[] {
    const path = [...parentPath, node.skuToken] // Don't mutate original please :) 
    const level = path.length - 1
      // If there is no token array supplied for this level,
      // assume all are specified.  Otherwise, see if the 
      // current node is in the array
    const specified = (
      !this._selectedPaths[level] 
      || 
      this._selectedPaths[level].includes(node.skuToken)
    ) 
    if (specified) {
        // Process subnodes
      if (node.subNodes && node.subNodes.length > 0) {
        return node.subNodes.reduce((acc, n) => (
          this._reduceNode(path, acc, n)
        ) 
        , acc)
      }
        // Process leaf
      const cat = this._categoryMap.get(path.join(SEP))
      if (!cat) {
        throw new Error("selectedCategories WTF?!" + path.join(SEP))
      }
      acc.push(cat)    
    }
    return acc
  }

  private _processAndValidate(partial: SelectedPaths): SelectedPaths  {

    const result: SelectedPaths = {}

    let level = 1
    let currentSet = this._rootNode.subNodes!
    
    while (true) {
      let possibleCurrent = currentSet.map((el) => (el.skuToken))
      const validTokens = !partial[level] ? undefined : partial[level].filter((tok) => possibleCurrent.includes(tok))
      if (!validTokens) {
        break
      }
      result[level] = validTokens
      currentSet = validTokens.map((tok) => {
        const fd = currentSet.find((node) => ( node.skuToken === tok ))
        return (fd && fd.subNodes && fd.subNodes.length > 0) ? fd.subNodes : []
      }).flat()
      level++
    }
    
    return result
  }

  get selectedItems(): LineItem[] {
    if (Object.keys(toJS(this._selectedPaths)).length === 0) {
      // FacetsDesc have never been set or unset, so cannot evaluate them
      return []
    }

    return this.selectedCategories.reduce(
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

  debug_getSelectedCategories = () => {
    const spec = this.selectedCategories
    console.log('NUM SPEC CATS: ', spec.length) 
    if (spec.length > 0) {
      console.log('IDS: ', (spec.map((c) => (c.id))).join(', ')) 
    }
  }
}

export {
  type StandaloneServiceOptions, 
  type StandaloneServiceSnapshot,
  StandaloneService as default
} 
