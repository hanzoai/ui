/**
 * `@hanzo/ui/framework` — the generic renderer for the Hanzo Framework DocType
 * engine (cloud `clients/framework`, /v1/framework/*).
 *
 * The engine's thesis is that a business app IS a set of DocTypes: an ERP Sales
 * Order, a CRM Deal, a CMS Page and a Helpdesk Ticket differ only in metadata.
 * This module is the other half of that thesis — ONE list, ONE detail, ONE form,
 * driven entirely by that metadata, so every lane renders with zero per-app UI.
 *
 * Three seams keep it host-agnostic:
 *   • `Transport` — how a host reaches /v1/framework (BFF proxy vs IAM bearer).
 *   • `renderBuilder` — schema AUTHORING, which only an admin surface offers.
 *   • `renderMedia` — an asset gallery, which needs the host's object store.
 * Anything a host does not supply is simply not offered; nothing is faked.
 */
export * from './types'
export * from './fields'
export * from './client'
export * from './data'
export { Loader } from './Loader'
export { CollectionsBrowser, type CollectionsBrowserProps } from './CollectionsBrowser'
export { DocTypeRecords, type DocTypeRecordsProps } from './DocTypeRecords'
export { DocTypeDetail, type DocTypeDetailProps } from './DocTypeDetail'
