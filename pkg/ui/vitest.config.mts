import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['primitives/**/*.tsx', 'blocks/**/*.tsx', 'components/**/*.tsx'],
      exclude: ['**/*.test.tsx', '**/__tests__/**']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  }
})
