import { defineConfig } from 'vitest/config'

/**
 * Unit tests run in a plain Node env. Every suite targets the package's PURE
 * logic (drag-reorder math, combobox option filtering) — the modules that import
 * no @hanzo/gui runtime. The view components themselves are verified by the
 * consuming app's build + visual e2e.
 */
export default defineConfig({
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
})
