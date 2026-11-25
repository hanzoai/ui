/**
 * Emit catalog.json — the same catalog, for a reader that is not TypeScript.
 *
 * The ingest endpoint and the funnel lens are Go. They need to answer "is this name
 * in the vocabulary" and "what are this funnel's steps" without a second copy of
 * either, so the build writes the data out once and Go reads that. Generated,
 * never edited.
 */
import { writeFileSync } from 'node:fs'
import { SCHEMA, NAMES, RESERVED, FUNNELS, PRODUCTS, PLATFORMS } from '../dist/index.js'

const mapRows = (obj) =>
  '{\n' +
  Object.entries(obj)
    .map(([k, v]) => `    ${JSON.stringify(k)}: ${JSON.stringify(v)}`)
    .join(',\n') +
  '\n  }'

const body = [
  '{',
  `  "version": 3,`,
  `  "names": ${JSON.stringify(NAMES)},`,
  `  "reserved": ${JSON.stringify(RESERVED)},`,
  `  "schema": ${mapRows(SCHEMA)},`,
  `  "platforms": ${mapRows(PLATFORMS)},`,
  `  "products": ${JSON.stringify(PRODUCTS)},`,
  `  "funnels": ${mapRows(FUNNELS)}`,
  '}',
  '',
].join('\n')

writeFileSync(new URL('../dist/catalog.json', import.meta.url), body)
console.log(
  `catalog.json — ${NAMES.length} events, ${RESERVED.length} reserved, ${Object.keys(FUNNELS).length} funnels`,
)
