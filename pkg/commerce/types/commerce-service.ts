import type { LineItem, ObsLineItemRef } from './line-item'
import type { CategoryNode, SelectedPaths, CategoryNodeRole } from './category-node'
import type { Family, ObsFamilyRef} from './family'
import type Promo from './promo'


interface CommerceService extends ObsLineItemRef, ObsFamilyRef {

    /** Items in cart */
  get cartItems(): LineItem[]
    /** Total of all quantities of all items in cart */
  get cartQuantity(): number
    /** Total of all prices x quantities of items in cart */
  get cartTotal(): number

    /** cartItem whose quantity was modified most recently 
     * item: LineItem
     * modified: number (timestamp)
     * (undefined if cartEmpty)
     */
  get recentItem(): { item: LineItem, modified: number }  | undefined 
  get promoAppliedCartTotal(): number

  get cartEmpty(): boolean

  get appliedPromo(): Promo | null
  setAppliedPromo(promo: Promo | null): void
    /** returns the price with promo applied, of undefined if no promo or promo does not apply */
  itemPromoPrice(item: LineItem): number | undefined
   
  getFamilySubtotal(familyId: string): number

  createOrder(email: string, name?: string): Promise<string | undefined>
  updateOrderShippingInfo(orderId: string, shippingInfo: any): Promise<void>
  updateOrderPaymentInfo(orderId: string, paymentInfo: any): Promise<void>

    /** 
     * Sets the tokens at each level supplied.
     * If a level is selected as [], nothing will be selected.
     * If a level is missing (undefined), everything at that level is selected
     * 
     * This selects one or more Family's, and all the LineItem's in them.
     * 
     * An empty value object selects all Family's and all LineItem's,
     * */ 
  selectPaths(value: SelectedPaths): Family[]
  selectPath(skuPath: string): Family[] 

    /**
     * With role as ...
     *  
     * 'single-family': 
     *    item: item with skuPath as SKU, otherwise undefined
     *    node: node at path (or item's parent node),
     *    family: node at path as family (or item's parent node as family), 
     *    families: undefined 
     * 
     * 'family-in-multi-family': 
     *    item: item with skuPath as SKU, otherwise undefined
     *    node: parent node of this family (or parent node of item's family)
     *    family: this family (or item's family)
     *    families: this family (or item's family) and siblings
     * 
     * 'multi-family': 
     *    item: undefined
     *    node: node at path 
     *    family: undefined
     *    families: subnodes / families of this node
     *    
     * 'non-outermost': 
     *    item: undefined
     *    node: node at path
     *    family: undefined
     *    families: undefined
     * 
    */
  peek(skuPath: string): {
    role: CategoryNodeRole
    family: Family | undefined
    families: Family[] | undefined
    node: CategoryNode | undefined
    item: LineItem | undefined
  } | string // or error string

    /** @deprecated
     *  Whether this path defines a Family, or if it has further levels 
     * */
  getNodeAtPath(skuPath: string): CategoryNode | undefined 

  get selectedPaths(): SelectedPaths // returns a copy
  
  get selectedItems(): LineItem[]
  get selectedFamilies(): Family[] 
  get hasSelection(): boolean


    /** 
     * Who are the subnodes selected at 'level'? 
     * If more than one value is selected at 'level', 
     * the returned CategoryNode[] may represent multiple sets. 
     * */ 
  getSelectedNodesAtLevel(level: number): CategoryNode[] | undefined 

      /**
     * For convenience, so widgets can share state.
     * "current" is unrelated to what branches and items are 
     * "selected" (with CategoryNode's and paths)
     * 
     *  SEE ALSO: from ObsLineItemRef and ObsFamilyRef, there are also
     *  get item(): LineItem | undefined
     *  get family(): Family | undefined
     * 
     *  These simply delegate to these functions
     *  */ 
  setCurrentItem(sku: string | undefined): boolean // valid sku and was set.
  get currentItem(): LineItem | undefined
  setCurrentFamily(id: string | undefined): boolean // valid id and was set.
  get currentFamily(): Family | undefined

    // utility
  getFamilyById(id: string): Family | undefined
  getItemBySku(sku: string): LineItem | undefined
}


export {
  type CommerceService as default
}