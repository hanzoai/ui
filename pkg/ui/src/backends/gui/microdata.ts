/**
 * The schema.org attributes, for the components that carry a described thing.
 *
 * A product card and its buy button are part of one Product in the markup, and
 * that markup is what a search engine and a merchant feed read the price and
 * availability out of. Dropping these loses the listing, not an attribute.
 *
 * They already REACHED the element — every unrecognised prop is spread onto the
 * gui frame, which forwards it — but the frame's props come from the
 * cross-platform stack and name no DOM attribute. A spread carries an unknown
 * property silently; a written-out one is excess-property-checked. So
 * `<Card itemScope>` was an error on markup that works, and the workaround at
 * the call site is to re-declare the component as `any`, which hides every real
 * error in the file along with this one.
 *
 * Declared because it is true on web and harmless elsewhere: native ignores an
 * attribute it does not know.
 */
export type Microdata = {
  itemProp?: string
  itemScope?: boolean
  itemType?: string
}
