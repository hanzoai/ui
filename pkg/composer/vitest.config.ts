import { defineConfig } from 'vitest/config'

/** Node: the subject is a stylesheet read off disk, and asserting against the
 *  source is what makes a rule about the source able to fail. */
export default defineConfig({
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
})
