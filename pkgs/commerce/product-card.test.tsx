/**
 * Annotation contract test for @hanzo/commerce ProductCard + AddToCartWidget.
 *
 * Proves the zero-app-config promise: rendering <ProductCard item={...}/> emits
 * NEUTRAL, STANDARD self-description — schema.org Product/Offer microdata plus a
 * schema.org AddAction on the add control — with no analytics code in the app.
 * A tracker (track.js `annotate`, GA4 Merchant, any reader) captures the item
 * and the add-to-cart intent from the DOM alone.
 *
 * Self-contained, mirroring metering.test.ts: no test-runner dependency. Run with:
 *
 *   npx -y tsx pkgs/commerce/product-card.test.tsx
 */

import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import ProductCard from './components/item/product-card'

// ---- tiny assert harness (mirrors metering.test.ts) ----
let failures = 0
let count = 0
function test(name: string, fn: () => void) {
  count++
  try {
    fn()
    console.log(`ok   - ${name}`)
  } catch (err) {
    failures++
    console.error(`FAIL - ${name}`)
    console.error((err as Error).message)
  }
}
function ok(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

// A minimal LineItem-shaped mock: getters + cart methods, no media (MediaStack
// renders empty). Enough to drive the microdata the card carries.
const item: any = {
  id: 'x1',
  sku: 'LXB-AU-B',
  familyId: 'LXB',
  familyTitle: 'Bar',
  optionLabel: '1oz',
  price: 99.5,
  get title() {
    return 'Gold Bar, 1oz'
  },
  get quantity() {
    return 0
  },
  get isInCart() {
    return false
  },
  increment() {},
  decrement() {},
}

const html = renderToStaticMarkup(<ProductCard item={item} />)

// Attribute names are matched case-insensitively: HTML parsing and setAttribute
// both lowercase attribute names in the HTML namespace, so React's camelCase SSR
// serialization (itemType="…") becomes itemtype in the live DOM that annotate
// queries. The DOM-capture contract is proven end-to-end in track.js's tests.
const H = html.toLowerCase()
const has = (needle: string) => H.includes(needle.toLowerCase())

test('card is a schema.org Product', () => {
  ok(has('itemtype="https://schema.org/Product"'), 'Product itemtype present')
  ok(has('data-slot="card"'), 'shadcn data-slot preserved')
})

test('product name is machine-readable', () => {
  ok(has('itemprop="name"'), 'name itemprop present')
  ok(has('content="Gold Bar, 1oz"'), 'name value present')
})

test('product sku is machine-readable', () => {
  ok(has('itemprop="sku"'), 'sku itemprop present')
  ok(has('content="LXB-AU-B"'), 'sku value present')
})

test('price is a schema.org Offer with currency', () => {
  ok(has('itemtype="https://schema.org/Offer"'), 'Offer itemtype present')
  ok(has('itemprop="price"'), 'price itemprop present')
  ok(has('content="99.5"'), 'raw price value present')
  ok(has('itemprop="priceCurrency"'), 'priceCurrency itemprop present')
  ok(has('content="USD"'), 'currency value present')
})

test('add control is a schema.org AddAction (maps to GA4 add_to_cart)', () => {
  ok(has('itemtype="https://schema.org/AddAction"'), 'AddAction itemtype present')
  ok(has('itemprop="potentialAction"'), 'action linked to the Product')
})

// summary
setTimeout(() => {
  if (failures > 0) {
    console.error(`\n${failures}/${count} tests FAILED`)
    process.exit(1)
  }
  console.log(`\nall ${count} tests passed`)
}, 200)
