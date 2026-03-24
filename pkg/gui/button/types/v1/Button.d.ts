import type { TextContextStyles, TextParentStyles } from '@gui/text';
import type { FontSizeTokens, GetProps, SizeTokens, ThemeableProps } from '@gui/web';
import type { FunctionComponent, JSX } from 'react';
type ButtonVariant = 'outlined';
export declare const ButtonContext: import("@gui/web").StyledContext<Partial<TextContextStyles & {
    size: SizeTokens;
    variant?: ButtonVariant;
}>>;
type ButtonIconProps = {
    color?: any;
    size?: any;
};
type IconProp = JSX.Element | FunctionComponent<ButtonIconProps> | ((props: ButtonIconProps) => any) | null;
type ButtonExtraProps = TextParentStyles & ThemeableProps & {
    /**
     * add icon before, passes color and size automatically if Component
     */
    icon?: IconProp;
    /**
     * add icon after, passes color and size automatically if Component
     */
    iconAfter?: IconProp;
    /**
     * adjust icon relative to size
     *
     * @default 1
     */
    scaleIcon?: number;
    /**
     * make the spacing elements flex
     */
    spaceFlex?: number | boolean;
    /**
     * adjust internal space relative to icon size
     */
    scaleSpace?: number;
    /**
     * remove default styles
     */
    unstyled?: boolean;
};
type ButtonProps = ButtonExtraProps & GetProps<typeof ButtonFrame>;
declare const ButtonFrame: import("@gui/web").GuiComponent<import("@gui/web").TamaDefer, import("@gui/web").GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {
    size?: number | SizeTokens | undefined;
    variant?: "outlined" | undefined;
    elevation?: number | SizeTokens | undefined;
    circular?: boolean | undefined;
    chromeless?: boolean | "all" | undefined;
    transparent?: boolean | undefined;
    disabled?: boolean | undefined;
    unstyled?: boolean | undefined;
    fullscreen?: boolean | undefined;
    elevate?: boolean | undefined;
    bordered?: boolean | undefined;
}, import("@gui/web").StaticConfigPublic>;
declare const ButtonText: import("@gui/web").GuiComponent<import("@gui/web").TamaDefer, import("@gui/web").GuiTextElement, import("@gui/web").TextNonStyleProps, import("@gui/web").TextStylePropsBase, {
    size?: FontSizeTokens | undefined;
    unstyled?: boolean | undefined;
}, import("@gui/web").StaticConfigPublic>;
declare const ButtonIcon: (props: {
    children: React.ReactNode;
    scaleIcon?: number;
}) => any;
/**
 * @summary A Button is a clickable element that can be used to trigger actions such as submitting forms, navigating to other pages, or performing other actions.
 * @see — Docs https://gui.dev/ui/button
 */
declare const Button: import("react").ForwardRefExoticComponent<Omit<import("@gui/web").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {
    size?: number | SizeTokens | undefined;
    variant?: "outlined" | undefined;
    elevation?: number | SizeTokens | undefined;
    circular?: boolean | undefined;
    chromeless?: boolean | "all" | undefined;
    transparent?: boolean | undefined;
    disabled?: boolean | undefined;
    unstyled?: boolean | undefined;
    fullscreen?: boolean | undefined;
    elevate?: boolean | undefined;
    bordered?: boolean | undefined;
}>, "unstyled" | "icon" | "iconAfter" | "scaleIcon" | keyof TextContextStyles | "textProps" | "noTextWrap" | keyof ThemeableProps | "spaceFlex" | "scaleSpace"> & TextContextStyles & {
    textProps?: Partial<import("@gui/text").SizableTextProps>;
    noTextWrap?: boolean;
} & ThemeableProps & {
    /**
     * add icon before, passes color and size automatically if Component
     */
    icon?: IconProp;
    /**
     * add icon after, passes color and size automatically if Component
     */
    iconAfter?: IconProp;
    /**
     * adjust icon relative to size
     *
     * @default 1
     */
    scaleIcon?: number;
    /**
     * make the spacing elements flex
     */
    spaceFlex?: number | boolean;
    /**
     * adjust internal space relative to icon size
     */
    scaleSpace?: number;
    /**
     * remove default styles
     */
    unstyled?: boolean;
} & import("react").RefAttributes<import("@gui/web").GuiElement>> & import("@gui/web").StaticComponentObject<Omit<import("@gui/web").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {
    size?: number | SizeTokens | undefined;
    variant?: "outlined" | undefined;
    elevation?: number | SizeTokens | undefined;
    circular?: boolean | undefined;
    chromeless?: boolean | "all" | undefined;
    transparent?: boolean | undefined;
    disabled?: boolean | undefined;
    unstyled?: boolean | undefined;
    fullscreen?: boolean | undefined;
    elevate?: boolean | undefined;
    bordered?: boolean | undefined;
}>, "unstyled" | "icon" | "iconAfter" | "scaleIcon" | keyof TextContextStyles | "textProps" | "noTextWrap" | keyof ThemeableProps | "spaceFlex" | "scaleSpace"> & TextContextStyles & {
    textProps?: Partial<import("@gui/text").SizableTextProps>;
    noTextWrap?: boolean;
} & ThemeableProps & {
    /**
     * add icon before, passes color and size automatically if Component
     */
    icon?: IconProp;
    /**
     * add icon after, passes color and size automatically if Component
     */
    iconAfter?: IconProp;
    /**
     * adjust icon relative to size
     *
     * @default 1
     */
    scaleIcon?: number;
    /**
     * make the spacing elements flex
     */
    spaceFlex?: number | boolean;
    /**
     * adjust internal space relative to icon size
     */
    scaleSpace?: number;
    /**
     * remove default styles
     */
    unstyled?: boolean;
}, import("@gui/web").GuiElement, import("@gui/core").RNGuiViewNonStyleProps & TextContextStyles & {
    textProps?: Partial<import("@gui/text").SizableTextProps>;
    noTextWrap?: boolean;
} & ThemeableProps & {
    /**
     * add icon before, passes color and size automatically if Component
     */
    icon?: IconProp;
    /**
     * add icon after, passes color and size automatically if Component
     */
    iconAfter?: IconProp;
    /**
     * adjust icon relative to size
     *
     * @default 1
     */
    scaleIcon?: number;
    /**
     * make the spacing elements flex
     */
    spaceFlex?: number | boolean;
    /**
     * adjust internal space relative to icon size
     */
    scaleSpace?: number;
    /**
     * remove default styles
     */
    unstyled?: boolean;
}, import("@gui/web").StackStyleBase, {
    size?: number | SizeTokens | undefined;
    variant?: "outlined" | undefined;
    elevation?: number | SizeTokens | undefined;
    circular?: boolean | undefined;
    chromeless?: boolean | "all" | undefined;
    transparent?: boolean | undefined;
    disabled?: boolean | undefined;
    unstyled?: boolean | undefined;
    fullscreen?: boolean | undefined;
    elevate?: boolean | undefined;
    bordered?: boolean | undefined;
}, import("@gui/web").StaticConfigPublic> & Omit<import("@gui/web").StaticConfigPublic, "staticConfig" | "styleable"> & {
    __tama: [Omit<import("@gui/web").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {
        size?: number | SizeTokens | undefined;
        variant?: "outlined" | undefined;
        elevation?: number | SizeTokens | undefined;
        circular?: boolean | undefined;
        chromeless?: boolean | "all" | undefined;
        transparent?: boolean | undefined;
        disabled?: boolean | undefined;
        unstyled?: boolean | undefined;
        fullscreen?: boolean | undefined;
        elevate?: boolean | undefined;
        bordered?: boolean | undefined;
    }>, "unstyled" | "icon" | "iconAfter" | "scaleIcon" | keyof TextContextStyles | "textProps" | "noTextWrap" | keyof ThemeableProps | "spaceFlex" | "scaleSpace"> & TextContextStyles & {
        textProps?: Partial<import("@gui/text").SizableTextProps>;
        noTextWrap?: boolean;
    } & ThemeableProps & {
        /**
         * add icon before, passes color and size automatically if Component
         */
        icon?: IconProp;
        /**
         * add icon after, passes color and size automatically if Component
         */
        iconAfter?: IconProp;
        /**
         * adjust icon relative to size
         *
         * @default 1
         */
        scaleIcon?: number;
        /**
         * make the spacing elements flex
         */
        spaceFlex?: number | boolean;
        /**
         * adjust internal space relative to icon size
         */
        scaleSpace?: number;
        /**
         * remove default styles
         */
        unstyled?: boolean;
    }, import("@gui/web").GuiElement, import("@gui/core").RNGuiViewNonStyleProps & TextContextStyles & {
        textProps?: Partial<import("@gui/text").SizableTextProps>;
        noTextWrap?: boolean;
    } & ThemeableProps & {
        /**
         * add icon before, passes color and size automatically if Component
         */
        icon?: IconProp;
        /**
         * add icon after, passes color and size automatically if Component
         */
        iconAfter?: IconProp;
        /**
         * adjust icon relative to size
         *
         * @default 1
         */
        scaleIcon?: number;
        /**
         * make the spacing elements flex
         */
        spaceFlex?: number | boolean;
        /**
         * adjust internal space relative to icon size
         */
        scaleSpace?: number;
        /**
         * remove default styles
         */
        unstyled?: boolean;
    }, import("@gui/web").StackStyleBase, {
        size?: number | SizeTokens | undefined;
        variant?: "outlined" | undefined;
        elevation?: number | SizeTokens | undefined;
        circular?: boolean | undefined;
        chromeless?: boolean | "all" | undefined;
        transparent?: boolean | undefined;
        disabled?: boolean | undefined;
        unstyled?: boolean | undefined;
        fullscreen?: boolean | undefined;
        elevate?: boolean | undefined;
        bordered?: boolean | undefined;
    }, import("@gui/web").StaticConfigPublic];
} & {
    Text: import("@gui/web").GuiComponent<import("@gui/web").TamaDefer, import("@gui/web").GuiTextElement, import("@gui/web").TextNonStyleProps, import("@gui/web").TextStylePropsBase, {
        size?: FontSizeTokens | undefined;
        unstyled?: boolean | undefined;
    }, import("@gui/web").StaticConfigPublic>;
    Icon: (props: {
        children: React.ReactNode;
        scaleIcon?: number;
    }) => any;
};
/**
 * @deprecated Instead of useButton, see the Button docs for the newer and much improved Advanced customization pattern: https://gui.dev/docs/components/button
 */
declare function useButton<Props extends ButtonProps>({ textProps, ...propsIn }: Props, { Text }?: {
    Text: any;
}): {
    spaceSize: number | import("@gui/web").UnionableString | "unset" | import("@gui/web").Variable<any>;
    isNested: boolean;
    props: Props;
};
export { Button, ButtonFrame, ButtonIcon, ButtonText, useButton, };
export type { ButtonProps };
//# sourceMappingURL=Button.d.ts.map