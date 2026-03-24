import type { ColorTokens, GetProps, SizeTokens } from '@gui/web';
import type { FunctionComponent, JSX } from 'react';
type ButtonVariant = 'outlined';
export declare const ButtonContext: import("@gui/web").StyledContext<{
    size?: SizeTokens;
    variant?: ButtonVariant;
    color?: ColorTokens | string;
}>;
type IconProp = JSX.Element | FunctionComponent<{
    color?: any;
    size?: any;
}> | null;
type ButtonExtraProps = {
    icon?: IconProp;
    iconAfter?: IconProp;
    scaleIcon?: number;
    iconSize?: SizeTokens;
    type?: 'submit' | 'reset' | 'button';
    form?: string;
    formAction?: string;
    formEncType?: string;
    formMethod?: string;
    formNoValidate?: boolean;
    formTarget?: string;
    name?: string;
    value?: string | readonly string[] | number;
};
declare const ButtonComponent: import("@gui/web").GuiComponent<Omit<import("@gui/web").GetFinalProps<import("@gui/web").StackNonStyleProps, import("@gui/web").StackStyleBase, {
    size?: number | SizeTokens | undefined;
    variant?: "outlined" | undefined;
    elevation?: number | SizeTokens | undefined;
    circular?: boolean | undefined;
    chromeless?: boolean | "all" | undefined;
    disabled?: boolean | undefined;
    unstyled?: boolean | undefined;
}>, keyof ButtonExtraProps> & ButtonExtraProps, import("@gui/web").GuiElement, import("@gui/web").StackNonStyleProps & ButtonExtraProps, import("@gui/web").StackStyleBase, {
    size?: number | SizeTokens | undefined;
    variant?: "outlined" | undefined;
    elevation?: number | SizeTokens | undefined;
    circular?: boolean | undefined;
    chromeless?: boolean | "all" | undefined;
    disabled?: boolean | undefined;
    unstyled?: boolean | undefined;
}, import("@gui/web").StaticConfigPublic>;
export declare const Button: import("react").ForwardRefExoticComponent<Omit<import("@gui/web").GetFinalProps<import("@gui/web").StackNonStyleProps, import("@gui/web").StackStyleBase, {
    size?: number | SizeTokens | undefined;
    variant?: "outlined" | undefined;
    elevation?: number | SizeTokens | undefined;
    circular?: boolean | undefined;
    chromeless?: boolean | "all" | undefined;
    disabled?: boolean | undefined;
    unstyled?: boolean | undefined;
}>, keyof ButtonExtraProps> & ButtonExtraProps & import("react").RefAttributes<import("@gui/web").GuiElement>> & import("@gui/web").StaticComponentObject<Omit<import("@gui/web").GetFinalProps<import("@gui/web").StackNonStyleProps, import("@gui/web").StackStyleBase, {
    size?: number | SizeTokens | undefined;
    variant?: "outlined" | undefined;
    elevation?: number | SizeTokens | undefined;
    circular?: boolean | undefined;
    chromeless?: boolean | "all" | undefined;
    disabled?: boolean | undefined;
    unstyled?: boolean | undefined;
}>, keyof ButtonExtraProps> & ButtonExtraProps, import("@gui/web").GuiElement, import("@gui/web").StackNonStyleProps & ButtonExtraProps, import("@gui/web").StackStyleBase, {
    size?: number | SizeTokens | undefined;
    variant?: "outlined" | undefined;
    elevation?: number | SizeTokens | undefined;
    circular?: boolean | undefined;
    chromeless?: boolean | "all" | undefined;
    disabled?: boolean | undefined;
    unstyled?: boolean | undefined;
}, import("@gui/web").StaticConfigPublic> & Omit<import("@gui/web").StaticConfigPublic, "staticConfig" | "styleable"> & {
    __tama: [Omit<import("@gui/web").GetFinalProps<import("@gui/web").StackNonStyleProps, import("@gui/web").StackStyleBase, {
        size?: number | SizeTokens | undefined;
        variant?: "outlined" | undefined;
        elevation?: number | SizeTokens | undefined;
        circular?: boolean | undefined;
        chromeless?: boolean | "all" | undefined;
        disabled?: boolean | undefined;
        unstyled?: boolean | undefined;
    }>, keyof ButtonExtraProps> & ButtonExtraProps, import("@gui/web").GuiElement, import("@gui/web").StackNonStyleProps & ButtonExtraProps, import("@gui/web").StackStyleBase, {
        size?: number | SizeTokens | undefined;
        variant?: "outlined" | undefined;
        elevation?: number | SizeTokens | undefined;
        circular?: boolean | undefined;
        chromeless?: boolean | "all" | undefined;
        disabled?: boolean | undefined;
        unstyled?: boolean | undefined;
    }, import("@gui/web").StaticConfigPublic];
} & {
    Apply: import("react").Provider<{
        size?: SizeTokens;
        variant?: ButtonVariant;
        color?: ColorTokens | string;
        elevation?: SizeTokens | number;
    }> & import("react").ProviderExoticComponent<Partial<{
        size?: SizeTokens;
        variant?: ButtonVariant;
        color?: ColorTokens | string;
        elevation?: SizeTokens | number;
    }> & {
        children?: import("react").ReactNode;
        scope?: string;
    }>;
    Frame: import("@gui/web").GuiComponent<import("@gui/web").TamaDefer, import("@gui/web").GuiElement, import("@gui/web").StackNonStyleProps, import("@gui/web").StackStyleBase, {
        size?: number | SizeTokens | undefined;
        variant?: "outlined" | undefined;
        elevation?: number | SizeTokens | undefined;
        circular?: boolean | undefined;
        chromeless?: boolean | "all" | undefined;
        disabled?: boolean | undefined;
        unstyled?: boolean | undefined;
    }, import("@gui/web").StaticConfigPublic>;
    Text: import("@gui/web").GuiComponent<import("@gui/web").TamaDefer, import("@gui/web").GuiTextElement, import("@gui/web").TextNonStyleProps, import("@gui/web").TextStylePropsBase, {
        size?: import("@gui/web").FontSizeTokens | undefined;
        unstyled?: boolean | undefined;
    }, import("@gui/web").StaticConfigPublic>;
    Icon: (props: {
        children: React.ReactNode;
        scaleIcon?: number;
        size?: SizeTokens;
    }) => any;
};
export type ButtonProps = GetProps<typeof ButtonComponent>;
export {};
//# sourceMappingURL=Button.d.ts.map