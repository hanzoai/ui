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
  outExtension({ format }) {
    return { js: `.${format === 'cjs' ? 'js' : 'mjs'}` }
  },
})
