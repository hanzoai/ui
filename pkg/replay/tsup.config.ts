import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: false, // tsc emits these — rollup-plugin-dts cannot load on TS7,
  clean: true,
  // rrweb is the consumer's to provide (it is large, and an app that already
  // ships a player must not end up with two copies); the sibling Hanzo packages
  // stay external for the same reason every other package here does.
  external: ['rrweb', '@rrweb/types', '@hanzo/observe', '@hanzo/event'],
  minify: false,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  tsconfig: 'tsconfig.json',
  // Explicit extensions so the module format is unambiguous under
  // `"type": "module"`: CJS is `.cjs`, ESM is `.mjs`.
  outExtension({ format }) {
    return { js: `.${format === 'cjs' ? 'cjs' : 'mjs'}` }
  },
})
