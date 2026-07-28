/**
 * Web-only slot marker. gui forwards unrecognised props to the DOM node and
 * native drops them, so this is the cross-platform way to keep the `data-slot`
 * contract that app CSS and tests select on.
 */
export const slot = (name: string) => ({ 'data-slot': name }) as object
