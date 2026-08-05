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
]
