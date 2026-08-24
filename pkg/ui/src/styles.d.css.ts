/* Types for `import './styles.css'` in root.tsx.
 *
 * That stylesheet is GENERATED: scripts/gen-css.mjs renders the gallery and
 * writes dist/styles.css after tsc has run, so the specifier resolves in the
 * published package and has no file beside the source. TypeScript 5 accepted
 * the `declare module '*.css'` wildcard for it; TypeScript 7 resolves a
 * relative specifier strictly and reports the missing file instead.
 *
 * This is the form the compiler asks for — a declaration named for the file,
 * enabled by `allowArbitraryExtensions`. It states what the import yields
 * (nothing; the emit is the import itself, which is what makes a bundler pull
 * the sheet in) without putting a placeholder stylesheet in the source tree
 * that would shadow the generated one.
 */
export {}
