/**
 * @hanzo/next — the Next.js config every Hanzo app shares.
 *
 *   import { hanzo } from '@hanzo/next'
 *   export default hanzo(myOwnConfig, { root: import.meta.dirname })
 *
 * Not a preference: each item below is a thing that BREAKS, silently, and that
 * every app on this stack hits identically. They were found one at a time, in
 * one app, and re-deriving them per app is how a fleet drifts.
 *
 * WHAT IT ANSWERS
 *
 * 1. TypeScript 7 is a different engine with no JavaScript API. Next derives its
 *    bundler aliases by reading tsconfig `paths` THROUGH the installed
 *    typescript, so under 7 it reads nothing: every `~/…` import in a tree goes
 *    unresolvable at once, while `tsc --noEmit` stays green — tsc resolves paths
 *    itself and never asks the bundler. So a green typecheck and a dead build.
 *    The alias is declared here instead, where it does not depend on which
 *    compiler happens to be installed. (TS7 also REMOVED `baseUrl`, so the
 *    tsconfig that used to carry one is now an error.)
 *
 * 2. The typecheck runs the local `tsc` BINARY (`experimental.useTypeScriptCli`,
 *    which Next added for exactly this). The default backend calls the API TS7
 *    does not publish, so the typecheck goes quietly ABSENT — the build passes by
 *    not checking.
 *
 * 3. @hanzo/gui and its `@hanzogui/*` satellites ship ESM/TSX source, so they are
 *    transpiled. The list is DISCOVERED from node_modules, never hardcoded: a
 *    hardcoded list is wrong the day a satellite is added, and wrong quietly.
 *
 * 4. `react-native` means `react-native-web` on the web — EXACT match only, so a
 *    deep `react-native/Libraries/*` import still finds the real package, which
 *    is what its own `.web.js` files expect.
 *
 * A NOTE ON TURBOPACK. Next 16 defaults to it and these apps cannot use it yet:
 * react-native-svg imports `TurboModuleRegistry` from `react-native`, which
 * react-native-web does not export, and the alias that makes RN mean RNW is what
 * surfaces it. That is a gap in the dependency, not a config mistake. So NAME the
 * bundler at the call site (`next build --webpack`) rather than inheriting it —
 * an inherited default is how this arrives as a CI failure instead of a decision.
 */
import { readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

/** The subset of a Next config this package touches. Structural on purpose: it
 *  must not pin a `next` version to type-check, and `NextConfig` moves. */
export type Config = Record<string, unknown>

export type Options = {
  /** App root — where node_modules and src live. Almost always `import.meta.dirname`. */
  root: string
  /**
   * Source aliases. Defaults to the one every Hanzo app uses, `~` → `<root>/src`.
   * Values are resolved against `root`, so pass them relative.
   */
  alias?: Record<string, string>
  /**
   * Extra packages to transpile, ON TOP of every discovered `@hanzogui/*` and the
   * `@hanzo/*` packages that ship source. Additive — the discovered set is never
   * replaced, because replacing it is how a satellite goes missing.
   */
  transpile?: string[]
}

/** Packages that ship ESM/TSX SOURCE rather than compiled dist, so a host must
 *  transpile them. Kept here so one list serves the fleet. */
const SOURCE_PACKAGES = [
  '@hanzo/gui',
  '@hanzo/ui',
  '@hanzo/data',
  '@hanzo/dash',
  '@hanzo/canvas',
  '@hanzo/usage',
  'react-native-web',
]

/** Web builds prefer a `.web.*` implementation of a module. */
const WEB_FIRST = ['.web.tsx', '.web.ts', '.web.jsx', '.web.js']

/**
 * Every installed `@hanzogui/*`, discovered rather than declared. An absent
 * scope is not an error — an app may carry none.
 */
export function guiPackages(root: string): string[] {
  try {
    return readdirSync(join(root, 'node_modules', '@hanzogui')).map((n) => `@hanzogui/${n}`)
  } catch {
    return []
  }
}

/** The full transpile list for an app: the source packages, every installed gui
 *  satellite, and whatever else the app names. Deduped, order-stable. */
export function transpileList(root: string, extra: string[] = []): string[] {
  return [...new Set([...SOURCE_PACKAGES, ...guiPackages(root), ...extra])]
}

/**
 * Wrap an app's own Next config with the shared answers.
 *
 * The app's config WINS on every key it states — this adds, it does not overrule.
 * `webpack` is the one exception and it composes rather than replaces: the shared
 * resolution is applied first, then the app's hook runs on the result, so an app
 * can still reach the config without losing the aliases underneath it.
 */
export function hanzo(config: Config = {}, options: Options): Config {
  const { root, alias = { '~': './src' }, transpile = [] } = options
  const appWebpack = config.webpack as ((c: any, ctx: any) => any) | undefined

  const aliases = Object.fromEntries(
    Object.entries(alias).map(([from, to]) => [from, resolve(root, to)]),
  )

  return {
    ...config,
    transpilePackages: transpileList(root, [
      ...transpile,
      ...((config.transpilePackages as string[]) ?? []),
    ]),
    experimental: {
      esmExternals: true,
      // Run the local tsc BINARY. See (2) above: the default backend reads an
      // API TypeScript 7 does not publish, and a typecheck that silently does
      // not run is worse than one that fails.
      useTypeScriptCli: true,
      ...((config.experimental as Record<string, unknown>) ?? {}),
    },
    webpack(c: any, ctx: any) {
      c.resolve.alias = { ...c.resolve.alias, ...aliases, 'react-native$': 'react-native-web' }
      // Keep symlinked paths. A workspace-linked package resolved to its realpath
      // walks up into ITS OWN node_modules and loads a second copy of the gui
      // runtime — two copies, and React context identity dies at the boundary.
      c.resolve.symlinks = false
      c.resolve.extensions = [...WEB_FIRST, ...c.resolve.extensions]
      return appWebpack ? appWebpack(c, ctx) : c
    },
  }
}
