import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/react.tsx'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: ['react'],
  minify: false,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  tsconfig: 'tsconfig.json',
  // Explicit extensions so the module format is unambiguous under
  // `"type": "module"`: CJS is `.cjs` (a `.js` here would be read as ESM and
  // crash `require()` with "exports is not defined"), ESM is `.mjs`.
  outExtension({ format }) {
    return { js: `.${format === 'cjs' ? 'cjs' : 'mjs'}` }
  },
})
