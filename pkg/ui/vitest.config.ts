import { defineConfig } from 'vitest/config'

/**
 * Two kinds of suite, one runner.
 *
 * `*.test.ts`   — pure logic (drag-reorder math, combobox filtering, resize
 *                 arithmetic). Plain Node, no @hanzo/gui runtime.
 * `*.test.tsx`  — the components actually MOUNT, under the real GuiProvider and
 *                 the shipped config, in jsdom (`@vitest-environment jsdom` at
 *                 the top of the file). A build and a typecheck both pass on a
 *                 component that throws on first paint; this does not.
 */
export default defineConfig({
  // These suites import no CSS, so keep vite from searching for (and failing on)
  // the repo-root PostCSS config.
  css: { postcss: { plugins: [] } },
  resolve: {
    alias: [
      // The gui icon set pulls react-native-svg, whose CommonJS build re-requires
      // ESM and crashes under Node. Markup is what these suites assert.
      { find: /^react-native-svg(\/.*)?$/, replacement: new URL('./test/react-native-svg.stub.ts', import.meta.url).pathname },
      { find: /^react-native$/, replacement: 'react-native-web' },
    ],
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    setupFiles: ['./vitest.setup.ts'],
    // Aliases only reach source that vite transforms, and these deps are shipped
    // as CommonJS that re-requires ESM — Node cannot load them raw.
    //
    // `@hanzo/gui` belongs on this list even though it loads fine on its own: it
    // re-exports the same `@hanzogui/*` modules. Inlined, those resolve through
    // each package's `source` field to `src`; external, `@hanzo/gui` resolves
    // them to `dist`. Leaving it off gave the theme TWO module instances — the
    // provider wrote one, every themed icon read the other, and the icon threw
    // `Missing theme`. One entry here is the whole fix.
    server: { deps: { inline: [/@hanzogui\//, /@hanzo\/gui/, /react-native/] } },
  },
})
