import type { FontSizeTokens, GetProps } from '@gui/web';
export declare const LabelFrame: import("@gui/web").GuiComponent<import("@gui/web").TamaDefer, import("@gui/web").GuiTextElement, import("@gui/web").TextNonStyleProps, import("@gui/web").TextStylePropsBase, {
    unstyled?: boolean | undefined;
    size?: import("@gui/web").SizeTokens | FontSizeTokens | undefined;
}, import("@gui/web").StaticConfigPublic>;
export type LabelProps = GetProps<typeof LabelFrame> & {
    htmlFor?: string;
};
export declare const Label: import("@gui/web").GuiComponent<import("@gui/web").GetFinalProps<import("@gui/web").TextNonStyleProps, import("@gui/web").TextStylePropsBase, {
    unstyled?: boolean | undefined;
    size?: import("@gui/web").SizeTokens | FontSizeTokens | undefined;
}>, import("@gui/web").GuiTextElement, import("@gui/web").TextNonStyleProps & void, import("@gui/web").TextStylePropsBase, {
    unstyled?: boolean | undefined;
    size?: import("@gui/web").SizeTokens | FontSizeTokens | undefined;
}, import("@gui/web").StaticConfigPublic>;
export declare const useLabelContext: (element?: HTMLElement | null) => string | undefined;
//# sourceMappingURL=Label.d.ts.map