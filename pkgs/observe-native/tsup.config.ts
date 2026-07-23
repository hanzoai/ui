import { defineConfig } from 'tsup'

export default defineConfig({
  // '.' carries the React/Tamagui bindings; './tauri' is the react-free desktop
  // bridge (a vanilla Tauri app imports it without pulling React).
  entry: ['src/index.ts', 'src/tauri.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: ['react', 'react-native', '@tamagui/core', 'tamagui', '@hanzo/observe', '@hanzo/event'],
  minify: false,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  tsconfig: 'tsconfig.json',
  outExtension({ format }) {
    return { js: `.${format === 'cjs' ? 'cjs' : 'mjs'}` }
  },
})
