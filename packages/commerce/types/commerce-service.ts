import type { LineItem, ObsLineItemRef } from './line-item'
import type { FacetValueDesc, FacetsValue } from './facet'
import type Category from './category'
import type Promo from './promo'

interface CommerceService extends ObsLineItemRef {

    /** Items in cart */
  get cartItems(): LineItem[]
    /** Total of all quantities of all items in cart */
  get cartQuantity(): number
    /** Total of all prices x quantities of items in cart */
  get cartTotal(): number

  get promoAppliedCartTotal(): number

  get cartEmpty(): boolean

  get appliedPromo(): Promo | null
  setAppliedPromo(promo: Promo | null): void
    /** returns the price with promo applied, of undefined if no promo or promo does not apply */
  itemPromoPrice(item: LineItem): number | undefined
   
  getCartCategorySubtotal(categoryId: string): number

  createOrder(email: string, name?: string): Promise<string | undefined>
  updateOrderShippingInfo(orderId: string, shippingInfo: any): Promise<void>
  updateOrderPaymentInfo(orderId: string, paymentInfo: any): Promise<void>

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

    /** Whether this path defines a Category, or if it has further levels */
  getFacetValuesAtSkuPath(skuPath: string): FacetValueDesc[] | undefined 

    /** Based on current value of 'level', what are the available subfacets? 
     *  If more than one value is specified at 'level' returned FacetValueDesc[]
     * may represent multiple sets. 
     * */ 
  getFacetValuesSpecified(level: number): FacetValueDesc[] | undefined 

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

  getCategory(id: string): Category | undefined

}

export {
  type CommerceService as default
}