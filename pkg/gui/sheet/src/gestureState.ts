/**
 * Re-export gesture state from @hanzogui/native.
 * Sheet uses this for backward compatibility with existing code.
 */

import { getGestureHandler, type GestureState } from '@hanzogui/native'

export type { GestureState as GestureHandlerState } from '@hanzogui/native'

// backward compat helpers
export function isGestureHandlerEnabled(): boolean {
  return getGestureHandler().isEnabled
}

export function getGestureHandlerState(): GestureState {
  return getGestureHandler().state
}

export function setGestureHandlerState(updates: Partial<GestureState>): void {
  getGestureHandler().set(updates)
}

// alias for backward compatibility
export const setGestureState = setGestureHandlerState
