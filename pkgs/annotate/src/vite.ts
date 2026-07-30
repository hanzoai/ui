// The Vite/Rollup adapter.
//
//   import annotate from '@hanzo/annotate/vite'
//   export default defineConfig({ plugins: [annotate(), react()] })
//
// `enforce: 'pre'` puts this ahead of the React plugin, so it sees TSX rather
// than the `jsx(...)` calls TSX has already become.

import { shouldTransform } from './filter.js'
import { transform } from './transform.js'

interface VitePluginLike {
  name: string
  enforce: 'pre'
  transform(code: string, id: string): { code: string; map: null } | null
}

/** annotate returns the Vite plugin. `map: null` tells Rollup to keep the
 *  existing source map: every insertion is newline-free, so line numbers are
 *  untouched and a stack trace still points at the right line. */
export default function annotate(): VitePluginLike {
  return {
    name: '@hanzo/annotate',
    enforce: 'pre',
    transform(code: string, id: string) {
      if (!shouldTransform(id)) return null
      try {
        const result = transform(code, { filename: id.split('?')[0]! })
        return result ? { code: result.code, map: null } : null
      } catch {
        return null
      }
    },
  }
}
