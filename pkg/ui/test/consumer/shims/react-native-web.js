// The web spelling of `react-native` for this consumer. See vite.config.js.
// react-native-svg's native half imports `TurboModuleRegistry` from bare
// `react-native`, which react-native-web does not export. RNW's vendored copy
// exports only `get`/`getEnforcing` — no `TurboModuleRegistry` binding — so
// the shape is spelled out here with the same semantics.
export * from 'react-native-web'
export const TurboModuleRegistry = {
  get() { return null },
  getEnforcing(name) {
    throw new Error(`TurboModuleRegistry.getEnforcing(...): '${name}' could not be found.`)
  },
}
