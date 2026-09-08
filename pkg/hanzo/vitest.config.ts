import { createRequire } from 'node:module'
import { defineConfig } from 'vitest/config'

const need = createRequire(import.meta.url)

/**
 * The loaders reach the real libraries, and those render through
 * react-native-web on this platform. Node cannot parse react-native's own Flow
 * entry, so the substitution belongs here, where it applies to whatever the
 * install happens to link — this package's devDependencies alias both
 * names to their web builds, and resolving them from here hands the libraries
 * the same substitution.
 */
export default defineConfig({
  resolve: {
    alias: [
      { find: /^react-native-svg$/, replacement: need.resolve('react-native-svg') },
      { find: /^react-native$/, replacement: need.resolve('react-native') },
    ],
  },
  test: { server: { deps: { inline: [/@hanzo\//, /@hanzogui\//] } } },
})
