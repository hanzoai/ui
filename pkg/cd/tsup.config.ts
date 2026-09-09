import { defineConfig } from 'tsup'

// @hanzo/canvas is a real runtime dependency and stays external — the pure
// subpath (@hanzo/canvas/pure) is React-free (layoutGraph + status/time/color
// helpers). Its types resolve during the dts pass via the tsconfig `paths` map
// to the sibling workspace source, so no published artifact is required to build.
export default defineConfig({
  entry: ['src/index.ts', 'src/pure.ts'],
  format: ['cjs', 'esm'],
  dts: false, // tsc emits these — rollup-plugin-dts cannot load on TS7,
  clean: true,
  external: ['react', 'react-dom', '@hanzo/canvas', '@hanzo/canvas/pure'],
  minify: false,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  tsconfig: 'tsconfig.json',
  outExtension({ format }) {
    return { js: `.${format === 'cjs' ? 'js' : 'mjs'}` }
  },
})
