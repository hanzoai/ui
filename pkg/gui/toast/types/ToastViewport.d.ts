import type { GetProps, GuiElement } from '@gui/core';
import * as React from 'react';
declare const VIEWPORT_DEFAULT_HOTKEY: string[];
declare const VIEWPORT_PAUSE = "toast.viewportPause";
declare const VIEWPORT_RESUME = "toast.viewportResume";
declare const ToastViewportFrame: import("@gui/core").GuiComponent<import("@gui/core").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
    unstyled?: boolean | undefined;
    elevation?: number | import("@gui/core").SizeTokens | undefined;
    fullscreen?: boolean | undefined;
}, import("@gui/core").StaticConfigPublic>;
type ToastViewportFrameProps = GetProps<typeof ToastViewportFrame>;
type ToastViewportProps = ToastViewportFrameProps & {
    /**
     * The keys to use as the keyboard shortcut that will move focus to the toast viewport.
     * @defaultValue ['F8']
     */
    hotkey?: string[];
    /**
     * An author-localized label for the toast viewport to provide context for screen reader users
     * when navigating page landmarks. The available `{hotkey}` placeholder will be replaced for you.
     * @defaultValue 'Notifications ({hotkey})'
     */
    label?: string;
    /**
     * Used to reference the viewport if you want to have multiple viewports in the same provider.
     */
    name?: string;
    /**
     * Pass this when you want to have multiple/duplicated toasts.
     */
    multipleToasts?: boolean;
    /**
     * When true, uses a portal to render at the very top of the root GuiProvider.
     */
    portalToRoot?: boolean;
};
declare const ToastViewport: React.NamedExoticComponent<Omit<import("@gui/core").RNGuiViewNonStyleProps, "unstyled" | "elevation" | keyof import("@gui/core").StackStyleBase | "fullscreen"> & import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
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
}>> & {
    /**
     * The keys to use as the keyboard shortcut that will move focus to the toast viewport.
     * @defaultValue ['F8']
     */
    hotkey?: string[];
    /**
     * An author-localized label for the toast viewport to provide context for screen reader users
     * when navigating page landmarks. The available `{hotkey}` placeholder will be replaced for you.
     * @defaultValue 'Notifications ({hotkey})'
     */
    label?: string;
    /**
     * Used to reference the viewport if you want to have multiple viewports in the same provider.
     */
    name?: string;
    /**
     * Pass this when you want to have multiple/duplicated toasts.
     */
    multipleToasts?: boolean;
    /**
     * When true, uses a portal to render at the very top of the root GuiProvider.
     */
    portalToRoot?: boolean;
} & React.RefAttributes<HTMLDivElement>>;
export { ToastViewport, VIEWPORT_DEFAULT_HOTKEY, VIEWPORT_PAUSE, VIEWPORT_RESUME, type ToastViewportProps, };
//# sourceMappingURL=ToastViewport.d.ts.map