import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    // Main entry point
    'index': 'primitives/index-next.ts',

    // Essential utilities
    'src/utils': 'src/utils.ts',
    'lib/utils': 'src/utils.ts',

    // Core types
    'types/index': 'types/index.ts',

    // Tailwind configuration
    'tailwind/index': 'tailwind/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: false,
  external: [
    // Everything is external except what we're building
    /^(?!\.)/,  // Any import that doesn't start with '.'
  ],
  noExternal: [
    // Only bundle local relative imports
    /^\./,
  ],
  splitting: false,
  clean: true,
  target: 'es2020',
  outDir: 'dist',
  treeshake: false,
  minify: false,
  esbuildOptions(options) {
    options.jsx = 'automatic'
    options.platform = 'neutral'
    options.keepNames = true
  },
})