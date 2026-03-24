import type { GetProps, ViewProps, GuiComponent, GuiComponentExpectingVariants } from '@gui/core';
import type { ForwardRefExoticComponent, FunctionComponent, RefAttributes } from 'react';
import type { View as RNView } from 'react-native';
import type { SheetProps, SheetScopedProps } from './types';
type SharedSheetProps = {
    open?: boolean;
};
type BaseProps = ViewProps & SharedSheetProps;
type SheetStyledComponent = GuiComponentExpectingVariants<BaseProps, SharedSheetProps>;
export declare function createSheet<H extends GuiComponent | SheetStyledComponent, F extends GuiComponent | SheetStyledComponent, O extends GuiComponent | SheetStyledComponent>({ Handle, Frame, Overlay }: {
    Handle: H;
    Frame: F;
    Overlay: O;
}): ForwardRefExoticComponent<{
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: import("react").Dispatch<import("react").SetStateAction<boolean>> | ((open: boolean) => void);
    position?: number;
    defaultPosition?: number;
    snapPoints?: (string | number)[];
    snapPointsMode?: import("./types").SnapPointsMode;
    onPositionChange?: import("./types").PositionChangeHandler;
    children?: import("react").ReactNode;
    dismissOnOverlayPress?: boolean;
    dismissOnSnapToBottom?: boolean;
    disableRemoveScroll?: boolean;
    forceRemoveScrollEnabled?: boolean;
    transitionConfig?: import("@gui/core").AnimatedNumberStrategy;
    preferAdaptParentOpenState?: boolean;
    unmountChildrenWhenHidden?: boolean;
    native?: "ios"[] | boolean;
    transition?: import("@gui/core").TransitionProp;
    handleDisableScroll?: boolean;
    disableDrag?: boolean;
    modal?: boolean;
    zIndex?: number;
    portalProps?: import("@gui/portal").PortalProps;
    moveOnKeyboardChange?: boolean;
    containerComponent?: React.ComponentType<any>;
    onAnimationComplete?: (info: {
        open: boolean;
    }) => void;
} & {
    __scopeSheet?: import("@gui/create-context").Scope<any>;
} & RefAttributes<RNView>> & {
    Controlled: FunctionComponent<Omit<SheetProps, "open" | "onOpenChange"> & RefAttributes<RNView>> & {
        Frame: ForwardRefExoticComponent<SheetScopedProps<Omit<GetProps<F>, keyof {
            /**
             * By default the sheet adds a view below its bottom that extends down another 50%,
             * this is useful if your Sheet has a spring animation that bounces "past" the top when
             * opening, preventing it from showing the content underneath.
             */
            disableHideBottomOverflow?: boolean;
            /**
             * Adds padding accounting for the currently offscreen content, so if you put a flex element inside
             * the sheet, it will always flex to the height of the visible amount of the sheet. If this is not
             * turned on, the inner content is always set to the max height of the sheet.
             */
            adjustPaddingForOffscreenContent?: boolean;
        }> & {
            /**
             * By default the sheet adds a view below its bottom that extends down another 50%,
             * this is useful if your Sheet has a spring animation that bounces "past" the top when
             * opening, preventing it from showing the content underneath.
             */
            disableHideBottomOverflow?: boolean;
            /**
             * Adds padding accounting for the currently offscreen content, so if you put a flex element inside
             * the sheet, it will always flex to the height of the visible amount of the sheet. If this is not
             * turned on, the inner content is always set to the max height of the sheet.
             */
            adjustPaddingForOffscreenContent?: boolean;
        }>>;
        Overlay: GuiComponent<Omit<BaseProps, "__scopeSheet"> & {
            __scopeSheet?: import("@gui/create-context").Scope<any>;
        }, any, any, any, SharedSheetProps, {}> | GuiComponent<Omit<BaseProps, "__scopeSheet"> & {
            __scopeSheet?: import("@gui/create-context").Scope<any>;
        }, any, {
            __scopeSheet?: import("@gui/create-context").Scope<any>;
        }, {}, {}, {}>;
        Handle: GuiComponent<any, any, any, any, SharedSheetProps, {}> | GuiComponent<any, any, any, {}, {}, {}>;
        ScrollView: ForwardRefExoticComponent<Omit<import("@gui/core").GuiComponentPropsBaseBase & import("react-native").ScrollViewProps, keyof import("@gui/core").StackStyleBase | "fullscreen" | "contentContainerStyle"> & import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase & {
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
        }>> & RefAttributes<import("react-native").ScrollView>>;
    };
    Frame: ForwardRefExoticComponent<SheetScopedProps<Omit<GetProps<F>, keyof {
        /**
         * By default the sheet adds a view below its bottom that extends down another 50%,
         * this is useful if your Sheet has a spring animation that bounces "past" the top when
         * opening, preventing it from showing the content underneath.
         */
        disableHideBottomOverflow?: boolean;
        /**
         * Adds padding accounting for the currently offscreen content, so if you put a flex element inside
         * the sheet, it will always flex to the height of the visible amount of the sheet. If this is not
         * turned on, the inner content is always set to the max height of the sheet.
         */
        adjustPaddingForOffscreenContent?: boolean;
    }> & {
        /**
         * By default the sheet adds a view below its bottom that extends down another 50%,
         * this is useful if your Sheet has a spring animation that bounces "past" the top when
         * opening, preventing it from showing the content underneath.
         */
        disableHideBottomOverflow?: boolean;
        /**
         * Adds padding accounting for the currently offscreen content, so if you put a flex element inside
         * the sheet, it will always flex to the height of the visible amount of the sheet. If this is not
         * turned on, the inner content is always set to the max height of the sheet.
         */
        adjustPaddingForOffscreenContent?: boolean;
    }>>;
    Overlay: GuiComponent<Omit<BaseProps, "__scopeSheet"> & {
        __scopeSheet?: import("@gui/create-context").Scope<any>;
    }, any, any, any, SharedSheetProps, {}> | GuiComponent<Omit<BaseProps, "__scopeSheet"> & {
        __scopeSheet?: import("@gui/create-context").Scope<any>;
    }, any, {
        __scopeSheet?: import("@gui/create-context").Scope<any>;
    }, {}, {}, {}>;
    Handle: GuiComponent<any, any, any, any, SharedSheetProps, {}> | GuiComponent<any, any, any, {}, {}, {}>;
    ScrollView: ForwardRefExoticComponent<Omit<import("@gui/core").GuiComponentPropsBaseBase & import("react-native").ScrollViewProps, keyof import("@gui/core").StackStyleBase | "fullscreen" | "contentContainerStyle"> & import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase & {
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
    }>> & RefAttributes<import("react-native").ScrollView>>;
};
export {};
//# sourceMappingURL=createSheet.d.ts.map