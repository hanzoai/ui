/**
 * Emit catalog.json — the same catalog, for a reader that is not TypeScript.
 *
 * The ingest door is Go. It needs to answer "is this name in the vocabulary"
 * without a second copy of the vocabulary, so the build writes the data out
 * once and Go reads that. Generated, never edited.
 */
import { writeFileSync } from 'node:fs'
import { SCHEMA, NAMES, RESERVED } from '../dist/index.js'

writeFileSync(
  new URL('../dist/catalog.json', import.meta.url),
  JSON.stringify({ version: 1, names: NAMES, reserved: RESERVED, schema: SCHEMA }, null, 2) + '\n',
)
console.log(`catalog.json — ${NAMES.length} events, ${RESERVED.length} reserved`)
