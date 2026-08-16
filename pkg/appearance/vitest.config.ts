import { defineConfig } from 'vitest/config'

/**
 * jsdom, because this package's whole job is the two things a pure function
 * cannot do: touch storage and touch the document. @hanzo/design already tests
 * the transform in plain node; what is left here is exactly the part that needs
 * a DOM to be true.
 */
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    // A real origin, because storage is scoped to one. jsdom defaults to
    // about:blank, which is an OPAQUE origin and therefore has no localStorage
    // at all — so the module whose job is storage had no storage to test
    // against, and the suite quietly covered only the parts that fake it.
    environmentOptions: { jsdom: { url: 'https://hanzo.ai' } },
  },
})
