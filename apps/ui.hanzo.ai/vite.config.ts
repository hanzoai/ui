import { one } from 'one/vite'
import type { UserConfig } from 'vite'

// Every route is rendered once at build time to a real HTML file under
// dist/client, which is what the static plane serves (spaMode: false). No
// server survives the build.
export default {
  plugins: [
    one({
      config: { tsConfigPaths: false },
      web: { defaultRenderMode: 'ssg' },
      ssr: { dedupeSymlinkedModules: true },
    }),
  ],
  // The brand is decided once, here, and reaches both bundles as a literal.
  define: { 'process.env.BRAND': JSON.stringify(process.env.BRAND ?? 'hanzo') },
  resolve: {
    alias: {
      '~': import.meta.dirname,
      // @hanzo/gui renders through react-native-web; the react-native-svg web
      // build still names bare `react-native`.
      'react-native': 'react-native-web',
    },
    dedupe: ['react', 'react-dom', 'react-native-web', '@hanzo/gui', '@hanzogui/core', '@hanzogui/web'],
  },
  // The MDX compiler is a native binding (satteri, Rust) and runs only in the
  // loaders at build time; it stays a Node module rather than a bundled one.
  ssr: { noExternal: true, external: ['@vxrn/mdx-rust', 'satteri', 'satteri-expressive-code'] },
} satisfies UserConfig
