import { getLinearGradient } from '@hanzogui/native'

export type { LinearGradientProps, LinearGradientPoint } from 'expo-linear-gradient'

export function LinearGradient(props: any) {
  const state = getLinearGradient().state
  if (state.enabled && state.Component) {
    const ExpoLinearGradient = state.Component
    return <ExpoLinearGradient {...props} />
  }
  console.warn(
    `Warning: Must call import '@hanzogui/native/setup-expo-linear-gradient' at root`
  )
  return
}
