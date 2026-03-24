import type { ColorTokens, FontSizeTokens, GetProps, SizeTokens } from '@gui/web';
import type { FunctionComponent, JSX, ReactNode } from 'react';
type IconProp = JSX.Element | FunctionComponent<{
    color?: any;
    size?: any;
}> | null;
type ListItemVariant = 'outlined';
export type ListItemExtraProps = {
    icon?: IconProp;
    iconAfter?: IconProp;
    scaleIcon?: number;
    title?: ReactNode;
    subTitle?: ReactNode;
    iconSize?: SizeTokens;
};
export type ListItemProps = GetProps<typeof ListItemFrame> & ListItemExtraProps;
declare const ListItemFrame: import("@gui/web").GuiComponent<import("@gui/web").TamaDefer, import("@gui/web").GuiElement, import("@gui/web").StackNonStyleProps, import("@gui/web").StackStyleBase, {
    size?: SizeTokens | undefined;
    variant?: "outlined" | undefined;
    disabled?: boolean | undefined;
    unstyled?: boolean | undefined;
    active?: boolean | undefined;
}, import("@gui/web").StaticConfigPublic>;
export declare const ListItem: import("react").ForwardRefExoticComponent<Omit<import("@gui/web").GetFinalProps<import("@gui/web").StackNonStyleProps, import("@gui/web").StackStyleBase, {
    size?: SizeTokens | undefined;
    variant?: "outlined" | undefined;
    disabled?: boolean | undefined;
    unstyled?: boolean | undefined;
    active?: boolean | undefined;
}>, keyof ListItemExtraProps> & ListItemExtraProps & import("react").RefAttributes<import("@gui/web").GuiElement>> & import("@gui/web").StaticComponentObject<Omit<import("@gui/web").GetFinalProps<import("@gui/web").StackNonStyleProps, import("@gui/web").StackStyleBase, {
    size?: SizeTokens | undefined;
    variant?: "outlined" | undefined;
    disabled?: boolean | undefined;
    unstyled?: boolean | undefined;
    active?: boolean | undefined;
}>, keyof ListItemExtraProps> & ListItemExtraProps, import("@gui/web").GuiElement, import("@gui/web").StackNonStyleProps & ListItemExtraProps, import("@gui/web").StackStyleBase, {
    size?: SizeTokens | undefined;
    variant?: "outlined" | undefined;
    disabled?: boolean | undefined;
    unstyled?: boolean | undefined;
    active?: boolean | undefined;
}, import("@gui/web").StaticConfigPublic> & Omit<import("@gui/web").StaticConfigPublic, "staticConfig" | "styleable"> & {
    __tama: [Omit<import("@gui/web").GetFinalProps<import("@gui/web").StackNonStyleProps, import("@gui/web").StackStyleBase, {
        size?: SizeTokens | undefined;
        variant?: "outlined" | undefined;
        disabled?: boolean | undefined;
        unstyled?: boolean | undefined;
        active?: boolean | undefined;
    }>, keyof ListItemExtraProps> & ListItemExtraProps, import("@gui/web").GuiElement, import("@gui/web").StackNonStyleProps & ListItemExtraProps, import("@gui/web").StackStyleBase, {
        size?: SizeTokens | undefined;
        variant?: "outlined" | undefined;
        disabled?: boolean | undefined;
        unstyled?: boolean | undefined;
        active?: boolean | undefined;
    }, import("@gui/web").StaticConfigPublic];
} & {
    Apply: import("react").Provider<{
        size?: SizeTokens;
        variant?: ListItemVariant;
        color?: ColorTokens | string;
    }> & import("react").ProviderExoticComponent<Partial<{
        size?: SizeTokens;
        variant?: ListItemVariant;
        color?: ColorTokens | string;
    }> & {
        children?: ReactNode;
        scope?: string;
    }>;
    Frame: import("@gui/web").GuiComponent<import("@gui/web").TamaDefer, import("@gui/web").GuiElement, import("@gui/web").StackNonStyleProps, import("@gui/web").StackStyleBase, {
        size?: SizeTokens | undefined;
        variant?: "outlined" | undefined;
        disabled?: boolean | undefined;
        unstyled?: boolean | undefined;
        active?: boolean | undefined;
    }, import("@gui/web").StaticConfigPublic>;
    Text: import("@gui/web").GuiComponent<import("@gui/web").TamaDefer, import("@gui/web").GuiTextElement, import("@gui/web").TextNonStyleProps, import("@gui/web").TextStylePropsBase, {
        size?: FontSizeTokens | undefined;
        unstyled?: boolean | undefined;
    }, import("@gui/web").StaticConfigPublic>;
    Subtitle: import("@gui/web").GuiComponent<import("@gui/web").TamaDefer, import("@gui/web").GuiTextElement, import("@gui/web").TextNonStyleProps, import("@gui/web").TextStylePropsBase, {
        size?: SizeTokens | FontSizeTokens | undefined;
        unstyled?: boolean | undefined;
    }, import("@gui/web").StaticConfigPublic>;
    Icon: (props: {
        children: React.ReactNode;
        size?: SizeTokens;
        scaleIcon?: number;
    }) => any;
    Title: import("@gui/web").GuiComponent<import("@gui/web").TamaDefer, import("@gui/web").GuiTextElement, import("@gui/web").TextNonStyleProps, import("@gui/web").TextStylePropsBase, {
        size?: FontSizeTokens | undefined;
        unstyled?: boolean | undefined;
    }, import("@gui/web").StaticConfigPublic>;
};
export {};
//# sourceMappingURL=ListItem.d.ts.map