import type * as BaseMenuTypes from '@gui/create-menu';
import { type MenuArrowProps as BaseMenuArrowProps, type MenuCheckboxItemProps as BaseMenuCheckboxItemProps, type MenuContentProps as BaseMenuContentProps, type MenuGroupProps as BaseMenuGroupProps, type MenuItemIndicatorProps as BaseMenuItemIndicatorProps, type MenuItemProps as BaseMenuItemProps, type MenuLabelProps as BaseMenuLabelProps, type MenuPortalProps as BaseMenuPortalProps, type MenuRadioGroupProps as BaseMenuRadioGroupProps, type MenuRadioItemProps as BaseMenuRadioItemProps, type MenuSubContentProps as BaseMenuSubContentProps, type MenuSubTriggerProps as BaseMenuSubTriggerProps, type CreateBaseMenuProps } from '@gui/create-menu';
import { type ScrollViewProps } from '@gui/scroll-view';
import { type GuiElement, type ViewProps } from '@gui/web';
import * as React from 'react';
type Direction = 'ltr' | 'rtl';
export declare const DROPDOWN_MENU_CONTEXT = "MenuContext";
type ScopedProps<P> = P & {
    scope?: string;
};
interface MenuProps extends BaseMenuTypes.MenuProps {
    children?: React.ReactNode;
    dir?: Direction;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?(open: boolean): void;
    modal?: boolean;
}
interface MenuTriggerProps extends ViewProps {
    onKeydown?(event: React.KeyboardEvent): void;
}
type MenuPortalProps = BaseMenuPortalProps;
interface MenuContentProps extends Omit<BaseMenuContentProps, 'onEntryFocus'> {
}
type MenuGroupProps = BaseMenuGroupProps;
type MenuLabelProps = BaseMenuLabelProps;
type MenuItemProps = BaseMenuItemProps;
type MenuCheckboxItemProps = BaseMenuCheckboxItemProps;
type MenuRadioGroupProps = BaseMenuRadioGroupProps;
type MenuRadioItemProps = BaseMenuRadioItemProps;
type MenuItemIndicatorProps = BaseMenuItemIndicatorProps;
type MenuArrowProps = BaseMenuArrowProps;
type MenuSubProps = BaseMenuTypes.MenuSubProps & {
    children?: React.ReactNode;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?(open: boolean): void;
};
type MenuSubTriggerProps = BaseMenuSubTriggerProps;
type MenuSubContentProps = BaseMenuSubContentProps;
type MenuScrollViewProps = ScrollViewProps;
export declare function createNonNativeMenu(params: CreateBaseMenuProps): {
    (props: ScopedProps<MenuProps>): import("react/jsx-runtime").JSX.Element;
    displayName: string;
} & {
    Root: {
        (props: ScopedProps<MenuProps>): import("react/jsx-runtime").JSX.Element;
        displayName: string;
    };
    Trigger: import("@gui/web").GuiComponent<Omit<ViewProps, "scope" | keyof MenuTriggerProps> & MenuTriggerProps & {
        scope?: string;
    }, GuiElement, import("@gui/web").StackNonStyleProps & MenuTriggerProps & {
        scope?: string;
    }, import("@gui/web").StackStyleBase, {}, {}>;
    Portal: {
        (props: ScopedProps<MenuPortalProps>): import("react/jsx-runtime").JSX.Element;
        displayName: string;
    };
    Content: React.ForwardRefExoticComponent<MenuContentProps & {
        scope?: string;
    } & React.RefAttributes<GuiElement>>;
    Group: import("@gui/web").GuiComponent<Omit<import("@gui/web").GetFinalProps<import("@gui/web").StackNonStyleProps, import("@gui/web").StackStyleBase, {
        unstyled?: boolean | undefined;
    }>, keyof BaseMenuTypes.MenuGroupProps> & BaseMenuTypes.MenuGroupProps, GuiElement, import("@gui/web").StackNonStyleProps & BaseMenuTypes.MenuGroupProps, import("@gui/web").StackStyleBase, {
        unstyled?: boolean | undefined;
    }, import("@gui/web").StaticConfigPublic>;
    Label: import("@gui/web").GuiComponent<Omit<import("@gui/web").GetFinalProps<import("@gui/web").TextNonStyleProps, import("@gui/web").TextStylePropsBase, {
        unstyled?: boolean | undefined;
        size?: import("@gui/web").FontSizeTokens | undefined;
    }>, keyof BaseMenuTypes.MenuLabelProps> & BaseMenuTypes.MenuLabelProps, import("@gui/web").GuiTextElement, import("@gui/web").TextNonStyleProps & BaseMenuTypes.MenuLabelProps, import("@gui/web").TextStylePropsBase, {
        unstyled?: boolean | undefined;
        size?: import("@gui/web").FontSizeTokens | undefined;
    }, import("@gui/web").StaticConfigPublic>;
    Item: import("@gui/web").GuiComponent<Omit<import("@gui/web").GetFinalProps<import("@gui/web").StackNonStyleProps, import("@gui/web").StackStyleBase, {
        unstyled?: boolean | undefined;
    }>, "scope" | keyof BaseMenuTypes.MenuItemProps> & BaseMenuTypes.MenuItemProps & {
        scope?: string;
    }, GuiElement, import("@gui/web").StackNonStyleProps & BaseMenuTypes.MenuItemProps & {
        scope?: string;
    }, import("@gui/web").StackStyleBase, {
        unstyled?: boolean | undefined;
    }, import("@gui/web").StaticConfigPublic>;
    CheckboxItem: import("@gui/web").GuiComponent<Omit<import("@gui/web").GetFinalProps<import("@gui/web").StackNonStyleProps, import("@gui/web").StackStyleBase, {
        unstyled?: boolean | undefined;
    }>, "scope" | keyof BaseMenuTypes.MenuCheckboxItemProps> & BaseMenuTypes.MenuCheckboxItemProps & {
        scope?: string;
    }, GuiElement, import("@gui/web").StackNonStyleProps & BaseMenuTypes.MenuCheckboxItemProps & {
        scope?: string;
    }, import("@gui/web").StackStyleBase, {
        unstyled?: boolean | undefined;
    }, import("@gui/web").StaticConfigPublic>;
    RadioGroup: import("@gui/web").GuiComponent<Omit<import("@gui/web").GetFinalProps<import("@gui/web").StackNonStyleProps, import("@gui/web").StackStyleBase, {
        unstyled?: boolean | undefined;
    }>, "scope" | keyof BaseMenuTypes.MenuRadioGroupProps> & BaseMenuTypes.MenuRadioGroupProps & {
        scope?: string;
    }, GuiElement, import("@gui/web").StackNonStyleProps & BaseMenuTypes.MenuRadioGroupProps & {
        scope?: string;
    }, import("@gui/web").StackStyleBase, {
        unstyled?: boolean | undefined;
    }, import("@gui/web").StaticConfigPublic>;
    RadioItem: import("@gui/web").GuiComponent<Omit<import("@gui/web").GetFinalProps<import("@gui/web").StackNonStyleProps, import("@gui/web").StackStyleBase, {
        unstyled?: boolean | undefined;
    }>, "scope" | keyof BaseMenuTypes.MenuRadioItemProps> & BaseMenuTypes.MenuRadioItemProps & {
        scope?: string;
    }, GuiElement, import("@gui/web").StackNonStyleProps & BaseMenuTypes.MenuRadioItemProps & {
        scope?: string;
    }, import("@gui/web").StackStyleBase, {
        unstyled?: boolean | undefined;
    }, import("@gui/web").StaticConfigPublic>;
    ItemIndicator: import("@gui/web").GuiComponent<Omit<import("@gui/web").GetFinalProps<import("@gui/web").StackNonStyleProps, import("@gui/web").StackStyleBase, {
        unstyled?: boolean | undefined;
    }>, "scope" | keyof BaseMenuTypes.MenuItemIndicatorProps> & BaseMenuTypes.MenuItemIndicatorProps & {
        scope?: string;
    }, GuiElement, import("@gui/web").StackNonStyleProps & BaseMenuTypes.MenuItemIndicatorProps & {
        scope?: string;
    }, import("@gui/web").StackStyleBase, {
        unstyled?: boolean | undefined;
    }, import("@gui/web").StaticConfigPublic>;
    Separator: import("@gui/web").GuiComponent<Omit<import("@gui/web").GetFinalProps<import("@gui/web").StackNonStyleProps, import("@gui/web").StackStyleBase, {
        unstyled?: boolean | undefined;
    }>, keyof BaseMenuTypes.MenuSeparatorProps> & BaseMenuTypes.MenuSeparatorProps, GuiElement, import("@gui/web").StackNonStyleProps & BaseMenuTypes.MenuSeparatorProps, import("@gui/web").StackStyleBase, {
        unstyled?: boolean | undefined;
    }, import("@gui/web").StaticConfigPublic>;
    Arrow: React.ForwardRefExoticComponent<BaseMenuTypes.MenuArrowProps & React.RefAttributes<GuiElement>>;
    Sub: {
        (props: ScopedProps<MenuSubProps>): import("react/jsx-runtime").JSX.Element;
        displayName: string;
    };
    SubTrigger: React.ForwardRefExoticComponent<BaseMenuTypes.MenuSubTriggerProps & {
        scope?: string;
    } & React.RefAttributes<GuiElement>>;
    SubContent: React.ForwardRefExoticComponent<BaseMenuTypes.MenuSubContentProps & {
        scope?: string;
    } & React.RefAttributes<GuiElement>>;
    ItemTitle: import("@gui/web").GuiComponent<Omit<import("@gui/web").GetFinalProps<import("@gui/web").TextNonStyleProps, import("@gui/web").TextStylePropsBase, {
        unstyled?: boolean | undefined;
        size?: import("@gui/web").FontSizeTokens | undefined;
    }>, keyof BaseMenuTypes.MenuItemTitleProps> & BaseMenuTypes.MenuItemTitleProps, import("@gui/web").GuiTextElement, import("@gui/web").TextNonStyleProps & BaseMenuTypes.MenuItemTitleProps, import("@gui/web").TextStylePropsBase, {
        unstyled?: boolean | undefined;
        size?: import("@gui/web").FontSizeTokens | undefined;
    }, import("@gui/web").StaticConfigPublic>;
    ItemSubtitle: import("@gui/web").GuiComponent<Omit<import("@gui/web").GetFinalProps<import("@gui/web").TextNonStyleProps, import("@gui/web").TextStylePropsBase, {
        unstyled?: boolean | undefined;
        size?: import("@gui/web").FontSizeTokens | undefined;
    }>, keyof BaseMenuTypes.MenuItemSubTitleProps> & BaseMenuTypes.MenuItemSubTitleProps, import("@gui/web").GuiTextElement, import("@gui/web").TextNonStyleProps & BaseMenuTypes.MenuItemSubTitleProps, import("@gui/web").TextStylePropsBase, {
        unstyled?: boolean | undefined;
        size?: import("@gui/web").FontSizeTokens | undefined;
    }, import("@gui/web").StaticConfigPublic>;
    ItemImage: React.ForwardRefExoticComponent<import("react-native").ImageProps & React.RefAttributes<import("react-native").Image>>;
    ItemIcon: import("@gui/web").GuiComponent<Omit<import("@gui/web").GetFinalProps<import("@gui/web").StackNonStyleProps, import("@gui/web").StackStyleBase, {
        unstyled?: boolean | undefined;
    }>, `$${string}` | `$${number}` | import("@gui/web").GroupMediaKeys | `$theme-${string}` | `$theme-${number}` | keyof import("@gui/web").StackStyleBase | keyof import("@gui/web").StackNonStyleProps | keyof import("@gui/web").WithPseudoProps<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>>>> & import("@gui/web").StackNonStyleProps & import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>> & import("@gui/web").WithPseudoProps<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>>> & import("@gui/web").WithMediaProps<import("@gui/web").WithThemeShorthandsAndPseudos<import("@gui/web").StackStyleBase, {}>>, GuiElement, import("@gui/web").StackNonStyleProps & import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>> & import("@gui/web").WithPseudoProps<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>>> & import("@gui/web").WithMediaProps<import("@gui/web").WithThemeShorthandsAndPseudos<import("@gui/web").StackStyleBase, {}>>, import("@gui/web").StackStyleBase, {
        unstyled?: boolean | undefined;
    }, import("@gui/web").StaticConfigPublic>;
    ScrollView: import("@gui/web").GuiComponent<import("@gui/web").TamaDefer, import("react-native").ScrollView, import("@gui/web").GuiComponentPropsBaseBase & import("react-native").ScrollViewProps, import("@gui/web").StackStyleBase & {
        readonly contentContainerStyle?: Partial<import("@gui/web").InferStyleProps<typeof import("react-native").ScrollView, {
            accept: {
                readonly contentContainerStyle: "style";
            };
        }>> | undefined;
    }, {
        fullscreen?: boolean | undefined;
    }, {
        accept: {
            readonly contentContainerStyle: "style";
        };
    } & import("@gui/web").StaticConfigPublic>;
};
export type { MenuArrowProps, MenuCheckboxItemProps, MenuContentProps, MenuGroupProps, MenuItemIndicatorProps, MenuItemProps, MenuLabelProps, MenuPortalProps, MenuProps, MenuRadioGroupProps, MenuRadioItemProps, MenuScrollViewProps, MenuSubContentProps, MenuSubProps, MenuSubTriggerProps, MenuTriggerProps, };
//# sourceMappingURL=createNonNativeMenu.d.ts.map