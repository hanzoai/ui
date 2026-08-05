import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // The privacy gate reads the live DOM; happy-dom gives us window/document.
    environment: 'happy-dom',
    include: ['src/**/*.test.ts'],
  },
})
