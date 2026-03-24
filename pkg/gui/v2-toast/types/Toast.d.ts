import type { GetProps, NativePlatform, NativeValue, GuiElement } from '@gui/core';
import * as React from 'react';
import type { CustomData } from './ToastImperative';
import { useToast, useToastController, useToastState } from './ToastImperative';
import type { ToastExtraProps, ToastProps } from './ToastImpl';
import type { ScopedProps, ToastProviderProps } from './ToastProvider';
import { ToastProvider } from './ToastProvider';
import type { ToastViewportProps } from './ToastViewport';
import { ToastViewport } from './ToastViewport';
declare const ToastTitle: import("@gui/core").GuiComponent<import("@gui/core").TamaDefer, import("@gui/core").GuiTextElement, import("@gui/core").TextNonStyleProps, import("@gui/core").TextStylePropsBase, {
    unstyled?: boolean | undefined;
    size?: import("@gui/core").FontSizeTokens | undefined;
}, import("@gui/core").StaticConfigPublic>;
type ToastTitleProps = GetProps<typeof ToastTitle>;
declare const ToastDescription: import("@gui/core").GuiComponent<import("@gui/core").TamaDefer, import("@gui/core").GuiTextElement, import("@gui/core").TextNonStyleProps, import("@gui/core").TextStylePropsBase, {
    unstyled?: boolean | undefined;
    size?: import("@gui/core").FontSizeTokens | undefined;
}, import("@gui/core").StaticConfigPublic>;
type ToastDescriptionProps = GetProps<typeof ToastDescription>;
type ToastActionProps = ScopedProps<ToastCloseProps & {
    /**
     * A short description for an alternate way to carry out the action. For screen reader users
     * who will not be able to navigate to the button easily/quickly.
     * @example <ToastAction altText="Goto account settings to updgrade">Upgrade</ToastAction>
     * @example <ToastAction altText="Undo (Alt+U)">Undo</ToastAction>
     */
    altText: string;
}>;
declare const ToastCloseFrame: import("@gui/core").GuiComponent<import("@gui/core").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
    elevation?: number | import("@gui/core").SizeTokens | undefined;
    fullscreen?: boolean | undefined;
}, import("@gui/core").StaticConfigPublic>;
type ToastCloseFrameProps = GetProps<typeof ToastCloseFrame>;
type ToastCloseProps = ScopedProps<ToastCloseFrameProps & {}>;
declare const Toast: React.ForwardRefExoticComponent<Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
    unstyled?: boolean | undefined;
    elevation?: number | import("@gui/core").SizeTokens | undefined;
    fullscreen?: boolean | undefined;
}>, keyof ToastExtraProps> & ToastExtraProps & React.RefAttributes<GuiElement>> & import("@gui/core").StaticComponentObject<Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
    unstyled?: boolean | undefined;
    elevation?: number | import("@gui/core").SizeTokens | undefined;
    fullscreen?: boolean | undefined;
}>, keyof ToastExtraProps> & ToastExtraProps, GuiElement, import("@gui/core").RNGuiViewNonStyleProps & ToastExtraProps, import("@gui/core").StackStyleBase, {
    unstyled?: boolean | undefined;
    elevation?: number | import("@gui/core").SizeTokens | undefined;
    fullscreen?: boolean | undefined;
}, import("@gui/core").StaticConfigPublic> & Omit<import("@gui/core").StaticConfigPublic, "staticConfig" | "styleable"> & {
    __tama: [Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
        unstyled?: boolean | undefined;
        elevation?: number | import("@gui/core").SizeTokens | undefined;
        fullscreen?: boolean | undefined;
    }>, keyof ToastExtraProps> & ToastExtraProps, GuiElement, import("@gui/core").RNGuiViewNonStyleProps & ToastExtraProps, import("@gui/core").StackStyleBase, {
        unstyled?: boolean | undefined;
        elevation?: number | import("@gui/core").SizeTokens | undefined;
        fullscreen?: boolean | undefined;
    }, import("@gui/core").StaticConfigPublic];
} & {
    Title: import("@gui/core").GuiComponent<import("@gui/core").TamaDefer, import("@gui/core").GuiTextElement, import("@gui/core").TextNonStyleProps, import("@gui/core").TextStylePropsBase, {
        unstyled?: boolean | undefined;
        size?: import("@gui/core").FontSizeTokens | undefined;
    }, import("@gui/core").StaticConfigPublic>;
    Description: import("@gui/core").GuiComponent<import("@gui/core").TamaDefer, import("@gui/core").GuiTextElement, import("@gui/core").TextNonStyleProps, import("@gui/core").TextStylePropsBase, {
        unstyled?: boolean | undefined;
        size?: import("@gui/core").FontSizeTokens | undefined;
    }, import("@gui/core").StaticConfigPublic>;
    Action: React.ForwardRefExoticComponent<Omit<ToastActionProps, "scope"> & {
        scope?: import("./ToastProvider").ToastScopes;
    } & React.RefAttributes<GuiElement>>;
    Close: React.ForwardRefExoticComponent<Omit<Omit<import("@gui/core").RNGuiViewNonStyleProps, "elevation" | keyof import("@gui/core").StackStyleBase | "fullscreen"> & import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
        elevation?: number | import("@gui/core").SizeTokens | undefined;
        fullscreen?: boolean | undefined;
    } & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>> & import("@gui/core").WithPseudoProps<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
        elevation?: number | import("@gui/core").SizeTokens | undefined;
        fullscreen?: boolean | undefined;
    } & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>>> & import("@gui/core").WithMediaProps<import("@gui/core").WithThemeShorthandsAndPseudos<import("@gui/core").StackStyleBase, {
        elevation?: number | import("@gui/core").SizeTokens | undefined;
        fullscreen?: boolean | undefined;
    }>>, "scope"> & {
        scope?: import("./ToastProvider").ToastScopes;
    } & React.RefAttributes<GuiElement>>;
};
export { Toast, ToastProvider, ToastViewport, useToast, useToastController, useToastState, };
export type { CustomData, ToastActionProps, ToastCloseProps, ToastDescriptionProps, NativePlatform as ToastNativePlatform, NativeValue as ToastNativeValue, ToastProps, ToastProviderProps, ToastTitleProps, ToastViewportProps, };
//# sourceMappingURL=Toast.d.ts.map