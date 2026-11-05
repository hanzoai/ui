// The web spelling of `react-native` for Vite apps.
//
// react-native-svg ships two entries. Its WEB entry (`lib/module/ReactNativeSVG.web.js`)
// only imports named bindings react-native-web actually exports (`Platform`,
// `unstable_createElement`, `PixelRatio`, `processColor`, …), so on the web it
// bundles cleanly. Its NATIVE entry pulls `lib/module/fabric/*`, which imports
// `TurboModuleRegistry` from bare `react-native` and
// `codegenNativeComponent` from `react-native/Libraries/Utilities/codegenNativeComponent`
// — neither exists in react-native-web, so the moment the native graph is
// reached the build fails on a named export that no alias can point at, because
// `react-native` itself is what is aliased to react-native-web.
//
// This shim IS the bare-`react-native` target: it re-exports everything
// react-native-web exports, plus the `TurboModuleRegistry` shape react-native-svg
// reaches for, built inline from the same throw-on-missing semantics RNW's own
// vendored copy uses (getEnforcing invariants on a null module). It is spelled
// out here rather than re-exported from RNW's vendor file because that file
// exports only `get`/`getEnforcing` — no `TurboModuleRegistry` binding — so a
// named re-export from it is a missing-export error at the bundler. Every web
// app on this stack already declares react-native-web, so the bare specifier
// inside here resolves from the app, never from this package. The native
// TurboModules this stands in for are never called on the web — the web shapes
// draw through `unstable_createElement` — so the stub must only EXIST.
// @ts-ignore - react-native-web ships Flow types; Vite resolves it at build time.
export * from 'react-native-web'

export const TurboModuleRegistry = {
  get(_name: string): null {
    return null
  },
  getEnforcing(name: string) {
    throw new Error(
      `TurboModuleRegistry.getEnforcing(...): '${name}' could not be found. Verify that a module by this name is registered in the native binary.`,
    )
  },
}
