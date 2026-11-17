import { defineConfig } from 'vitest/config'

/**
 * The CRM's logic, in plain Node: Base's field and value mapping, the view
 * queries, CSV and import plans, the objects and their starter views, and the
 * mail and suppression reads over a host's REST. No suite here mounts a screen.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
