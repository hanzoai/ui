// The web spelling of react-native's `codegenNativeComponent`.
//
// react-native-svg's native half calls this at module scope to declare its
// fabric native components (`lib/module/fabric/*NativeComponent.js`). On the
// web those components are never mounted — the web shapes draw through
// `unstable_createElement` — so this only has to return something bundlable.
// The real one lives in react-native's Flow source (`Libraries/Utilities/`)
// and is unparseable by Vite, which is a second reason the deep path cannot be
// left to reach the real package.
export default function codegenNativeComponent(_name: string, _options?: unknown) {
  return () => null
}
