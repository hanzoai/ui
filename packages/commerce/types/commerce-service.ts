import type { LineItem, ObsLineItemRef } from './line-item'
import type { ProductTreeNode, SelectedPaths } from './tree-node'
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
     * If a level is selected as [], nothing will be selected.
     * If a level is missing (undefined), everything at that level is selected
     * 
     * This selects one or more Category's, and all the LineItem's in them.
     * 
     * An empty value object selects all Category's and all LineItem's,
     * */ 
  selectPaths(value: SelectedPaths): Category[]
  selectPath(skuPath: string): Category[] 

  get selectedPaths(): SelectedPaths // returns a copy
  
  get selectedItems(): LineItem[]
  get selectedCategories(): Category[] 

    /** Whether this path defines a Category, or if it has further levels */
  getNodeAtPath(skuPath: string): ProductTreeNode | undefined 

    /** 
     * Who are the subnodes selected at 'level'? 
     * If more than one value is selected at 'level', 
     * the returned ProductTreeNode[] may represent multiple sets. 
     * */ 
  getSelectedNodesAtLevel(level: number): ProductTreeNode[] | undefined 

      /**
     * For convenience, so widgets can share state.
     * "current" is unrelated to what is "selected",
     * ie, facets' values 
     *  */ 
  setCurrentItem(sku: string | undefined): boolean // valid sku and was set.
    /**
     * For convenience, so widgets can share state.
     * "current" is unrelated to what is "selected",
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