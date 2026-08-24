import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/react.tsx'],
  format: ['cjs', 'esm'],
  dts: false, // tsc emits these — rollup-plugin-dts cannot load on TS7,
  clean: true,
  // react + the sibling pipe stay external; consumers provide them.
  external: ['react', '@hanzo/event', '@hanzo/event/react'],
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
