import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Pure text-in/text-out: no DOM, no globals, nothing to set up.
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
