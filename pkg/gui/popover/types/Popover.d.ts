import '@gui/polyfill-dev';
import type { UseHoverProps } from '@gui/floating';
import type { SizeTokens, GuiElement, ViewProps } from '@gui/core';
import { type DismissableProps } from '@gui/dismissable';
import type { FocusScopeProps } from '@gui/focus-scope';
import { type PopperArrowExtraProps, type PopperArrowProps, type PopperContentProps, type PopperProps } from '@gui/popper';
import { type ScrollViewProps } from '@gui/scroll-view';
import type { YStackProps } from '@gui/stacks';
import * as React from 'react';
type ScopedPopoverProps<P> = Omit<P, 'scope'> & {
    scope?: PopoverScopes;
};
export declare const hasOpenPopovers: () => boolean;
export declare const closeOpenPopovers: () => boolean;
export declare const closeLastOpenedPopover: () => boolean;
type PopoverVia = 'hover' | 'press';
export type PopoverProps = ScopedPopoverProps<PopperProps> & {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean, via?: PopoverVia) => void;
    /**
     * When true, children never un-mount, otherwise they mount on open.
     * When "lazy", they mount inside a startTransition after first render.
     *
     * @default false
     */
    keepChildrenMounted?: boolean | 'lazy';
    /**
     * Enable staying open while mouseover
     */
    hoverable?: boolean | UseHoverProps;
    /**
     * Disable focusing behavior on open
     */
    disableFocus?: boolean;
    /**
     * Disable the dismissable layer (escape key, outside click handling).
     * Useful for popovers that stay mounted but are visually hidden.
     */
    disableDismissable?: boolean;
    /**
     * z-index for the popover portal. Use this when popovers need to appear
     * above other portaled content like dialogs or fixed headers.
     *
     * By default, Gui automatically stacks overlays - later-opened content
     * appears above earlier content, and nested content appears above its parent.
     * Only set this if you need to override the automatic stacking behavior.
     *
     * @see https://gui.dev/ui/z-index
     */
    zIndex?: number;
};
export type PopoverScopes = string;
type PopoverContextValue = {
    popoverScope: string;
    adaptScope: string;
    id: string;
    triggerRef: React.RefObject<any>;
    contentId?: string;
    open: boolean;
    onOpenChange(open: boolean, via: 'hover' | 'press'): void;
    onOpenToggle(): void;
    hasCustomAnchor: boolean;
    onCustomAnchorAdd(): void;
    onCustomAnchorRemove(): void;
    size?: SizeTokens;
    breakpointActive?: boolean;
    keepChildrenMounted?: boolean | 'lazy';
    disableDismissable?: boolean;
    hoverable?: boolean | object;
    anchorTo?: Rect;
    branches: Set<HTMLElement>;
};
type PopoverTriggerStateSetter = React.Dispatch<React.SetStateAction<boolean>>;
type PopoverTriggerContextValue = {
    triggerRef: React.RefObject<any>;
    hasCustomAnchor: boolean;
    anchorTo?: Rect;
    branches: Set<HTMLElement>;
    onOpenToggle(): void;
    setActiveTrigger(id: string | null): void;
    registerTrigger(id: string, setOpen: PopoverTriggerStateSetter): void;
    unregisterTrigger(id: string): void;
};
export declare const PopoverContext: import("@gui/core").StyledContext<PopoverContextValue>;
export declare const PopoverZIndexContext: React.Context<number | undefined>;
export declare const PopoverTriggerContext: import("@gui/core").StyledContext<PopoverTriggerContextValue>;
export declare const usePopoverContext: (scope?: string) => PopoverContextValue;
export declare const usePopoverTriggerContext: (scope?: string) => PopoverTriggerContextValue;
/**
 * Read reactive popover open state from the popover context.
 */
export declare function usePopoverOpen(scope?: string): boolean;
/**
 * Hook to set up trigger registration/isolation logic.
 * Used internally by Popover and can be used by Tooltip.
 */
export declare function usePopoverTriggerSetup(open: boolean): {
    setActiveTrigger: (id: string | null) => void;
    registerTrigger: (id: string, setOpenState: PopoverTriggerStateSetter) => void;
    unregisterTrigger: (id: string) => void;
};
export type PopoverContextProviderProps = {
    scope: string;
    children: React.ReactNode;
    open: boolean;
    onOpenChange(open: boolean, via?: 'hover' | 'press'): void;
    onOpenToggle(): void;
    triggerRef: React.RefObject<any>;
    id?: string;
    contentId?: string;
    hasCustomAnchor?: boolean;
    onCustomAnchorAdd?: () => void;
    onCustomAnchorRemove?: () => void;
    anchorTo?: Rect;
    adaptScope?: string;
    breakpointActive?: boolean;
    keepChildrenMounted?: boolean | 'lazy';
    disableDismissable?: boolean;
    hoverable?: boolean | object;
};
/**
 * Provider that sets up both PopoverContext and PopoverTriggerContext.
 * Use this in Tooltip or other components that need popover trigger behavior.
 */
export declare const PopoverContextProvider: React.MemoExoticComponent<({ scope, children, open, onOpenChange, onOpenToggle, triggerRef, id, contentId, hasCustomAnchor, onCustomAnchorAdd, onCustomAnchorRemove, anchorTo, adaptScope, breakpointActive, keepChildrenMounted, disableDismissable, hoverable, }: PopoverContextProviderProps) => import("react/jsx-runtime").JSX.Element>;
export type PopoverAnchorProps = ScopedPopoverProps<YStackProps>;
export declare const PopoverAnchor: React.NamedExoticComponent<Omit<YStackProps, "scope"> & {
    scope?: PopoverScopes;
} & React.RefAttributes<GuiElement>>;
export type PopoverTriggerProps = ScopedPopoverProps<ViewProps & {
    /**
     * When true, disables the built-in click-to-toggle behavior on the trigger.
     * Useful for hoverable popovers where you want to control open/close
     * entirely through hover or your own handlers.
     */
    disablePressTrigger?: boolean;
}>;
export declare const PopoverTrigger: React.NamedExoticComponent<Omit<import("@gui/core").StackNonStyleProps & import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>> & import("@gui/core").WithPseudoProps<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>>> & import("@gui/core").WithMediaProps<import("@gui/core").WithThemeShorthandsAndPseudos<import("@gui/core").StackStyleBase, {}>> & {
    /**
     * When true, disables the built-in click-to-toggle behavior on the trigger.
     * Useful for hoverable popovers where you want to control open/close
     * entirely through hover or your own handlers.
     */
    disablePressTrigger?: boolean;
}, "scope"> & {
    scope?: PopoverScopes;
} & React.RefAttributes<GuiElement>>;
export interface PopoverContentTypeProps extends Omit<PopoverContentImplProps, 'disableOutsidePointerEvents'> {
    /**
     * Enable smooth animation when the content position changes (e.g., when flipping sides)
     */
    animatePosition?: boolean | 'even-when-repositioning';
    /** @deprecated Use `animatePosition` instead */
    enableAnimationForPositionChange?: boolean;
}
export type PopoverContentProps = PopoverContentTypeProps;
export declare const PopoverContent: import("@gui/core").GuiComponent<Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
    size?: SizeTokens | undefined;
    unstyled?: boolean | undefined;
    elevation?: number | SizeTokens | undefined;
    fullscreen?: boolean | undefined;
}>, keyof PopoverContentTypeProps> & PopoverContentTypeProps, GuiElement, import("@gui/core").RNGuiViewNonStyleProps & PopoverContentTypeProps, import("@gui/core").StackStyleBase, {
    size?: SizeTokens | undefined;
    unstyled?: boolean | undefined;
    elevation?: number | SizeTokens | undefined;
    fullscreen?: boolean | undefined;
}, import("@gui/core").StaticConfigPublic>;
export type PopoverContentImplProps = PopperContentProps & Omit<DismissableProps, 'onDismiss' | 'children' | 'onPointerDownCapture'> & {
    /**
     * Rather than mount the content immediately, mounts it in a useEffect
     * inside a startTransition to clear the main thread
     */
    lazyMount?: boolean;
    /**
     * Whether focus should be trapped within the `Popover`
     * @default false
     */
    trapFocus?: FocusScopeProps['trapped'];
    /**
     * Whether popover should not focus contents on open
     * @default false
     */
    disableFocusScope?: boolean;
    /**
     * Event handler called when auto-focusing on open. Can be prevented.
     */
    onOpenAutoFocus?: FocusScopeProps['onMountAutoFocus'];
    /**
     * Event handler called when auto-focusing on close. Can be prevented.
     */
    onCloseAutoFocus?: FocusScopeProps['onUnmountAutoFocus'] | false;
    enableRemoveScroll?: boolean;
    freezeContentsWhenHidden?: boolean;
    /**
     * Performance - if never going to use feature can permanently disable
     */
    alwaysDisable?: {
        focus?: boolean;
        'remove-scroll'?: boolean;
        dismiss?: boolean;
    };
};
export type PopoverCloseProps = ScopedPopoverProps<YStackProps>;
export declare const PopoverClose: React.ForwardRefExoticComponent<Omit<YStackProps, "scope"> & {
    scope?: PopoverScopes;
} & React.RefAttributes<GuiElement>>;
export type PopoverArrowProps = PopperArrowProps;
export declare const PopoverArrow: import("@gui/core").GuiComponent<Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
    unstyled?: boolean | undefined;
    elevation?: number | SizeTokens | undefined;
    fullscreen?: boolean | undefined;
}>, keyof PopperArrowExtraProps> & PopperArrowExtraProps, GuiElement, import("@gui/core").RNGuiViewNonStyleProps & PopperArrowExtraProps, import("@gui/core").StackStyleBase, {
    unstyled?: boolean | undefined;
    elevation?: number | SizeTokens | undefined;
    fullscreen?: boolean | undefined;
}, import("@gui/core").StaticConfigPublic>;
type Rect = {
    x: number;
    y: number;
    width: number;
    height: number;
};
export type Popover = {
    anchorTo: (rect: Rect) => void;
    toggle: () => void;
    open: () => void;
    close: () => void;
    setOpen: (open: boolean) => void;
};
export type PopoverScrollViewProps = ScrollViewProps & {
    scope?: string;
};
export declare const Popover: React.ForwardRefExoticComponent<Omit<PopperProps, "scope"> & {
    scope?: PopoverScopes;
} & {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean, via?: PopoverVia) => void;
    /**
     * When true, children never un-mount, otherwise they mount on open.
     * When "lazy", they mount inside a startTransition after first render.
     *
     * @default false
     */
    keepChildrenMounted?: boolean | "lazy";
    /**
     * Enable staying open while mouseover
     */
    hoverable?: boolean | UseHoverProps;
    /**
     * Disable focusing behavior on open
     */
    disableFocus?: boolean;
    /**
     * Disable the dismissable layer (escape key, outside click handling).
     * Useful for popovers that stay mounted but are visually hidden.
     */
    disableDismissable?: boolean;
    /**
     * z-index for the popover portal. Use this when popovers need to appear
     * above other portaled content like dialogs or fixed headers.
     *
     * By default, Gui automatically stacks overlays - later-opened content
     * appears above earlier content, and nested content appears above its parent.
     * Only set this if you need to override the automatic stacking behavior.
     *
     * @see https://gui.dev/ui/z-index
     */
    zIndex?: number;
} & React.RefAttributes<Popover>> & {
    Anchor: React.NamedExoticComponent<Omit<YStackProps, "scope"> & {
        scope?: PopoverScopes;
    } & React.RefAttributes<GuiElement>>;
    Arrow: import("@gui/core").GuiComponent<Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
        unstyled?: boolean | undefined;
        elevation?: number | SizeTokens | undefined;
        fullscreen?: boolean | undefined;
    }>, keyof PopperArrowExtraProps> & PopperArrowExtraProps, GuiElement, import("@gui/core").RNGuiViewNonStyleProps & PopperArrowExtraProps, import("@gui/core").StackStyleBase, {
        unstyled?: boolean | undefined;
        elevation?: number | SizeTokens | undefined;
        fullscreen?: boolean | undefined;
    }, import("@gui/core").StaticConfigPublic>;
    Trigger: React.NamedExoticComponent<Omit<import("@gui/core").StackNonStyleProps & import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>> & import("@gui/core").WithPseudoProps<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>>> & import("@gui/core").WithMediaProps<import("@gui/core").WithThemeShorthandsAndPseudos<import("@gui/core").StackStyleBase, {}>> & {
        /**
         * When true, disables the built-in click-to-toggle behavior on the trigger.
         * Useful for hoverable popovers where you want to control open/close
         * entirely through hover or your own handlers.
         */
        disablePressTrigger?: boolean;
    }, "scope"> & {
        scope?: PopoverScopes;
    } & React.RefAttributes<GuiElement>>;
    Content: import("@gui/core").GuiComponent<Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
        size?: SizeTokens | undefined;
        unstyled?: boolean | undefined;
        elevation?: number | SizeTokens | undefined;
        fullscreen?: boolean | undefined;
    }>, keyof PopoverContentTypeProps> & PopoverContentTypeProps, GuiElement, import("@gui/core").RNGuiViewNonStyleProps & PopoverContentTypeProps, import("@gui/core").StackStyleBase, {
        size?: SizeTokens | undefined;
        unstyled?: boolean | undefined;
        elevation?: number | SizeTokens | undefined;
        fullscreen?: boolean | undefined;
    }, import("@gui/core").StaticConfigPublic>;
    Close: React.ForwardRefExoticComponent<Omit<YStackProps, "scope"> & {
        scope?: PopoverScopes;
    } & React.RefAttributes<GuiElement>>;
    Adapt: ((props: import("@gui/adapt").AdaptProps) => import("react/jsx-runtime").JSX.Element) & {
        Contents: {
            ({ scope, ...rest }: {
                scope?: string;
            }): React.FunctionComponentElement<any>;
            shouldForwardSpace: boolean;
        };
    };
    ScrollView: React.ForwardRefExoticComponent<Omit<import("@gui/core").GuiComponentPropsBaseBase & import("react-native").ScrollViewProps, keyof import("@gui/core").StackStyleBase | "fullscreen" | "contentContainerStyle"> & import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase & {
        readonly contentContainerStyle?: Partial<import("@gui/core").InferStyleProps<typeof import("react-native").ScrollView, {
            accept: {
                readonly contentContainerStyle: "style";
            };
        }>> | undefined;
    }> & {
        fullscreen?: boolean | undefined;
    } & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase & {
        readonly contentContainerStyle?: Partial<import("@gui/core").InferStyleProps<typeof import("react-native").ScrollView, {
            accept: {
                readonly contentContainerStyle: "style";
            };
        }>> | undefined;
    }>> & import("@gui/core").WithPseudoProps<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase & {
        readonly contentContainerStyle?: Partial<import("@gui/core").InferStyleProps<typeof import("react-native").ScrollView, {
            accept: {
                readonly contentContainerStyle: "style";
            };
        }>> | undefined;
    }> & {
        fullscreen?: boolean | undefined;
    } & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase & {
        readonly contentContainerStyle?: Partial<import("@gui/core").InferStyleProps<typeof import("react-native").ScrollView, {
            accept: {
                readonly contentContainerStyle: "style";
            };
        }>> | undefined;
    }>>> & import("@gui/core").WithMediaProps<import("@gui/core").WithThemeShorthandsAndPseudos<import("@gui/core").StackStyleBase & {
        readonly contentContainerStyle?: Partial<import("@gui/core").InferStyleProps<typeof import("react-native").ScrollView, {
            accept: {
                readonly contentContainerStyle: "style";
            };
        }>> | undefined;
    }, {
        fullscreen?: boolean | undefined;
    }>> & {
        scope?: string;
    } & React.RefAttributes<import("react-native").ScrollView>>;
    FocusScope: (props: import("@gui/focus-scope/types/types").ScopedProps<import("@gui/focus-scope").FocusScopeControllerProps>) => import("react/jsx-runtime").JSX.Element;
};
export {};
//# sourceMappingURL=Popover.d.ts.map