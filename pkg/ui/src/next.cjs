// @hanzo/ui on the web, for BOTH of Next's bundlers.
//
//   const { withGui } = require('@hanzo/ui/next')
//   module.exports = withGui(nextConfig)
//
// Every component here renders through @hanzo/gui, which is cross-platform: its
// dependency graph names `react-native`, and one of those — react-native-svg,
// under the icon set — reaches real React Native source. That source is Flow,
// not TypeScript, so a web build does not fail to RESOLVE it, it fails to PARSE
// it:
//
//     Parsing ecmascript source code failed
//     import type {HostComponent} from '../../src/private/types/HostComponent';
//
// which reads as a broken dependency rather than a missing alias. `react-native`
// on the web IS `react-native-web`; saying so is the whole fix.
//
// Declared for both bundlers together, in one file, because that is the failure
// this replaces: a webpack-only alias is silently absent under Turbopack, so
// `next dev` and `next build` disagree about whether the app compiles.
//
// Node-only (a build-time module) and dependency-free: it takes and returns a
// plain object, so it does not force `next` into anyone's type graph.

/**
 * react-native's web spelling, and the asset registry that ships beside it.
 *
 * The registry is named separately because it is the one module react-native-web
 * does not re-export under the same path — an `Image` reaches for
 * `@react-native/assets-registry/registry` and finds nothing.
 */
const ALIAS = {
  'react-native': 'react-native-web',
  '@react-native/assets-registry/registry': 'react-native-web/dist/modules/AssetRegistry',
}

/**
 * `.web.tsx` before `.tsx`, so a package shipping both halves resolves to the
 * web one. Without it the native file wins by being listed first, and the
 * failure is again a parse error inside a dependency.
 */
const EXTENSIONS = ['.web.tsx', '.web.ts', '.web.jsx', '.web.js']

/** Webpack's half. */
function webpackGui(config) {
  config.resolve = config.resolve || {}
  config.resolve.alias = { ...config.resolve.alias, ...ALIAS }
  const had = config.resolve.extensions || ['.tsx', '.ts', '.jsx', '.js']
  config.resolve.extensions = [...EXTENSIONS, ...had.filter((e) => !EXTENSIONS.includes(e))]
  return config
}

/**
 * Wrap a Next config so @hanzo/ui builds on the web.
 *
 * Composes with an existing `webpack()` hook rather than replacing it: a caller
 * who already has one keeps it, and this runs after.
 */
function withGui(nextConfig = {}) {
  const theirs = nextConfig.webpack
  return {
    ...nextConfig,
    turbopack: {
      ...nextConfig.turbopack,
      resolveAlias: { ...(nextConfig.turbopack && nextConfig.turbopack.resolveAlias), ...ALIAS },
      resolveExtensions: [
        ...EXTENSIONS,
        ...((nextConfig.turbopack && nextConfig.turbopack.resolveExtensions) || [
          '.tsx', '.ts', '.jsx', '.js', '.mjs', '.json',
        ]),
      ],
    },
    webpack(config, options) {
      return webpackGui(theirs ? theirs(config, options) : config)
    },
  }
}

module.exports = withGui
module.exports.withGui = withGui
module.exports.GUI_ALIAS = ALIAS
