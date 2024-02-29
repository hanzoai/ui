import type {  
  Category, 
  FacetsValue,
  LineItem 
} from '../types'

interface CommerceService {

  get cartItems(): LineItem[]
  get cartTotal(): number
  getCartCategorySubtotal(categoryId: string): number

    /** 
     * Sets the tokens at each level supplied.
     * If a level is specifed as [], nothing will be specified.
     * If a level is missing (undefined), everything at that level is included
     * 
     * This specifies one or more Category's, and all the LineItem's in them
     * 
     * An empty value object specifies all Category's and all LineItem's,
     * */ 
  setFacets(value: FacetsValue): Category[]
  get specifiedItems(): LineItem[]
  get specifiedCategories(): Category[] 

    /**
     * For convenience, so widgets can share state.
     * "current" is unrelated to what is "specified",
     * ie, facets' values 
     *  */ 
  setCurrentItem(sku: string | undefined): void
    /**
     * For convenience, so widgets can share state.
     * "current" is unrelated to what is "specified",
     * ie, facets' values 
     *  */ 
  get currentItem(): LineItem | undefined
}

export {
  type CommerceService as default
}