import type { GetProps, SizeTokens } from '@gui/web';
export declare const CardFrame: import("@gui/web").GuiComponent<import("@gui/web").TamaDefer, import("@gui/web").GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {
    size?: SizeTokens | undefined;
    unstyled?: boolean | undefined;
    elevation?: number | SizeTokens | undefined;
    fullscreen?: boolean | undefined;
}, import("@gui/web").StaticConfigPublic>;
export declare const CardHeader: import("@gui/web").GuiComponent<import("@gui/web").TamaDefer, import("@gui/web").GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {
    size?: SizeTokens | undefined;
    unstyled?: boolean | undefined;
    elevation?: number | SizeTokens | undefined;
    fullscreen?: boolean | undefined;
}, import("@gui/web").StaticConfigPublic>;
export declare const CardFooter: import("@gui/web").GuiComponent<import("@gui/web").TamaDefer, import("@gui/web").GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {
    size?: SizeTokens | undefined;
    unstyled?: boolean | undefined;
    elevation?: number | SizeTokens | undefined;
    fullscreen?: boolean | undefined;
}, import("@gui/web").StaticConfigPublic>;
export declare const CardBackground: import("@gui/web").GuiComponent<import("@gui/web").TamaDefer, import("@gui/web").GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {
    unstyled?: boolean | undefined;
    elevation?: number | SizeTokens | undefined;
    fullscreen?: boolean | undefined;
}, import("@gui/web").StaticConfigPublic>;
export type CardHeaderProps = GetProps<typeof CardHeader>;
export type CardFooterProps = GetProps<typeof CardFooter>;
export type CardProps = GetProps<typeof CardFrame>;
export declare const Card: import("react").ForwardRefExoticComponent<Omit<import("@gui/core").RNGuiViewNonStyleProps, "size" | "unstyled" | "elevation" | keyof import("@gui/web").StackStyleBase | "fullscreen"> & import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & {
    size?: SizeTokens | undefined;
    unstyled?: boolean | undefined;
    elevation?: number | SizeTokens | undefined;
    fullscreen?: boolean | undefined;
} & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>> & import("@gui/web").WithPseudoProps<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & {
    size?: SizeTokens | undefined;
    unstyled?: boolean | undefined;
    elevation?: number | SizeTokens | undefined;
    fullscreen?: boolean | undefined;
} & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>>> & import("@gui/web").WithMediaProps<import("@gui/web").WithThemeShorthandsAndPseudos<import("@gui/web").StackStyleBase, {
    size?: SizeTokens | undefined;
    unstyled?: boolean | undefined;
    elevation?: number | SizeTokens | undefined;
    fullscreen?: boolean | undefined;
}>> & import("react").RefAttributes<import("@gui/web").GuiElement>> & import("@gui/web").StaticComponentObject<import("@gui/web").TamaDefer, import("@gui/web").GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {
    size?: SizeTokens | undefined;
    unstyled?: boolean | undefined;
    elevation?: number | SizeTokens | undefined;
    fullscreen?: boolean | undefined;
}, import("@gui/web").StaticConfigPublic> & Omit<import("@gui/web").StaticConfigPublic, "staticConfig" | "styleable"> & {
    __tama: [import("@gui/web").TamaDefer, import("@gui/web").GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {
        size?: SizeTokens | undefined;
        unstyled?: boolean | undefined;
        elevation?: number | SizeTokens | undefined;
        fullscreen?: boolean | undefined;
    }, import("@gui/web").StaticConfigPublic];
} & {
    Header: import("@gui/web").GuiComponent<import("@gui/web").TamaDefer, import("@gui/web").GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {
        size?: SizeTokens | undefined;
        unstyled?: boolean | undefined;
        elevation?: number | SizeTokens | undefined;
        fullscreen?: boolean | undefined;
    }, import("@gui/web").StaticConfigPublic>;
    Footer: import("@gui/web").GuiComponent<import("@gui/web").TamaDefer, import("@gui/web").GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {
        size?: SizeTokens | undefined;
        unstyled?: boolean | undefined;
        elevation?: number | SizeTokens | undefined;
        fullscreen?: boolean | undefined;
    }, import("@gui/web").StaticConfigPublic>;
    Background: import("@gui/web").GuiComponent<import("@gui/web").TamaDefer, import("@gui/web").GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {
        unstyled?: boolean | undefined;
        elevation?: number | SizeTokens | undefined;
        fullscreen?: boolean | undefined;
    }, import("@gui/web").StaticConfigPublic>;
};
//# sourceMappingURL=Card.d.ts.map