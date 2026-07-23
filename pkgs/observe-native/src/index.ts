// @hanzo/observe-native — native + desktop binding for @hanzo/observe.
//
//   import { createAnalytics } from '@hanzo/event'
//   import { ObserveProvider, ObserveScope, useObserve } from '@hanzo/observe-native'
//
//   <ObserveProvider client={createAnalytics({ product: 'app' })}>
//     <ObserveScope name="Dashboard">
//       <ObserveScope name="UserCard"><SaveButton /></ObserveScope>
//     </ObserveScope>
//   </ObserveProvider>
//
//   // inside a Tamagui / React Native component:
//   const o = useObserve()
//   <Button onPress={o.press('SaveButton', save)} />           // → Dashboard/UserCard/SaveButton
//   <Input onChangeText={o.changeText('email', setEmail)} />   // value redacted
//
// Desktop apps also import the react-free bridge from '@hanzo/observe-native/tauri'.

export { ObserveProvider, ObserveScope } from './context'
export type { ObserveProviderProps, ObserveScopeProps } from './context'
export { useObserve, useEventStream } from './hooks'
export type { NativeEventStream, ObserveApi } from './hooks'
export { emit } from './emit'
export type { EmitSpec } from './emit'
export { buildSemantic, leafNode, redactText, scopeNode } from './semantic'
export { bindTauri } from './tauri'
export type { TauriBridge, TauriOptions } from './tauri'
export type { NativeMeta } from './types'
export type {
  Interaction,
  RedactedValue,
  RedactionPolicy,
  Semantic,
  SemanticNode,
} from '@hanzo/observe'
