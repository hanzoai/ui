import type { GetProps, GuiElement } from '@gui/core';
import { VisuallyHidden } from '@gui/visually-hidden';
import * as React from 'react';
import type { ScopedProps } from './ToastProvider';
declare const ToastAnnounceExcludeFrame: import("@gui/core").GuiComponent<import("@gui/core").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {}, import("@gui/core").StaticConfigPublic>;
type ToastAnnounceExcludeFrameProps = GetProps<typeof ToastAnnounceExcludeFrame>;
type ToastAnnounceExcludeExtraProps = {
    altText?: string;
};
type ToastAnnounceExcludeProps = ToastAnnounceExcludeFrameProps & ToastAnnounceExcludeExtraProps;
declare const ToastAnnounceExclude: React.ForwardRefExoticComponent<Omit<import("@gui/core").RNGuiViewNonStyleProps, keyof import("@gui/core").StackStyleBase> & import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>> & import("@gui/core").WithPseudoProps<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>>> & import("@gui/core").WithMediaProps<import("@gui/core").WithThemeShorthandsAndPseudos<import("@gui/core").StackStyleBase, {}>> & ToastAnnounceExcludeExtraProps & React.RefAttributes<GuiElement>>;
interface ToastAnnounceProps extends Omit<GetProps<typeof VisuallyHidden>, 'children'>, ScopedProps<{
    children: string[];
}> {
}
declare const ToastAnnounce: React.FC<ToastAnnounceProps>;
export { ToastAnnounce, ToastAnnounceExclude, type ToastAnnounceExcludeProps, type ToastAnnounceProps, };
//# sourceMappingURL=ToastAnnounce.d.ts.map