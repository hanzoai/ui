import { Dismissable as DismissableLayer } from '@gui/dismissable';
import { FocusScope } from '@gui/focus-scope';
import type { PopperContentProps } from '@gui/popper';
import * as PopperPrimitive from '@gui/popper';
import type { RovingFocusGroupProps } from '@gui/roving-focus';
import type { TextProps } from '@gui/web';
import { type ViewProps, View } from '@gui/web';
import type { GuiElement } from '@gui/web/types';
import * as React from 'react';
import type { Image, ImageProps } from 'react-native';
import { MenuPredefined } from './MenuPredefined';
type Direction = 'ltr' | 'rtl';
type ScopedProps<P> = P & {
    scope?: string;
};
interface MenuBaseProps extends PopperPrimitive.PopperProps {
    children?: React.ReactNode;
    open?: boolean;
    onOpenChange?(open: boolean): void;
    dir?: Direction;
    modal?: boolean;
    native?: boolean;
}
type PopperAnchorProps = React.ComponentPropsWithoutRef<typeof PopperPrimitive.PopperAnchor>;
interface MenuAnchorProps extends PopperAnchorProps {
}
interface MenuPortalProps {
    children?: React.ReactNode;
    /**
     * Used to force mounting when more control is needed. Useful when
     * controlling animation with React animation libraries.
     */
    forceMount?: boolean;
    zIndex?: number;
}
/**
 * We purposefully don't union MenuRootContent and MenuSubContent props here because
 * they have conflicting prop types. We agreed that we would allow MenuSubContent to
 * accept props that it would just ignore.
 */
interface MenuContentProps extends MenuRootContentTypeProps {
    /**
     * Used to force mounting when more control is needed. Useful when
     * controlling animation with React animation libraries.
     */
    forceMount?: boolean;
}
interface MenuRootContentTypeProps extends Omit<MenuContentImplProps, keyof MenuContentImplPrivateProps> {
}
type MenuContentImplElement = React.ElementRef<typeof PopperPrimitive.PopperContent>;
type FocusScopeProps = React.ComponentPropsWithoutRef<typeof FocusScope>;
type DismissableLayerProps = React.ComponentPropsWithoutRef<typeof DismissableLayer>;
type MenuContentImplPrivateProps = {
    onOpenAutoFocus?: FocusScopeProps['onMountAutoFocus'];
    onDismiss?: DismissableLayerProps['onDismiss'];
    disableOutsidePointerEvents?: DismissableLayerProps['disableOutsidePointerEvents'];
    /**
     * Whether scrolling outside the `MenuContent` should be prevented
     * (default: `false`)
     */
    disableOutsideScroll?: boolean;
    /**
     * Whether focus should be trapped within the `MenuContent`
     * (default: false)
     */
    trapFocus?: FocusScopeProps['trapped'];
    /**
     * Whether to disable dismissing the menu when the user scrolls outside of it
     * (default: false, meaning scroll will dismiss on web)
     */
    disableDismissOnScroll?: boolean;
};
interface MenuContentImplProps extends MenuContentImplPrivateProps, Omit<PopperContentProps, 'dir' | 'onPlaced'> {
    /**
     * Event handler called when auto-focusing on close.
     * Can be prevented.
     */
    onCloseAutoFocus?: FocusScopeProps['onUnmountAutoFocus'];
    /**
     * Whether keyboard navigation should loop around
     * @defaultValue false
     */
    loop?: RovingFocusGroupProps['loop'];
    onEntryFocus?: RovingFocusGroupProps['onEntryFocus'];
    onEscapeKeyDown?: DismissableLayerProps['onEscapeKeyDown'];
    onPointerDownOutside?: DismissableLayerProps['onPointerDownOutside'];
    onFocusOutside?: DismissableLayerProps['onFocusOutside'];
    onInteractOutside?: DismissableLayerProps['onInteractOutside'];
}
interface MenuGroupProps extends ViewProps {
}
interface MenuLabelProps extends ViewProps {
}
interface MenuItemProps extends Omit<MenuItemImplProps, 'onSelect'> {
    onSelect?: (event: Event) => void;
    unstyled?: boolean;
    /**
     * Prevents the menu from closing when this item is selected.
     * Useful for toggle items or multi-select scenarios.
     */
    preventCloseOnSelect?: boolean;
}
interface MenuItemImplProps extends ViewProps {
    disabled?: boolean;
    textValue?: string;
    unstyled?: boolean;
}
interface MenuItemTitleProps extends TextProps {
}
interface MenuItemSubTitleProps extends TextProps {
}
type MenuItemIconProps = ViewProps;
type CheckedState = boolean | 'indeterminate';
interface MenuCheckboxItemProps extends MenuItemProps {
    checked?: CheckedState;
    onCheckedChange?: (checked: boolean) => void;
}
interface MenuRadioGroupProps extends MenuGroupProps {
    value?: string;
    onValueChange?: (value: string) => void;
}
interface MenuRadioItemProps extends MenuItemProps {
    value: string;
}
type PrimitiveSpanProps = React.ComponentPropsWithoutRef<typeof View>;
interface MenuItemIndicatorProps extends PrimitiveSpanProps {
    /**
     * Used to force mounting when more control is needed. Useful when
     * controlling animation with React animation libraries.
     */
    forceMount?: boolean;
}
interface MenuSeparatorProps extends ViewProps {
}
type PopperArrowProps = React.ComponentPropsWithoutRef<typeof PopperPrimitive.PopperArrow>;
interface MenuArrowProps extends PopperArrowProps {
    unstyled?: boolean;
}
export interface MenuSubProps extends PopperPrimitive.PopperProps {
    children?: React.ReactNode;
    open?: boolean;
    onOpenChange?(open: boolean): void;
}
interface MenuSubTriggerProps extends MenuItemImplProps {
}
export type MenuSubContentElement = MenuContentImplElement;
export interface MenuSubContentProps extends Omit<MenuContentImplProps, keyof MenuContentImplPrivateProps | 'onCloseAutoFocus' | 'onEntryFocus' | 'side' | 'align'> {
    /**
     * Used to force mounting when more control is needed. Useful when
     * controlling animation with React animation libraries.
     */
    forceMount?: boolean;
}
export type CreateBaseMenuProps = {
    Item?: typeof MenuPredefined.MenuItem;
    MenuGroup?: typeof MenuPredefined.MenuGroup;
    Title?: typeof MenuPredefined.Title;
    SubTitle?: typeof MenuPredefined.SubTitle;
    Image?: React.ElementType;
    Icon?: typeof MenuPredefined.MenuIcon;
    Indicator?: typeof MenuPredefined.MenuIndicator;
    Separator?: typeof MenuPredefined.MenuSeparator;
    Label?: typeof MenuPredefined.MenuLabel;
};
export declare function createBaseMenu({ Item: _Item, Title: _Title, SubTitle: _SubTitle, Image: _Image, Icon: _Icon, Indicator: _Indicator, Separator: _Separator, MenuGroup: _MenuGroup, Label: _Label, }: CreateBaseMenuProps): {
    Menu: {
        (props: ScopedProps<MenuBaseProps>): import("react/jsx-runtime").JSX.Element;
        displayName: string;
    } & {
        Anchor: {
            (props: MenuAnchorProps): import("react/jsx-runtime").JSX.Element;
            displayName: string;
        };
        Portal: {
            (props: ScopedProps<MenuPortalProps>): import("react/jsx-runtime").JSX.Element;
            displayName: string;
        };
        Content: import("@gui/web").GuiComponent<Omit<import("@gui/web").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {
            size?: import("@gui/web").SizeTokens | undefined;
            unstyled?: boolean | undefined;
            elevation?: number | import("@gui/web").SizeTokens | undefined;
            fullscreen?: boolean | undefined;
        }>, keyof MenuContentProps> & MenuContentProps & {
            scope?: string;
        }, GuiElement, import("@gui/core").RNGuiViewNonStyleProps & MenuContentProps & {
            scope?: string;
        }, import("@gui/web").StackStyleBase, {
            size?: import("@gui/web").SizeTokens | undefined;
            unstyled?: boolean | undefined;
            elevation?: number | import("@gui/web").SizeTokens | undefined;
            fullscreen?: boolean | undefined;
        }, import("@gui/web").StaticConfigPublic>;
        Group: import("@gui/web").GuiComponent<Omit<import("@gui/web").GetFinalProps<import("@gui/web").StackNonStyleProps, import("@gui/web").StackStyleBase, {
            unstyled?: boolean | undefined;
        }>, keyof MenuGroupProps> & MenuGroupProps, GuiElement, import("@gui/web").StackNonStyleProps & MenuGroupProps, import("@gui/web").StackStyleBase, {
            unstyled?: boolean | undefined;
        }, import("@gui/web").StaticConfigPublic>;
        Label: import("@gui/web").GuiComponent<Omit<import("@gui/web").GetFinalProps<import("@gui/web").TextNonStyleProps, import("@gui/web").TextStylePropsBase, {
            unstyled?: boolean | undefined;
            size?: import("@gui/web").FontSizeTokens | undefined;
        }>, keyof MenuLabelProps> & MenuLabelProps, import("@gui/web").GuiTextElement, import("@gui/web").TextNonStyleProps & MenuLabelProps, import("@gui/web").TextStylePropsBase, {
            unstyled?: boolean | undefined;
            size?: import("@gui/web").FontSizeTokens | undefined;
        }, import("@gui/web").StaticConfigPublic>;
        Item: import("@gui/web").GuiComponent<Omit<import("@gui/web").GetFinalProps<import("@gui/web").StackNonStyleProps, import("@gui/web").StackStyleBase, {
            unstyled?: boolean | undefined;
        }>, "scope" | keyof MenuItemProps> & MenuItemProps & {
            scope?: string;
        }, GuiElement, import("@gui/web").StackNonStyleProps & MenuItemProps & {
            scope?: string;
        }, import("@gui/web").StackStyleBase, {
            unstyled?: boolean | undefined;
        }, import("@gui/web").StaticConfigPublic>;
        CheckboxItem: import("@gui/web").GuiComponent<Omit<import("@gui/web").GetFinalProps<import("@gui/web").StackNonStyleProps, import("@gui/web").StackStyleBase, {
            unstyled?: boolean | undefined;
        }>, "scope" | keyof MenuCheckboxItemProps> & MenuCheckboxItemProps & {
            scope?: string;
        }, GuiElement, import("@gui/web").StackNonStyleProps & MenuCheckboxItemProps & {
            scope?: string;
        }, import("@gui/web").StackStyleBase, {
            unstyled?: boolean | undefined;
        }, import("@gui/web").StaticConfigPublic>;
        RadioGroup: import("@gui/web").GuiComponent<Omit<import("@gui/web").GetFinalProps<import("@gui/web").StackNonStyleProps, import("@gui/web").StackStyleBase, {
            unstyled?: boolean | undefined;
        }>, "scope" | keyof MenuRadioGroupProps> & MenuRadioGroupProps & {
            scope?: string;
        }, GuiElement, import("@gui/web").StackNonStyleProps & MenuRadioGroupProps & {
            scope?: string;
        }, import("@gui/web").StackStyleBase, {
            unstyled?: boolean | undefined;
        }, import("@gui/web").StaticConfigPublic>;
        RadioItem: import("@gui/web").GuiComponent<Omit<import("@gui/web").GetFinalProps<import("@gui/web").StackNonStyleProps, import("@gui/web").StackStyleBase, {
            unstyled?: boolean | undefined;
        }>, "scope" | keyof MenuRadioItemProps> & MenuRadioItemProps & {
            scope?: string;
        }, GuiElement, import("@gui/web").StackNonStyleProps & MenuRadioItemProps & {
            scope?: string;
        }, import("@gui/web").StackStyleBase, {
            unstyled?: boolean | undefined;
        }, import("@gui/web").StaticConfigPublic>;
        ItemIndicator: import("@gui/web").GuiComponent<Omit<import("@gui/web").GetFinalProps<import("@gui/web").StackNonStyleProps, import("@gui/web").StackStyleBase, {
            unstyled?: boolean | undefined;
        }>, "scope" | keyof MenuItemIndicatorProps> & MenuItemIndicatorProps & {
            scope?: string;
        }, GuiElement, import("@gui/web").StackNonStyleProps & MenuItemIndicatorProps & {
            scope?: string;
        }, import("@gui/web").StackStyleBase, {
            unstyled?: boolean | undefined;
        }, import("@gui/web").StaticConfigPublic>;
        Separator: import("@gui/web").GuiComponent<Omit<import("@gui/web").GetFinalProps<import("@gui/web").StackNonStyleProps, import("@gui/web").StackStyleBase, {
            unstyled?: boolean | undefined;
        }>, keyof MenuSeparatorProps> & MenuSeparatorProps, GuiElement, import("@gui/web").StackNonStyleProps & MenuSeparatorProps, import("@gui/web").StackStyleBase, {
            unstyled?: boolean | undefined;
        }, import("@gui/web").StaticConfigPublic>;
        Arrow: React.ForwardRefExoticComponent<MenuArrowProps & React.RefAttributes<GuiElement>>;
        Sub: React.FC<ScopedProps<MenuSubProps>>;
        SubTrigger: React.ForwardRefExoticComponent<MenuSubTriggerProps & {
            scope?: string;
        } & React.RefAttributes<GuiElement>>;
        SubContent: import("@gui/web").GuiComponent<Omit<import("@gui/web").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {
            size?: import("@gui/web").SizeTokens | undefined;
            unstyled?: boolean | undefined;
            elevation?: number | import("@gui/web").SizeTokens | undefined;
            fullscreen?: boolean | undefined;
        }>, keyof MenuSubContentProps> & MenuSubContentProps & {
            scope?: string;
        }, GuiElement, import("@gui/core").RNGuiViewNonStyleProps & MenuSubContentProps & {
            scope?: string;
        }, import("@gui/web").StackStyleBase, {
            size?: import("@gui/web").SizeTokens | undefined;
            unstyled?: boolean | undefined;
            elevation?: number | import("@gui/web").SizeTokens | undefined;
            fullscreen?: boolean | undefined;
        }, import("@gui/web").StaticConfigPublic>;
        ItemTitle: import("@gui/web").GuiComponent<Omit<import("@gui/web").GetFinalProps<import("@gui/web").TextNonStyleProps, import("@gui/web").TextStylePropsBase, {
            unstyled?: boolean | undefined;
            size?: import("@gui/web").FontSizeTokens | undefined;
        }>, keyof MenuItemTitleProps> & MenuItemTitleProps, import("@gui/web").GuiTextElement, import("@gui/web").TextNonStyleProps & MenuItemTitleProps, import("@gui/web").TextStylePropsBase, {
            unstyled?: boolean | undefined;
            size?: import("@gui/web").FontSizeTokens | undefined;
        }, import("@gui/web").StaticConfigPublic>;
        ItemSubtitle: import("@gui/web").GuiComponent<Omit<import("@gui/web").GetFinalProps<import("@gui/web").TextNonStyleProps, import("@gui/web").TextStylePropsBase, {
            unstyled?: boolean | undefined;
            size?: import("@gui/web").FontSizeTokens | undefined;
        }>, keyof MenuItemSubTitleProps> & MenuItemSubTitleProps, import("@gui/web").GuiTextElement, import("@gui/web").TextNonStyleProps & MenuItemSubTitleProps, import("@gui/web").TextStylePropsBase, {
            unstyled?: boolean | undefined;
            size?: import("@gui/web").FontSizeTokens | undefined;
        }, import("@gui/web").StaticConfigPublic>;
        ItemImage: React.ForwardRefExoticComponent<ImageProps & React.RefAttributes<Image>>;
        ItemIcon: import("@gui/web").GuiComponent<Omit<import("@gui/web").GetFinalProps<import("@gui/web").StackNonStyleProps, import("@gui/web").StackStyleBase, {
            unstyled?: boolean | undefined;
        }>, `$${string}` | `$${number}` | import("@gui/web").GroupMediaKeys | `$theme-${string}` | `$theme-${number}` | keyof import("@gui/web").StackStyleBase | keyof import("@gui/web").StackNonStyleProps | keyof import("@gui/web").WithPseudoProps<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>>>> & import("@gui/web").StackNonStyleProps & import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>> & import("@gui/web").WithPseudoProps<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>>> & import("@gui/web").WithMediaProps<import("@gui/web").WithThemeShorthandsAndPseudos<import("@gui/web").StackStyleBase, {}>>, GuiElement, import("@gui/web").StackNonStyleProps & import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>> & import("@gui/web").WithPseudoProps<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>>> & import("@gui/web").WithMediaProps<import("@gui/web").WithThemeShorthandsAndPseudos<import("@gui/web").StackStyleBase, {}>>, import("@gui/web").StackStyleBase, {
            unstyled?: boolean | undefined;
        }, import("@gui/web").StaticConfigPublic>;
    };
};
export type { MenuAnchorProps, MenuArrowProps, MenuCheckboxItemProps, MenuContentProps, MenuGroupProps, MenuItemIconProps, MenuItemIndicatorProps, MenuItemProps, MenuItemSubTitleProps, MenuItemTitleProps, MenuLabelProps, MenuPortalProps, MenuBaseProps as MenuProps, MenuRadioGroupProps, MenuRadioItemProps, MenuSeparatorProps, MenuSubTriggerProps, };
//# sourceMappingURL=createBaseMenu.d.ts.map