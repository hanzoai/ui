import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/webpack.ts', 'src/vite.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  // TypeScript is the parser, and every host that runs a build already has it.
  // Bundling a second copy into a build-time package would be absurd.
  external: ['typescript'],
  minify: false,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  tsconfig: 'tsconfig.json',
  outExtension({ format }) {
    return { js: `.${format === 'cjs' ? 'cjs' : 'mjs'}` }
  },
})
