import type { LineItem, ObsLineItemRef } from './line-item'
import type { FacetsValue } from './facet'
import type Category from './category'

interface CommerceService extends ObsLineItemRef {

    /** Items in cart */
  get cartItems(): LineItem[]
    /** Total of all quantities of items in cart */
  get cartQuantity(): number
    /** Total of all prices X quantities of items in cart */
  get cartTotal(): number
   
  getCartCategorySubtotal(categoryId: string): number

  createOrder(email: string, paymentMethod: string): Promise<string | undefined>
  // TODO: add shippingInfo type
  updateOrder(orderId: string, email: string, paymentMethod: string, shippingInfo?: any): Promise<void>

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
  get facetsValue(): FacetsValue // returns a copy
  get specifiedItems(): LineItem[]
  get specifiedCategories(): Category[] 

    /**
     * For convenience, so widgets can share state.
     * "current" is unrelated to what is "specified",
     * ie, facets' values 
     *  */ 
  setCurrentItem(sku: string | undefined): boolean // valid sku and was set.
    /**
     * For convenience, so widgets can share state.
     * "current" is unrelated to what is "specified",
     * ie, facets' values 
     * 
     * note: for ObsLineItemRef, there is also
     *  get item(): LineItem | undefined
     * which simply delegates to this function
     *  */ 
  get currentItem(): LineItem | undefined

}

export {
  type CommerceService as default
}