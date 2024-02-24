import type { LineItem, Category, TogglableCategory } from '../types'

interface CommerceService {

    /** alpha by SKU */
  get cartItems(): LineItem[]
  get cartTotalValue(): number
  get cartItemCount(): number
  
  getCategorySubtotal: (categoryId: string) => number

    /** 
     * returns Product's that belong to all categories 
     * (and caches them until the next call) 
     * 
     * null resets the specified set to all products in the store
     * */ 
  setSpecifiedCategories(categoryIds: string[] | null): LineItem[]
  setCategoryStates(states: {[key: string]: boolean}): void 
  get specifiedCategories(): Category[] // or empty array
  get specifiedItems(): LineItem[]

    /** sorted by level */
  get allCategories(): Category[]
    /** for dev convenience */ 
  get allItems(): LineItem[] 
  getCategories(ids: string[]): TogglableCategory[]
}

export {
  type CommerceService as default
}