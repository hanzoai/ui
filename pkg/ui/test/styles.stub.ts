/**
 * `src/root.tsx` imports `./styles.css`, which does not exist in `src`: it is
 * written into `dist` at publish time by `scripts/gen-css.mjs`, which renders
 * the gallery and harvests the atomic CSS that render produces. The specifier
 * resolves for a consumer and not from source, so importing `root.tsx` off
 * `src` — the suite, the generator — failed on resolution alone.
 *
 * A JS module, not an empty stylesheet, and that is the whole point: `<Hanzo>`
 * asserts in development that the sheet reached the document, and it treats a
 * document with NO stylesheets as jsdom and stays quiet. Standing in with real
 * CSS puts a sheet there, which trips that check for a reason no suite is
 * testing — and jsdom does not resolve custom properties from a stylesheet, so
 * no stub CSS can satisfy it either.
 *
 * Computed styles are asserted where they can be: `test/consumer.spec.ts`
 * builds the package, serves it, and reads the real sheet in a browser.
 */
export {}
