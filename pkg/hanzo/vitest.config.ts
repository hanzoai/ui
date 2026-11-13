import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { defineConfig } from 'vitest/config'

const need = createRequire(import.meta.url)

/**
 * The loaders reach the real libraries, and those render through
 * react-native-web on this platform. Node cannot parse react-native's own Flow
 * entry, so the substitution belongs here, where it applies to whatever the
 * install happens to link — this package's devDependencies alias both
 * names to their web builds, and resolving them from here hands the libraries
 * the same substitution.
 *
 * react-native-svg's native entry reaches `react-native/Libraries/...` (Flow),
 * which node resolves past react-native-web to a hoisted real react-native. Its
 * web entry, with `.web.js` tried first, stays on the web build throughout.
 */
export default defineConfig({
  resolve: {
    extensions: ['.web.js', '.web.mjs', '.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
    alias: [
      { find: /^react-native-svg$/, replacement: join(dirname(need.resolve('react-native-svg/package.json')), 'lib/module/ReactNativeSVG.web.js') },
      { find: /^react-native$/, replacement: need.resolve('react-native') },
    ],
  },
  test: { server: { deps: { inline: [/@hanzo\//, /@hanzogui\//] } } },
})
