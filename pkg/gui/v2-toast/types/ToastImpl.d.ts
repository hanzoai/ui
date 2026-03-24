import type { GetProps, GuiElement } from '@gui/core';
import type { DismissableProps } from '@gui/dismissable';
import * as React from 'react';
import type { GestureResponderEvent } from 'react-native';
import type { ScopedProps } from './ToastProvider';
declare const ToastImplFrame: import("@gui/core").GuiComponent<import("@gui/core").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
    unstyled?: boolean | undefined;
    elevation?: number | import("@gui/core").SizeTokens | undefined;
    fullscreen?: boolean | undefined;
}, import("@gui/core").StaticConfigPublic>;
type ToastProps = Omit<ToastImplProps, keyof ToastImplPrivateProps>;
type SwipeEvent = GestureResponderEvent;
declare const useToastInteractiveContext: (scope?: string) => {
    onClose(): void;
};
type ToastImplPrivateProps = {
    open?: boolean;
    onClose(): void;
};
type ToastImplFrameProps = GetProps<typeof ToastImplFrame>;
export type ToastExtraProps = {
    /**
     * The controlled open state of the dialog. Must be used in conjunction with `onOpenChange`.
     */
    open?: boolean;
    /**
     * The open state of the dialog when it is initially rendered. Use when you do not need to control its open state.
     */
    defaultOpen?: boolean;
    /**
     * Event handler called when the open state of the dialog changes.
     */
    onOpenChange?(open: boolean): void;
    /**
     * Used to force mounting when more control is needed. Useful when
     * controlling animation with React animation libraries.
     */
    forceMount?: boolean;
    /**
     * Control the sensitivity of the toast for accessibility purposes.
     * For toasts that are the result of a user action, choose foreground. Toasts generated from background tasks should use background.
     */
    type?: 'foreground' | 'background';
    /**
     * Time in milliseconds that toast should remain visible for. Overrides value given to `ToastProvider`.
     */
    duration?: number;
    /**
     * Event handler called when the escape key is down. It can be prevented by calling `event.preventDefault`.
     */
    onEscapeKeyDown?: DismissableProps['onEscapeKeyDown'];
    /**
     * Event handler called when the dismiss timer is paused.
     * On web, this occurs when the pointer is moved over the viewport, the viewport is focused or when the window is blurred.
     * On mobile, this occurs when the toast is touched.
     */
    onPause?(): void;
    /**
     * Event handler called when the dismiss timer is resumed.
     * On web, this occurs when the pointer is moved away from the viewport, the viewport is blurred or when the window is focused.
     * On mobile, this occurs when the toast is released.
     */
    onResume?(): void;
    /**
     * Event handler called when starting a swipe interaction. It can be prevented by calling `event.preventDefault`.
     */
    onSwipeStart?(event: SwipeEvent): void;
    /**
     * Event handler called during a swipe interaction. It can be prevented by calling `event.preventDefault`.
     */
    onSwipeMove?(event: SwipeEvent): void;
    /**
     * Event handler called at the cancellation of a swipe interaction. It can be prevented by calling `event.preventDefault`.
     */
    onSwipeCancel?(event: SwipeEvent): void;
    /**
     * Event handler called at the end of a swipe interaction. It can be prevented by calling `event.preventDefault`.
     */
    onSwipeEnd?(event: SwipeEvent): void;
    /**
     * The viewport's name to send the toast to. Used when using multiple viewports and want to forward toasts to different ones.
     *
     * @default "default"
     */
    viewportName?: string;
    /**
     *
     */
    id?: string;
};
type ToastImplProps = ScopedProps<ToastImplPrivateProps & ToastImplFrameProps & ToastExtraProps>;
declare const ToastImpl: React.ForwardRefExoticComponent<Omit<ToastImplPrivateProps & Omit<import("@gui/core").RNGuiViewNonStyleProps, "unstyled" | "elevation" | keyof import("@gui/core").StackStyleBase | "fullscreen"> & import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
    unstyled?: boolean | undefined;
    elevation?: number | import("@gui/core").SizeTokens | undefined;
    fullscreen?: boolean | undefined;
} & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>> & import("@gui/core").WithPseudoProps<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
    unstyled?: boolean | undefined;
    elevation?: number | import("@gui/core").SizeTokens | undefined;
    fullscreen?: boolean | undefined;
} & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>>> & import("@gui/core").WithMediaProps<import("@gui/core").WithThemeShorthandsAndPseudos<import("@gui/core").StackStyleBase, {
    unstyled?: boolean | undefined;
    elevation?: number | import("@gui/core").SizeTokens | undefined;
    fullscreen?: boolean | undefined;
}>> & ToastExtraProps, "scope"> & {
    scope?: import("./ToastProvider").ToastScopes;
} & React.RefAttributes<GuiElement>>;
export { ToastImpl, ToastImplFrame, useToastInteractiveContext, type ToastImplProps };
export type { ToastProps };
//# sourceMappingURL=ToastImpl.d.ts.map