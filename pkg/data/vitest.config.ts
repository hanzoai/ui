import { defineConfig } from 'vitest/config'

/**
 * Unit tests run in a plain Node env. Every suite targets the package's PURE
 * logic (sort / filter / group / view state) — the modules that import only
 * `type` from the field model, so no @hanzo/gui runtime is pulled in. The view
 * components themselves are verified by the consuming app's build + visual e2e.
 */
export default defineConfig({
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
})
