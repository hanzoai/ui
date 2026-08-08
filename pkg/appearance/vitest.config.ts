import { defineConfig } from 'vitest/config'

/**
 * jsdom, because this package's whole job is the two things a pure function
 * cannot do: touch storage and touch the document. @hanzo/design already tests
 * the transform in plain node; what is left here is exactly the part that needs
 * a DOM to be true.
 */
export default defineConfig({
  test: { environment: 'jsdom', include: ['src/**/*.test.ts'] },
})
