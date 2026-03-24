import type { GetProps, GuiElement, ViewStyle } from '@gui/web';
import * as React from 'react';
export declare const ToggleFrame: import("@gui/web").GuiComponent<import("@gui/web").TamaDefer, GuiElement, import("@gui/web").StackNonStyleProps, import("@gui/web").StackStyleBase & {
    readonly activeStyle?: Partial<import("@gui/web").InferStyleProps<import("@gui/web").GuiComponent<import("@gui/web").ViewProps, GuiElement, import("@gui/web").StackNonStyleProps, import("@gui/web").StackStyleBase, {}, {}>, {
        accept: {
            readonly activeStyle: "style";
        };
    }>> | undefined;
}, {
    unstyled?: boolean | undefined;
    size?: number | import("@gui/web").SizeTokens | undefined;
    defaultActiveStyle?: boolean | undefined;
}, {
    accept: {
        readonly activeStyle: "style";
    };
}>;
type ToggleFrameProps = GetProps<typeof ToggleFrame>;
type ToggleItemExtraProps = {
    orientation?: 'horizontal' | 'vertical';
    defaultValue?: string;
    disabled?: boolean;
    active?: boolean;
    defaultActive?: boolean;
    onActiveChange?(active: boolean): void;
    activeStyle?: ViewStyle | null;
    activeTheme?: string | null;
};
export type ToggleProps = ToggleFrameProps & ToggleItemExtraProps;
export declare const Toggle: React.ForwardRefExoticComponent<Omit<import("@gui/web").StackNonStyleProps, "unstyled" | keyof import("@gui/web").StackStyleBase | "size" | "activeStyle" | "defaultActiveStyle"> & import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase & {
    readonly activeStyle?: Partial<import("@gui/web").InferStyleProps<import("@gui/web").GuiComponent<import("@gui/web").ViewProps, GuiElement, import("@gui/web").StackNonStyleProps, import("@gui/web").StackStyleBase, {}, {}>, {
        accept: {
            readonly activeStyle: "style";
        };
    }>> | undefined;
}> & {
    unstyled?: boolean | undefined;
    size?: number | import("@gui/web").SizeTokens | undefined;
    defaultActiveStyle?: boolean | undefined;
} & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase & {
    readonly activeStyle?: Partial<import("@gui/web").InferStyleProps<import("@gui/web").GuiComponent<import("@gui/web").ViewProps, GuiElement, import("@gui/web").StackNonStyleProps, import("@gui/web").StackStyleBase, {}, {}>, {
        accept: {
            readonly activeStyle: "style";
        };
    }>> | undefined;
}>> & import("@gui/web").WithPseudoProps<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase & {
    readonly activeStyle?: Partial<import("@gui/web").InferStyleProps<import("@gui/web").GuiComponent<import("@gui/web").ViewProps, GuiElement, import("@gui/web").StackNonStyleProps, import("@gui/web").StackStyleBase, {}, {}>, {
        accept: {
            readonly activeStyle: "style";
        };
    }>> | undefined;
}> & {
    unstyled?: boolean | undefined;
    size?: number | import("@gui/web").SizeTokens | undefined;
    defaultActiveStyle?: boolean | undefined;
} & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase & {
    readonly activeStyle?: Partial<import("@gui/web").InferStyleProps<import("@gui/web").GuiComponent<import("@gui/web").ViewProps, GuiElement, import("@gui/web").StackNonStyleProps, import("@gui/web").StackStyleBase, {}, {}>, {
        accept: {
            readonly activeStyle: "style";
        };
    }>> | undefined;
}>>> & import("@gui/web").WithMediaProps<import("@gui/web").WithThemeShorthandsAndPseudos<import("@gui/web").StackStyleBase & {
    readonly activeStyle?: Partial<import("@gui/web").InferStyleProps<import("@gui/web").GuiComponent<import("@gui/web").ViewProps, GuiElement, import("@gui/web").StackNonStyleProps, import("@gui/web").StackStyleBase, {}, {}>, {
        accept: {
            readonly activeStyle: "style";
        };
    }>> | undefined;
}, {
    unstyled?: boolean | undefined;
    size?: number | import("@gui/web").SizeTokens | undefined;
    defaultActiveStyle?: boolean | undefined;
}>> & ToggleItemExtraProps & React.RefAttributes<GuiElement>>;
export {};
//# sourceMappingURL=Toggle.d.ts.map