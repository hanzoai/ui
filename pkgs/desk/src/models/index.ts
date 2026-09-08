// A model's name, and the lab behind it.
//
// `@hanzo/ai` answers WHICH models exist. This answers what one of their names
// means and how the lab that made it is drawn — two questions with no network
// between them, so they are a table and a component rather than a client.
//
// Complementary to `@hanzo/ui/models`, which groups a fetched catalog into
// families for a picker. Family is a display grouping over a list; org is the
// namespace an id carries. A model has both and they are not the same string.

// The `.js` on every relative specifier is load-bearing. `moduleResolution:
// bundler` typechecks an extensionless one and emits it verbatim, and Node's
// ESM resolver then refuses the built file — so the package builds, ships, and
// throws ERR_MODULE_NOT_FOUND on the first server render. TypeScript resolves
// `./id.js` to `./id.ts` and emits what Node can load.

export { canonicalOrg, getOrgAndSlug, orgDisplayName } from './id.js'
export { ProviderMark } from './ProviderMark.js'
