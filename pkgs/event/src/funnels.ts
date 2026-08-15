/**
 * The funnel registry, re-exported from where it is now defined.
 *
 * The funnels moved to @hanzo/events for the reason the names did: the read lens
 * is Go and cannot import TypeScript, and that package already writes its data
 * out as JSON. Defining a funnel beside the vocabulary also makes the anti-drift
 * check local — a step naming an event that does not exist is caught where both
 * are declared.
 *
 * Nothing about the API moved. Every existing import keeps working.
 */

export { FUNNELS, PRODUCTS, eventsOf } from '@hanzo/events'
export type { FunnelDef, FunnelStep, FunnelId, ProductId } from '@hanzo/events'
