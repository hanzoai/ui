import { defineConfig } from 'vitest/config'

// Nothing here touches a DOM. `prose` renders on a server pass and in a browser
// and must emit the same bytes either way, and `ProviderMark` is measured
// through `renderToStaticMarkup`, so a node environment is the honest one: a
// jsdom global would hide a dependency on `document` rather than catch it.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
