import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@hanzo/canvas/pure': fileURLToPath(new URL('../canvas/src/pure.ts', import.meta.url)),
    },
  },
  test: {
    // happy-dom for the presentational render tests; pure folds are DOM-free but
    // run fine under it too, so one environment covers the whole suite.
    environment: 'happy-dom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
