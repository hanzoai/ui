import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The whole config. There is no @hanzo/ui in it — no alias to the package, no
// CSS pipeline for it, no plugin, no transpile list. That absence is the claim
// being tested.
//
// The resolutions below belong to react-native-web, which @hanzo/gui renders
// through on the web, and every RNW app carries them. react-native-svg's own
// WEB build (`lib/module/web/WebShape.js`) imports bare `react-native`, and its
// entry only reaches that build when `.web.js` outranks `.js`. Its asset path
// (`lib/resolveAssetUri.js`) names `@react-native/assets-registry/registry`,
// which on the web is react-native-web's own AssetRegistry module. The native
// half names two things RNW has no spelling of — `TurboModuleRegistry` from
// bare `react-native` and `codegenNativeComponent` from
// `react-native/Libraries/Utilities/...` (Flow source, unparseable by Vite) —
// so the bare specifier points at a one-file shim that re-exports RNW wholesale
// plus RNW's vendored TurboModuleRegistry, and the deep codegen path at an
// inert stub. Without these the build FAILS — loudly, at the bundler, with a
// file and a line — which is a different animal from the silent unstyled render
// this package exists to prevent. Removing them means @hanzo/ui pre-bundling
// its own web target. `optimizeDeps.exclude` keeps the native half out of the
// dev pre-bundler, which crawls node_modules without resolve.extensions.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^react-native$/, replacement: new URL('./shims/react-native-web.js', import.meta.url).pathname },
      { find: /^@react-native\/assets-registry\/registry$/, replacement: 'react-native-web/dist/modules/AssetRegistry' },
      { find: /^react-native\/Libraries\/Utilities\/codegenNativeComponent$/, replacement: new URL('./shims/codegenNativeComponent.js', import.meta.url).pathname },
      { find: /^react-native\/TurboModule\/TurboModuleRegistry$/, replacement: 'react-native-web/dist/vendor/react-native/TurboModule/TurboModuleRegistry' },
    ],
    extensions: ['.web.js', '.web.jsx', '.web.ts', '.web.tsx', '.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
  },
  optimizeDeps: { exclude: ['react-native-svg'] },
})
