// @hanzo/ui/doctype/core — the CONTRACT half of the DocType layer, component-free.
//
// The wire types, the engine client, the metadata↔render mapping, the builder
// projection, and the media/object-store model. It imports NO React and NO
// @hanzo/gui, and its only @hanzo/data references are `import type` (erased at
// build) — so a host's data layer, a server route, or a plain node test can bind
// the engine WITHOUT loading a component tree.
//
//   import { createFrameworkClient } from '@hanzo/ui/doctype/core'   // transport
//   import { CollectionsBrowser }    from '@hanzo/ui/doctype'        // + the views
//
// Two entries because they are two different things, not two ways to the same
// thing: `@hanzo/ui/doctype` re-exports everything here, so a UI host imports one
// module and nothing is duplicated.
export * from './types'
export * from './client'
export * from './fields'
export * from './builder-logic'
export * from './media'
export * from './data'
