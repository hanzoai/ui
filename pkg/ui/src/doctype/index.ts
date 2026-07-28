// @hanzo/ui/doctype — the ONE renderer for the Hanzo Framework DocType engine.
//
// The engine (`hanzoai/cloud clients/framework`, live at `/v1/framework/*`, also
// published as github.com/hanzoai/framework) is metadata-driven: a CMS Page, an
// ERP Sales Order, a Helpdesk Ticket and a CRM Company are the same kind of thing
// — a DocType with typed fields. So they get the same renderer. An "app lane" is a
// `module` filter over the DocType registry plus its own copy; there is no
// per-lane list, form, detail or builder to drift.
//
//   import { CollectionsBrowser, DocTypeRecords, DocTypeDetail } from '@hanzo/ui/doctype'
//
// HOST-AGNOSTIC. Nothing here picks an origin, a credential or a router: the host
// injects a `FrameworkTransport` (→ `createFrameworkClient`), an optional
// `MediaStore` (→ `createMediaUploader`) and plain `onOpen`/`onCreate`/`onBack`
// callbacks. The console mounts it on its user-bearer `/v1` proxy; anything else
// mounts it elsewhere.
//
// MOBILE FIRST. The phone layout is the DEFAULT, not the fallback: the first paint
// (SSR included) is the stacked card list, and the desktop table is the
// enhancement applied once the container measures wide enough (`responsive.ts`).
// Every control meets the 44px tap floor at phone width.

// The wire contract + the pure mapping. Its own entry too (`@hanzo/ui/doctype/core`)
// so a data layer can bind the engine without loading a component tree.
export * from './core'
export * from './responsive'

// The views.
export * from './CollectionsBrowser'
export * from './DocTypeRecords'
export * from './RecordCards'
export * from './DocTypeDetail'
export * from './CollectionBuilder'
export * from './MediaGrid'

// The shared pieces, exported so a lane can build one more surface in the same
// idiom instead of inventing a second button.
export { Action, Actions, ErrorBar, Loading, Meta, Panel } from './parts'
