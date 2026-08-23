/**
 * The vocabulary, re-exported from where it is now defined.
 *
 * These names used to be declared here. They moved to @hanzo/events — the
 * plural package is the catalog (many events, what each means, what each
 * carries), this one is the client (one call sends one event). Splitting them
 * that way is what lets the ingest endpoint read the same catalog: it is Go
 * and cannot import TypeScript, so @hanzo/events also ships the data as JSON,
 * and there is still exactly one definition.
 *
 * Nothing about the API moved. Every existing import keeps working, the names
 * and their values are unchanged, and `pkgs/events/test/catalog.mjs` fails the
 * build if a name and its meaning ever disagree.
 *
 * The naming convention lives with the names, in @hanzo/events and TAXONOMY.md:
 * snake_case `<object>_<verb-past>`, a dimension is a PROPERTY and never part
 * of the name, one name per user-visible moment shared by every surface.
 */

export { EVENTS, PAGEVIEW, EXCEPTION } from '@hanzo/events'
export type { EventName } from '@hanzo/events'
