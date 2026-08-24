/* The three build-time constants this package reads.
 *
 * Declared narrowly rather than by pulling @types/node into a browser
 * package's type surface — the same call `@hanzo/ui` makes in `gui-env.d.ts`.
 * Every bundler substitutes these at build time, so nothing here runs on a
 * node `process`; naming them keeps the checker honest about which three exist
 * without implying the rest of node is available to a component.
 *
 * TypeScript 7 is what surfaced it: it no longer sweeps every installed @types
 * package into scope, so an ambient `process` that used to arrive by accident
 * now has to be stated.
 */
declare const process: {
  env: {
    NEXT_PUBLIC_SQUARE_APP_ID?: string
    NEXT_PUBLIC_SQUARE_LOCATION_ID?: string
    NEXT_PUBLIC_SQUARE_ENV?: string
  }
}
