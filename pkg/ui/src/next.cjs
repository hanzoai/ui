// @hanzo/ui on the web, for BOTH of Next's bundlers.
//
//   const withGui = require('@hanzo/ui/next')
//   module.exports = withGui(nextConfig, __dirname)
//
// Every component here renders through @hanzo/gui, which is cross-platform: its
// dependency graph names `react-native`, and one of those — react-native-svg,
// under the icon set — ships a native entry beside a `.web.js` sibling. Pick the
// native one on a web build and it is not a resolution failure, it is a PARSE
// failure, in Flow source, inside a dependency:
//
//     Parsing ecmascript source code failed
//     import type {HostComponent} from '.../HostComponent';
//
// which reads as a broken package rather than a missing setting. Three settings
// prevent it, and all three are needed:
//
//   1. `.web.*` resolves FIRST, so the web sibling wins.
//   2. `react-native` IS `react-native-web` here.
//   3. the gui graph is TRANSPILED, or a bundler treats those packages as opaque
//      and never applies 1 or 2 inside them.
//
// Declared for both bundlers together, in one file, because that is the failure
// this replaces: a webpack-only setting is silently absent under Turbopack, so
// `next dev` and `next build` disagree about whether the app compiles.
//
// Node-only (a build-time module) and dependency-free: it takes and returns a
// plain object, so it does not force `next` into anyone's type graph.

const { readdirSync } = require('node:fs')
const { join } = require('node:path')

/**
 * react-native's web spelling, and the asset registry that ships beside it.
 *
 * The registry is named separately because it is the one module react-native-web
 * does not answer to under the same path — an `Image` reaches for
 * `@react-native/assets-registry/registry` and finds nothing.
 */
const ALIAS = {
  'react-native': 'react-native-web',
  '@react-native/assets-registry/registry': 'react-native-web/dist/modules/AssetRegistry',
}

/** `.web.tsx` before `.tsx`. See (1) above. */
const EXTENSIONS = ['.web.tsx', '.web.ts', '.web.jsx', '.web.js']

/**
 * Every installed `@hanzogui/*`, DISCOVERED rather than listed.
 *
 * The gui runtime is ~60 packages and the set moves; a hardcoded list is a list
 * that goes stale, and the symptom of a missing one is the parse error above
 * rather than anything naming the package.
 */
function guiPackages(dir) {
  for (const base of [dir, process.cwd()]) {
    if (!base) continue
    try {
      return readdirSync(join(base, 'node_modules', '@hanzogui')).map((n) => `@hanzogui/${n}`)
    } catch {
      /* not installed here — try the next place */
    }
  }
  return []
}

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
 * `dir` is the app's own directory — pass `__dirname`. The `process.cwd()`
 * fallback is a courtesy: a task runner invoking Next from a workspace root
 * would look for `@hanzogui/*` where there is none and silently transpile
 * nothing.
 *
 * Composes rather than replaces: an existing `webpack()` hook, `turbopack`
 * settings and `transpilePackages` are all kept and extended.
 */
function withGui(nextConfig = {}, dir = process.cwd()) {
  const theirs = nextConfig.webpack
  const transpile = new Set([
    ...(nextConfig.transpilePackages || []),
    '@hanzo/gui',
    '@hanzo/ui',
    'react-native-web',
    ...guiPackages(dir),
  ])
  const turbo = nextConfig.turbopack || {}
  return {
    ...nextConfig,
    transpilePackages: [...transpile],
    turbopack: {
      ...turbo,
      resolveAlias: { ...turbo.resolveAlias, ...ALIAS },
      resolveExtensions: [
        ...EXTENSIONS,
        ...(turbo.resolveExtensions || ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.json']),
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
