/* The catalog snapshot is a data artifact, not a type source.
 *
 * `src/snapshot.ts` imports `../snapshot/catalog.json`, which is published as
 * `@hanzo/products/snapshot` and inlined into the bundle by tsup's json loader.
 * With `resolveJsonModule`, that import made the JSON a root file of the
 * program, so tsc's inferred root spanned the whole package and every
 * declaration landed at `dist/src/index.d.ts` — one directory below where
 * `exports` promises it, which resolves to no types at all for a consumer.
 *
 * Declaring the module keeps the file out of the root set, so `rootDir: src`
 * holds and declarations emit at `dist/`. Nothing is lost by typing it
 * `unknown`: the one reader casts through `unknown` to `CatalogEntry[]` anyway,
 * because a 103-entry literal type is not the contract this package publishes.
 */
declare module '*.json' {
  const value: unknown
  export default value
}
