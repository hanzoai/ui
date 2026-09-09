/**
 * Emit catalog.json — the same catalog, for a reader that is not TypeScript.
 *
 * The ingest endpoint and the funnel lens are Go. They need to answer "is this name
 * in the vocabulary" and "what are this funnel's steps" without a second copy of
 * either, so the build writes the data out once and Go reads that. Generated,
 * never edited.
 */
import { writeFileSync } from 'node:fs'
import { SCHEMA, NAMES, RESERVED, FUNNELS, PRODUCTS } from '../dist/index.js'

writeFileSync(
  new URL('../dist/catalog.json', import.meta.url),
  JSON.stringify(
    { version: 2, names: NAMES, reserved: RESERVED, schema: SCHEMA, products: PRODUCTS, funnels: FUNNELS },
    null,
    2,
  ) + '\n',
)
console.log(
  `catalog.json — ${NAMES.length} events, ${RESERVED.length} reserved, ${Object.keys(FUNNELS).length} funnels`,
)
