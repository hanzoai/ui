/**
 * Legacy setup - prefer `import '@hanzogui/native/setup-gesture-handler'` instead.
 */

import { getGestureHandler } from '@hanzogui/native'

export function isGestureHandlerEnabled(): boolean {
  return getGestureHandler().isEnabled
}

export interface SetupGestureHandlerConfig {
  Gesture: any
  GestureDetector: any
  ScrollView?: any
}

export function setupGestureHandler(config: SetupGestureHandlerConfig): void {
  const g = globalThis as any
  if (g.__gui_sheet_gesture_handler_setup) {
    return
  }
  g.__gui_sheet_gesture_handler_setup = true

  const { Gesture, GestureDetector, ScrollView } = config

  if (Gesture && GestureDetector) {
    getGestureHandler().set({
      enabled: true,
      Gesture,
      GestureDetector,
      ScrollView: ScrollView || null,
    })
  }
}
