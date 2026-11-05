import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/webpack.ts', 'src/vite.ts'],
  format: ['cjs', 'esm'],
  dts: false, // tsc emits these — rollup-plugin-dts cannot load on TS7,
  clean: true,
  // TypeScript is the parser, and every host that runs a build already has it.
  // Bundling a second copy into a build-time package would be absurd. The
  // TS7 API lives behind `typescript/unstable/*`, so those subpaths must be
  // external too — otherwise tsup follows them into a bundled copy.
  external: ['typescript', 'typescript/unstable/ast', 'typescript/unstable/sync', 'typescript/unstable/fs'],
  minify: false,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  tsconfig: 'tsconfig.json',
  outExtension({ format }) {
    return { js: `.${format === 'cjs' ? 'cjs' : 'mjs'}` }
  },
})
