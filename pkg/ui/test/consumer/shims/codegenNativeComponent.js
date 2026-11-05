// The web spelling of react-native's `codegenNativeComponent`. The real one is
// Flow source (`react-native/Libraries/Utilities/...`) and unparseable by Vite.
// react-native-svg's fabric components call it at module scope; on the web they
// are never mounted, so an inert component is all the build needs.
export default function codegenNativeComponent() {
  return () => null
}
