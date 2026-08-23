/**
 * @hanzo/events — the canonical event schema.
 *
 * Which events exist, what each one means, and what it carries. This is the
 * vocabulary; @hanzo/event is the client that sends one.
 *
 * Plural and singular split along the thing they describe: many events are
 * defined here, one event is sent by a call there. The client depends on this
 * package and re-exports EVENTS, so a surface can keep importing either — but
 * there is only one definition, here.
 *
 * The catalog also ships as `catalog.json` beside the built output, because the
 * ingest endpoint is Go and cannot import TypeScript. One source, two readers.
 */

export { EVENTS, PAGEVIEW, EXCEPTION } from './names.js'
export type { EventName } from './names.js'

export { SCHEMA } from './schema.js'
export type { EventSpec, PropSpec, PropType } from './schema.js'

export { FUNNELS, PRODUCTS, eventsOf } from './funnels.js'
export type { FunnelDef, FunnelStep, FunnelId, ProductId } from './funnels.js'

import { EVENTS, PAGEVIEW, EXCEPTION } from './names.js'
import { SCHEMA } from './schema.js'

/** Every event name in the vocabulary, as it travels on the wire. */
export const NAMES: readonly string[] = Object.freeze(Object.values(EVENTS))

/** The two reserved names: a pageview and a captured exception. */
export const RESERVED: readonly string[] = Object.freeze([PAGEVIEW, EXCEPTION])

/**
 * Is this a name the vocabulary knows?
 *
 * The ingest endpoint RECORDS an unknown event rather than refusing it, and flags
 * it. Refusing would mean a surface shipping a new event before the catalog
 * does loses the data outright, and the data is the thing you cannot recover;
 * a flag you can act on later. So this answers a question about the catalog,
 * never about whether to accept.
 */
export function isKnown(name: string): boolean {
  return name in SCHEMA || (RESERVED as string[]).includes(name)
}

/** What an event means and carries, or undefined if it is not in the catalog. */
export function specFor(name: string) {
  return SCHEMA[name]
}
