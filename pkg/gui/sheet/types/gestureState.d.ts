/**
 * Re-export gesture state from @gui/native.
 * Sheet uses this for backward compatibility with existing code.
 */
import { type GestureState } from '@gui/native';
export type { GestureState as GestureHandlerState } from '@gui/native';
export declare function isGestureHandlerEnabled(): boolean;
export declare function getGestureHandlerState(): GestureState;
export declare function setGestureHandlerState(updates: Partial<GestureState>): void;
export declare const setGestureState: typeof setGestureHandlerState;
//# sourceMappingURL=gestureState.d.ts.map