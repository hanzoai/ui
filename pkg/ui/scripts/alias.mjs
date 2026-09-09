// The two resolutions @hanzo/gui needs on a non-browser target, in one place.
// vitest.config.ts and scripts/gen-css.mjs both read it, because a rule that
// differs between the suite and the generator is a rule that lies.
export const alias = [
  // The gui icon set pulls react-native-svg, whose CommonJS build re-requires
  // ESM and crashes under Node. Markup is what these renders produce.
  {
    find: /^react-native-svg(\/.*)?$/,
    replacement: new URL('../test/react-native-svg.stub.ts', import.meta.url).pathname,
  },
  { find: /^react-native$/, replacement: 'react-native-web' },
  // react-native-web reaches its style prefixer by DEEP CJS PATH
  // (`inline-style-prefixer/lib/createPrefixer`, and that file's own
  // `css-in-js-utils/lib/isPrefixedValue`). Vite's SSR runner evaluates a
  // CommonJS file as ESM, where `export default` is not the callable the caller
  // asked for -- it fails inside the prefixer rather than at the import, so the
  // stack names react-native-web and not the module that is actually wrong.
  // Both packages ship the same modules as ESM under `es/`; naming those makes
  // the import mean what it says. Externalising them does not work: vite 8 runs
  // them through `runInlinedModule` regardless of `ssr.external`.
  {
    find: /^(inline-style-prefixer|css-in-js-utils)\/lib\/(.*)$/,
    replacement: '$1/es/$2',
  },
  // `root.tsx` imports the sheet `scripts/gen-css.mjs` writes into `dist` at
  // publish time. It resolves for a consumer and not from `src`, so anything
  // that imports the root off source — the suite, the generator — needs this.
  {
    find: /^\.\/styles\.css$/,
    replacement: new URL('../test/styles.stub.ts', import.meta.url).pathname,
  },
]
