/**
 * @hanzo/vite — the Vite config every Hanzo app shares.
 *
 *   import { hanzo } from '@hanzo/vite'
 *   export default hanzo(myOwnConfig, { root: import.meta.dirname })
 *
 * The @hanzo/next twin, for the apps that are not Next. Same four answers,
 * because the problems belong to the STACK, not to the bundler:
 *
 * 1. `~/…` is this app's own source. Vite reads no tsconfig `paths` of its own
 *    (that needs a plugin), so declaring it here means one answer whether the
 *    host is Next, Vite, or vitest — and it stops depending on which TypeScript
 *    is installed, which under 7 answers nothing at all.
 *
 * 2. `react-native` means `react-native-web` on the web, EXACT match only, so a
 *    deep `react-native/Libraries/*` import still finds the real package. Vite's
 *    alias array takes a RegExp for that; the bare-string form is a prefix match
 *    and would rewrite the deep imports too.
 *
 * 3. `.web.*` first, so a package's web implementation wins over its native one.
 *
 * 4. ONE copy of the gui runtime. `dedupe` names the packages whose identity is
 *    load-bearing: two copies of a React context provider are two contexts, and
 *    the failure is not a crash — it is a component that renders unstyled, or a
 *    hook that reads a default nobody set.
 *
 * `preserveSymlinks: false` is Vite's default and is CORRECT here, unlike the
 * webpack side: Vite dedupes by resolved id, so `dedupe` does the work that
 * keeping symlinks does under webpack. One runtime either way, two mechanisms —
 * because the bundlers genuinely differ, not because we changed our minds.
 */
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'

const need = createRequire(import.meta.url)

/** The subset of a Vite config this package touches. Structural on purpose: it
 *  must not pin a `vite` version to type-check. */
export type Config = Record<string, unknown>

export type Options = {
  /** App root — where src lives. Almost always `import.meta.dirname`. */
  root: string
  /** Source aliases, resolved against `root`. Defaults to `~` → `<root>/src`. */
  alias?: Record<string, string>
  /** Extra packages to force to a single copy, on top of the runtime family. */
  dedupe?: string[]
}

/** Packages whose identity is load-bearing: a second copy breaks context. */
const RUNTIME = ['react', 'react-dom', 'react-native-web', '@hanzo/gui', '@hanzo/ui']

const WEB_FIRST = ['.web.tsx', '.web.ts', '.web.jsx', '.web.js']
const DEFAULT_EXT = ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json']

/**
 * Wrap an app's own Vite config with the shared answers.
 *
 * The app WINS on every key it states; `resolve` is merged rather than replaced,
 * and the app's own aliases come FIRST so it can override one of ours.
 */
export function hanzo(config: Config = {}, options: Options): Config {
  const { root, alias = { '~': './src' }, dedupe = [] } = options
  const appResolve = (config.resolve as Record<string, any>) ?? {}

  // Vite matches an alias array in order and a RegExp entry exactly, which is
  // what keeps `react-native/Libraries/*` resolving to the real package.
  const aliases = [
    ...(Array.isArray(appResolve.alias) ? appResolve.alias : []),
    ...Object.entries(alias).map(([find, to]) => ({ find, replacement: resolve(root, to) })),
    { find: /^react-native$/, replacement: 'react-native-web' },
    // The asset registry is react-native's, and react-native-web reimplements it
    // with the same `getAssetByID`. react-native-svg's web build reaches for the
    // native one by name, so without this the bundle resolves nothing and the
    // build fails — an icon is enough to trigger it, which is every product
    // component that carries one.
    {
      find: /^@react-native\/assets-registry\/registry$/,
      replacement: 'react-native-web/dist/modules/AssetRegistry',
    },
    // The source runtime is this package's dependency, not the app's, and an
    // isolated node_modules does not let the app see it. Naming the resolved
    // copy here is what keeps an app on `hanzo()` free of configuration.
    { find: /^@hanzo\/source\/(.+)$/, replacement: `${dirname(need.resolve('@hanzo/source/package.json'))}/dist/$1.js` },
  ]

  const appBuild = (config.build as Record<string, unknown>) ?? {}
  const appPlugins = Array.isArray(config.plugins) ? (config.plugins as unknown[]) : []

  return {
    ...config,
    // A production bundle names the source it came from. A stack trace, an
    // error report and an edit widget all read that map; without it every one
    // of them points at a minified line.
    build: { sourcemap: true, ...appBuild },
    plugins: [...appPlugins, source(root)],
    resolve: {
      ...appResolve,
      alias: aliases,
      dedupe: [...new Set([...RUNTIME, ...dedupe, ...(appResolve.dedupe ?? [])])],
      extensions: appResolve.extensions ?? [...WEB_FIRST, ...DEFAULT_EXT],
    },
  }
}

/**
 * Where a rendered element came from, in development.
 *
 * The React plugin emits `import { jsxDEV } from 'react/jsx-dev-runtime'` in
 * every app module. Pointing that import at `@hanzo/source` instead keeps the
 * position the compiler already passes, as `data-source` on host elements, and
 * the injected listener opens it in the editor on Alt + right click through
 * Vite's own `/__open-in-editor`. Only modules under the app root are
 * redirected, so the runtime's own import of React is never rewritten into
 * itself; a production build is untouched.
 */
const source = (root: string) => {
  let serving = false
  return {
    name: 'hanzo:source',
    configResolved(resolved: { command: string }) {
      serving = resolved.command === 'serve'
    },
    transform(code: string, id: string) {
      if (!serving || !id.startsWith(root) || id.includes('/node_modules/')) return
      if (!code.includes('react/jsx-dev-runtime')) return
      return { code: code.replaceAll('react/jsx-dev-runtime', '@hanzo/source/jsx-dev-runtime'), map: null }
    },
    transformIndexHtml() {
      if (!serving) return
      return [
        {
          tag: 'script',
          attrs: { type: 'module' },
          children: "import { listen } from '@hanzo/source/client'\nlisten()",
          injectTo: 'body',
        },
      ]
    },
  }
}
