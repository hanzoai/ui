/**
 * Web-only slot marker. gui forwards unrecognised props to the DOM node and
 * native drops them, so this is the cross-platform way to keep the `data-slot`
 * contract that app CSS and tests select on.
 */
export const slot = (name: string) => ({ 'data-slot': name }) as object

/**
 * Web-only tooltip marker, for the same reason as `slot`.
 *
 * `title` is a DOM attribute with no native equivalent, so gui does not type it
 * — but it is the only hover affordance an icon-only control has on a pointer
 * device. `aria-label` is NOT a substitute: it names the control for assistive
 * tech and renders nothing on hover. Set both.
 */
export const tip = (text: string) => ({ title: text }) as object
