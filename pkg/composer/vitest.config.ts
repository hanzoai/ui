import { defineConfig } from 'vitest/config'

import { alias } from '../ui/scripts/alias.mjs'

/**
 * Node: the components render to a string under the real GuiProvider, and the
 * string is what a static export ships. Same resolution @hanzo/ui's suites use,
 * so @hanzo/gui is one module instance here too.
 */
export default defineConfig({
  css: { postcss: { plugins: [] } },
  resolve: { alias },
  test: {
    environment: 'node',
    testTimeout: 60_000,
    include: ['src/**/*.test.tsx'],
    server: { deps: { inline: [/@hanzogui\//, /@hanzo\/gui/, /react-native/] } },
  },
})
