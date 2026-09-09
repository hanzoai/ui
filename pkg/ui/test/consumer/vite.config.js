import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The whole config. There is no @hanzo/ui in it — no alias to the package, no
// CSS pipeline for it, no plugin, no transpile list. That absence is the claim
// being tested.
//
// The three resolutions below belong to react-native-web, which @hanzo/gui
// renders through on the web, and every RNW app carries them. react-native-svg's
// own WEB build (`lib/module/web/WebShape.js`) imports bare `react-native`, and
// its entry only reaches that build when `.web.js` outranks `.js`. Its asset
// path (`lib/resolveAssetUri.js`) names `@react-native/assets-registry/registry`,
// which on the web is react-native-web's own AssetRegistry module. Without them
// the build FAILS — loudly, at the bundler, with a file and a line — which is a
// different animal from the silent unstyled render this package exists to
// prevent. Removing them means @hanzo/ui pre-bundling its own web target.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-native': 'react-native-web',
      '@react-native/assets-registry/registry': 'react-native-web/dist/modules/AssetRegistry',
    },
    extensions: ['.web.js', '.web.jsx', '.web.ts', '.web.tsx', '.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
  },
})
