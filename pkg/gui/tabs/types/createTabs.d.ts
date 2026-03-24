import type { GroupProps } from '@gui/group';
import { type RovingFocusGroupProps } from '@gui/roving-focus';
import type { GetProps, GuiElement, ViewProps } from '@gui/web';
import * as React from 'react';
import type { LayoutRectangle } from 'react-native';
import { DefaultTabsContentFrame, DefaultTabsFrame, DefaultTabsTabFrame } from './Tabs';
type TabsComponent = (props: {
    direction: 'horizontal' | 'vertical';
} & ViewProps) => any;
type TabComponent = (props: {
    active?: boolean;
} & ViewProps) => any;
type ContentComponent = (props: ViewProps) => any;
export declare function createTabs<C extends TabsComponent, T extends TabComponent, F extends ContentComponent>(createProps: {
    ContentFrame: F;
    TabFrame: T;
    TabsFrame: C;
}): React.ForwardRefExoticComponent<Omit<import("@gui/web").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {
    size?: import("@gui/web").SizeTokens | undefined;
    unstyled?: boolean | undefined;
    elevation?: number | import("@gui/web").SizeTokens | undefined;
    transparent?: boolean | undefined;
    fullscreen?: boolean | undefined;
    circular?: boolean | undefined;
    elevate?: boolean | undefined;
    bordered?: boolean | undefined;
    chromeless?: boolean | "all" | undefined;
}>, keyof TabsExtraProps<string>> & TabsExtraProps<string> & React.RefAttributes<GuiElement>> & import("@gui/web").StaticComponentObject<Omit<import("@gui/web").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {
    size?: import("@gui/web").SizeTokens | undefined;
    unstyled?: boolean | undefined;
    elevation?: number | import("@gui/web").SizeTokens | undefined;
    transparent?: boolean | undefined;
    fullscreen?: boolean | undefined;
    circular?: boolean | undefined;
    elevate?: boolean | undefined;
    bordered?: boolean | undefined;
    chromeless?: boolean | "all" | undefined;
}>, keyof TabsExtraProps<string>> & TabsExtraProps<string>, GuiElement, import("@gui/core").RNGuiViewNonStyleProps & TabsExtraProps<string>, import("@gui/web").StackStyleBase, {
    size?: import("@gui/web").SizeTokens | undefined;
    unstyled?: boolean | undefined;
    elevation?: number | import("@gui/web").SizeTokens | undefined;
    transparent?: boolean | undefined;
    fullscreen?: boolean | undefined;
    circular?: boolean | undefined;
    elevate?: boolean | undefined;
    bordered?: boolean | undefined;
    chromeless?: boolean | "all" | undefined;
}, import("@gui/web").StaticConfigPublic> & Omit<import("@gui/web").StaticConfigPublic, "staticConfig" | "styleable"> & {
    __tama: [Omit<import("@gui/web").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {
        size?: import("@gui/web").SizeTokens | undefined;
        unstyled?: boolean | undefined;
        elevation?: number | import("@gui/web").SizeTokens | undefined;
        transparent?: boolean | undefined;
        fullscreen?: boolean | undefined;
        circular?: boolean | undefined;
        elevate?: boolean | undefined;
        bordered?: boolean | undefined;
        chromeless?: boolean | "all" | undefined;
    }>, keyof TabsExtraProps<string>> & TabsExtraProps<string>, GuiElement, import("@gui/core").RNGuiViewNonStyleProps & TabsExtraProps<string>, import("@gui/web").StackStyleBase, {
        size?: import("@gui/web").SizeTokens | undefined;
        unstyled?: boolean | undefined;
        elevation?: number | import("@gui/web").SizeTokens | undefined;
        transparent?: boolean | undefined;
        fullscreen?: boolean | undefined;
        circular?: boolean | undefined;
        elevate?: boolean | undefined;
        bordered?: boolean | undefined;
        chromeless?: boolean | "all" | undefined;
    }, import("@gui/web").StaticConfigPublic];
} & {
    List: React.ForwardRefExoticComponent<Omit<import("@gui/core").RNGuiViewNonStyleProps, "unstyled" | "elevation" | keyof import("@gui/web").StackStyleBase | "size" | "fullscreen"> & import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & {
        unstyled?: boolean | undefined;
        elevation?: number | import("@gui/web").SizeTokens | undefined;
        fullscreen?: boolean | undefined;
        size?: any;
    } & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>> & import("@gui/web").WithPseudoProps<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & {
        unstyled?: boolean | undefined;
        elevation?: number | import("@gui/web").SizeTokens | undefined;
        fullscreen?: boolean | undefined;
        size?: any;
    } & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>>> & import("@gui/web").WithMediaProps<import("@gui/web").WithThemeShorthandsAndPseudos<import("@gui/web").StackStyleBase, {
        unstyled?: boolean | undefined;
        elevation?: number | import("@gui/web").SizeTokens | undefined;
        fullscreen?: boolean | undefined;
        size?: any;
    }>> & import("@gui/group").GroupExtraProps & {
        /**
         * Whether to loop over after reaching the end or start of the items
         * @default true
         */
        loop?: boolean;
    } & React.RefAttributes<GuiElement>>;
    /**
     * @deprecated Use Tabs.Tab instead
     */
    Trigger: import("@gui/web").GuiComponent<Omit<import("@gui/web").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase & {
        readonly activeStyle?: Partial<import("@gui/web").InferStyleProps<React.ForwardRefExoticComponent<Omit<import("@gui/core").RNGuiViewNonStyleProps, keyof import("@gui/web").StackStyleBase> & import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>> & import("@gui/web").WithPseudoProps<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>>> & import("@gui/web").WithMediaProps<import("@gui/web").WithThemeShorthandsAndPseudos<import("@gui/web").StackStyleBase, {}>> & React.RefAttributes<GuiElement>> & import("@gui/web").StaticComponentObject<import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}> & Omit<{}, "staticConfig" | "styleable"> & {
            __tama: [import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}];
        }, {
            accept: {
                readonly activeStyle: "style";
            };
        }>> | undefined;
    }, {
        disabled?: boolean | undefined;
        unstyled?: boolean | undefined;
        size?: import("@gui/web").SizeTokens | undefined;
    }>, "theme" | "debug" | "style" | `$${string}` | `$${number}` | import("@gui/web").GroupMediaKeys | `$theme-${string}` | `$theme-${number}` | "hitSlop" | "children" | "target" | "htmlFor" | "asChild" | "dangerouslySetInnerHTML" | "disabled" | "className" | "themeShallow" | "unstyled" | "id" | "render" | "group" | "untilMeasured" | "componentName" | "tabIndex" | "role" | "disableOptimization" | "forceStyle" | "disableClassName" | "animatedBy" | "onStartShouldSetResponder" | "onScrollShouldSetResponder" | "onScrollShouldSetResponderCapture" | "onSelectionChangeShouldSetResponder" | "onSelectionChangeShouldSetResponderCapture" | "onLayout" | "elevationAndroid" | "rel" | "download" | "onMoveShouldSetResponder" | "onResponderEnd" | "onResponderGrant" | "onResponderReject" | "onResponderMove" | "onResponderRelease" | "onResponderStart" | "onResponderTerminationRequest" | "onResponderTerminate" | "onStartShouldSetResponderCapture" | "onMoveShouldSetResponderCapture" | "onFocus" | "onBlur" | "onPointerCancel" | "onPointerDown" | "onPointerMove" | "onPointerUp" | "needsOffscreenAlphaCompositing" | "removeClippedSubviews" | "testID" | "nativeID" | "collapsable" | "collapsableChildren" | "renderToHardwareTextureAndroid" | "focusable" | "shouldRasterizeIOS" | "isTVSelectable" | "hasTVPreferredFocus" | "tvParallaxShiftDistanceX" | "tvParallaxShiftDistanceY" | "tvParallaxTiltAngle" | "tvParallaxMagnification" | "onTouchStart" | "onTouchMove" | "onTouchEnd" | "onTouchCancel" | "onTouchEndCapture" | "onPointerEnter" | "onPointerEnterCapture" | "onPointerLeave" | "onPointerLeaveCapture" | "onPointerMoveCapture" | "onPointerCancelCapture" | "onPointerDownCapture" | "onPointerUpCapture" | "accessible" | "accessibilityActions" | "accessibilityLabel" | "aria-label" | "accessibilityRole" | "accessibilityState" | "aria-busy" | "aria-checked" | "aria-disabled" | "aria-expanded" | "aria-selected" | "accessibilityHint" | "accessibilityValue" | "aria-valuemax" | "aria-valuemin" | "aria-valuenow" | "aria-valuetext" | "onAccessibilityAction" | "importantForAccessibility" | "aria-hidden" | "aria-modal" | "accessibilityLabelledBy" | "aria-labelledby" | "accessibilityLiveRegion" | "aria-live" | "screenReaderFocusable" | "accessibilityElementsHidden" | "accessibilityViewIsModal" | "onAccessibilityEscape" | "onAccessibilityTap" | "onMagicTap" | "accessibilityIgnoresInvertColors" | "accessibilityLanguage" | "accessibilityShowsLargeContentViewer" | "accessibilityLargeContentTitle" | "accessibilityRespondsToUserInteraction" | "onPress" | "onLongPress" | "onPressIn" | "onPressOut" | "onMouseEnter" | "onMouseLeave" | "onMouseDown" | "onMouseUp" | "onMouseMove" | "onMouseOver" | "onMouseOut" | "onClick" | "onDoubleClick" | "onContextMenu" | "onWheel" | "onKeyDown" | "onKeyUp" | "onChange" | "onInput" | "onBeforeInput" | "onScroll" | "onCopy" | "onCut" | "onPaste" | "onDrag" | "onDragStart" | "onDragEnd" | "onDragEnter" | "onDragLeave" | "onDragOver" | "onDrop" | keyof import("@gui/web").StackStyleBase | "size" | "activeStyle" | "value" | keyof import("@gui/web").WithPseudoProps<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase & {
        readonly activeStyle?: Partial<import("@gui/web").InferStyleProps<React.ForwardRefExoticComponent<Omit<import("@gui/core").RNGuiViewNonStyleProps, keyof import("@gui/web").StackStyleBase> & import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>> & import("@gui/web").WithPseudoProps<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>>> & import("@gui/web").WithMediaProps<import("@gui/web").WithThemeShorthandsAndPseudos<import("@gui/web").StackStyleBase, {}>> & React.RefAttributes<GuiElement>> & import("@gui/web").StaticComponentObject<import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}> & Omit<{}, "staticConfig" | "styleable"> & {
            __tama: [import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}];
        }, {
            accept: {
                readonly activeStyle: "style";
            };
        }>> | undefined;
    }> & {
        disabled?: boolean | undefined;
        unstyled?: boolean | undefined;
        size?: import("@gui/web").SizeTokens | undefined;
    } & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase & {
        readonly activeStyle?: Partial<import("@gui/web").InferStyleProps<React.ForwardRefExoticComponent<Omit<import("@gui/core").RNGuiViewNonStyleProps, keyof import("@gui/web").StackStyleBase> & import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>> & import("@gui/web").WithPseudoProps<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>>> & import("@gui/web").WithMediaProps<import("@gui/web").WithThemeShorthandsAndPseudos<import("@gui/web").StackStyleBase, {}>> & React.RefAttributes<GuiElement>> & import("@gui/web").StaticComponentObject<import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}> & Omit<{}, "staticConfig" | "styleable"> & {
            __tama: [import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}];
        }, {
            accept: {
                readonly activeStyle: "style";
            };
        }>> | undefined;
    }>>> | "onInteraction" | "activeTheme" | "__scopeTabs"> & Omit<import("@gui/core").RNGuiViewNonStyleProps, "disabled" | "unstyled" | keyof import("@gui/web").StackStyleBase | "size" | "activeStyle"> & import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase & {
        readonly activeStyle?: Partial<import("@gui/web").InferStyleProps<React.ForwardRefExoticComponent<Omit<import("@gui/core").RNGuiViewNonStyleProps, keyof import("@gui/web").StackStyleBase> & import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>> & import("@gui/web").WithPseudoProps<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>>> & import("@gui/web").WithMediaProps<import("@gui/web").WithThemeShorthandsAndPseudos<import("@gui/web").StackStyleBase, {}>> & React.RefAttributes<GuiElement>> & import("@gui/web").StaticComponentObject<import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}> & Omit<{}, "staticConfig" | "styleable"> & {
            __tama: [import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}];
        }, {
            accept: {
                readonly activeStyle: "style";
            };
        }>> | undefined;
    }> & {
        disabled?: boolean | undefined;
        unstyled?: boolean | undefined;
        size?: import("@gui/web").SizeTokens | undefined;
    } & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase & {
        readonly activeStyle?: Partial<import("@gui/web").InferStyleProps<React.ForwardRefExoticComponent<Omit<import("@gui/core").RNGuiViewNonStyleProps, keyof import("@gui/web").StackStyleBase> & import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>> & import("@gui/web").WithPseudoProps<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>>> & import("@gui/web").WithMediaProps<import("@gui/web").WithThemeShorthandsAndPseudos<import("@gui/web").StackStyleBase, {}>> & React.RefAttributes<GuiElement>> & import("@gui/web").StaticComponentObject<import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}> & Omit<{}, "staticConfig" | "styleable"> & {
            __tama: [import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}];
        }, {
            accept: {
                readonly activeStyle: "style";
            };
        }>> | undefined;
    }>> & import("@gui/web").WithPseudoProps<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase & {
        readonly activeStyle?: Partial<import("@gui/web").InferStyleProps<React.ForwardRefExoticComponent<Omit<import("@gui/core").RNGuiViewNonStyleProps, keyof import("@gui/web").StackStyleBase> & import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>> & import("@gui/web").WithPseudoProps<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>>> & import("@gui/web").WithMediaProps<import("@gui/web").WithThemeShorthandsAndPseudos<import("@gui/web").StackStyleBase, {}>> & React.RefAttributes<GuiElement>> & import("@gui/web").StaticComponentObject<import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}> & Omit<{}, "staticConfig" | "styleable"> & {
            __tama: [import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}];
        }, {
            accept: {
                readonly activeStyle: "style";
            };
        }>> | undefined;
    }> & {
        disabled?: boolean | undefined;
        unstyled?: boolean | undefined;
        size?: import("@gui/web").SizeTokens | undefined;
    } & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase & {
        readonly activeStyle?: Partial<import("@gui/web").InferStyleProps<React.ForwardRefExoticComponent<Omit<import("@gui/core").RNGuiViewNonStyleProps, keyof import("@gui/web").StackStyleBase> & import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>> & import("@gui/web").WithPseudoProps<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>>> & import("@gui/web").WithMediaProps<import("@gui/web").WithThemeShorthandsAndPseudos<import("@gui/web").StackStyleBase, {}>> & React.RefAttributes<GuiElement>> & import("@gui/web").StaticComponentObject<import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}> & Omit<{}, "staticConfig" | "styleable"> & {
            __tama: [import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}];
        }, {
            accept: {
                readonly activeStyle: "style";
            };
        }>> | undefined;
    }>>> & import("@gui/web").WithMediaProps<import("@gui/web").WithThemeShorthandsAndPseudos<import("@gui/web").StackStyleBase & {
        readonly activeStyle?: Partial<import("@gui/web").InferStyleProps<React.ForwardRefExoticComponent<Omit<import("@gui/core").RNGuiViewNonStyleProps, keyof import("@gui/web").StackStyleBase> & import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>> & import("@gui/web").WithPseudoProps<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>>> & import("@gui/web").WithMediaProps<import("@gui/web").WithThemeShorthandsAndPseudos<import("@gui/web").StackStyleBase, {}>> & React.RefAttributes<GuiElement>> & import("@gui/web").StaticComponentObject<import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}> & Omit<{}, "staticConfig" | "styleable"> & {
            __tama: [import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}];
        }, {
            accept: {
                readonly activeStyle: "style";
            };
        }>> | undefined;
    }, {
        disabled?: boolean | undefined;
        unstyled?: boolean | undefined;
        size?: import("@gui/web").SizeTokens | undefined;
    }>> & {
        /** The value for the tabs state to be changed to after activation of the trigger */
        value: string;
        /** Used for making custom indicators when trigger interacted with */
        onInteraction?: (type: InteractionType, layout: TabLayout | null) => void;
        /** Custom styles to apply when tab is active */
        activeStyle?: TabsTriggerFrameProps;
        /** Theme to apply when tab is active (use null for no theme) */
        activeTheme?: string | null;
    } & {
        __scopeTabs?: string;
    }, GuiElement, import("@gui/core").RNGuiViewNonStyleProps & Omit<import("@gui/core").RNGuiViewNonStyleProps, "disabled" | "unstyled" | keyof import("@gui/web").StackStyleBase | "size" | "activeStyle"> & import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase & {
        readonly activeStyle?: Partial<import("@gui/web").InferStyleProps<React.ForwardRefExoticComponent<Omit<import("@gui/core").RNGuiViewNonStyleProps, keyof import("@gui/web").StackStyleBase> & import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>> & import("@gui/web").WithPseudoProps<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>>> & import("@gui/web").WithMediaProps<import("@gui/web").WithThemeShorthandsAndPseudos<import("@gui/web").StackStyleBase, {}>> & React.RefAttributes<GuiElement>> & import("@gui/web").StaticComponentObject<import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}> & Omit<{}, "staticConfig" | "styleable"> & {
            __tama: [import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}];
        }, {
            accept: {
                readonly activeStyle: "style";
            };
        }>> | undefined;
    }> & {
        disabled?: boolean | undefined;
        unstyled?: boolean | undefined;
        size?: import("@gui/web").SizeTokens | undefined;
    } & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase & {
        readonly activeStyle?: Partial<import("@gui/web").InferStyleProps<React.ForwardRefExoticComponent<Omit<import("@gui/core").RNGuiViewNonStyleProps, keyof import("@gui/web").StackStyleBase> & import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>> & import("@gui/web").WithPseudoProps<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>>> & import("@gui/web").WithMediaProps<import("@gui/web").WithThemeShorthandsAndPseudos<import("@gui/web").StackStyleBase, {}>> & React.RefAttributes<GuiElement>> & import("@gui/web").StaticComponentObject<import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}> & Omit<{}, "staticConfig" | "styleable"> & {
            __tama: [import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}];
        }, {
            accept: {
                readonly activeStyle: "style";
            };
        }>> | undefined;
    }>> & import("@gui/web").WithPseudoProps<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase & {
        readonly activeStyle?: Partial<import("@gui/web").InferStyleProps<React.ForwardRefExoticComponent<Omit<import("@gui/core").RNGuiViewNonStyleProps, keyof import("@gui/web").StackStyleBase> & import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>> & import("@gui/web").WithPseudoProps<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>>> & import("@gui/web").WithMediaProps<import("@gui/web").WithThemeShorthandsAndPseudos<import("@gui/web").StackStyleBase, {}>> & React.RefAttributes<GuiElement>> & import("@gui/web").StaticComponentObject<import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}> & Omit<{}, "staticConfig" | "styleable"> & {
            __tama: [import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}];
        }, {
            accept: {
                readonly activeStyle: "style";
            };
        }>> | undefined;
    }> & {
        disabled?: boolean | undefined;
        unstyled?: boolean | undefined;
        size?: import("@gui/web").SizeTokens | undefined;
    } & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase & {
        readonly activeStyle?: Partial<import("@gui/web").InferStyleProps<React.ForwardRefExoticComponent<Omit<import("@gui/core").RNGuiViewNonStyleProps, keyof import("@gui/web").StackStyleBase> & import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>> & import("@gui/web").WithPseudoProps<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>>> & import("@gui/web").WithMediaProps<import("@gui/web").WithThemeShorthandsAndPseudos<import("@gui/web").StackStyleBase, {}>> & React.RefAttributes<GuiElement>> & import("@gui/web").StaticComponentObject<import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}> & Omit<{}, "staticConfig" | "styleable"> & {
            __tama: [import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}];
        }, {
            accept: {
                readonly activeStyle: "style";
            };
        }>> | undefined;
    }>>> & import("@gui/web").WithMediaProps<import("@gui/web").WithThemeShorthandsAndPseudos<import("@gui/web").StackStyleBase & {
        readonly activeStyle?: Partial<import("@gui/web").InferStyleProps<React.ForwardRefExoticComponent<Omit<import("@gui/core").RNGuiViewNonStyleProps, keyof import("@gui/web").StackStyleBase> & import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>> & import("@gui/web").WithPseudoProps<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>>> & import("@gui/web").WithMediaProps<import("@gui/web").WithThemeShorthandsAndPseudos<import("@gui/web").StackStyleBase, {}>> & React.RefAttributes<GuiElement>> & import("@gui/web").StaticComponentObject<import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}> & Omit<{}, "staticConfig" | "styleable"> & {
            __tama: [import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}];
        }, {
            accept: {
                readonly activeStyle: "style";
            };
        }>> | undefined;
    }, {
        disabled?: boolean | undefined;
        unstyled?: boolean | undefined;
        size?: import("@gui/web").SizeTokens | undefined;
    }>> & {
        /** The value for the tabs state to be changed to after activation of the trigger */
        value: string;
        /** Used for making custom indicators when trigger interacted with */
        onInteraction?: (type: InteractionType, layout: TabLayout | null) => void;
        /** Custom styles to apply when tab is active */
        activeStyle?: TabsTriggerFrameProps;
        /** Theme to apply when tab is active (use null for no theme) */
        activeTheme?: string | null;
    } & {
        __scopeTabs?: string;
    }, import("@gui/web").StackStyleBase & {
        readonly activeStyle?: Partial<import("@gui/web").InferStyleProps<React.ForwardRefExoticComponent<Omit<import("@gui/core").RNGuiViewNonStyleProps, keyof import("@gui/web").StackStyleBase> & import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>> & import("@gui/web").WithPseudoProps<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>>> & import("@gui/web").WithMediaProps<import("@gui/web").WithThemeShorthandsAndPseudos<import("@gui/web").StackStyleBase, {}>> & React.RefAttributes<GuiElement>> & import("@gui/web").StaticComponentObject<import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}> & Omit<{}, "staticConfig" | "styleable"> & {
            __tama: [import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}];
        }, {
            accept: {
                readonly activeStyle: "style";
            };
        }>> | undefined;
    }, {
        disabled?: boolean | undefined;
        unstyled?: boolean | undefined;
        size?: import("@gui/web").SizeTokens | undefined;
    }, {
        accept: {
            readonly activeStyle: "style";
        };
    }>;
    Tab: import("@gui/web").GuiComponent<Omit<import("@gui/web").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase & {
        readonly activeStyle?: Partial<import("@gui/web").InferStyleProps<React.ForwardRefExoticComponent<Omit<import("@gui/core").RNGuiViewNonStyleProps, keyof import("@gui/web").StackStyleBase> & import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>> & import("@gui/web").WithPseudoProps<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>>> & import("@gui/web").WithMediaProps<import("@gui/web").WithThemeShorthandsAndPseudos<import("@gui/web").StackStyleBase, {}>> & React.RefAttributes<GuiElement>> & import("@gui/web").StaticComponentObject<import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}> & Omit<{}, "staticConfig" | "styleable"> & {
            __tama: [import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}];
        }, {
            accept: {
                readonly activeStyle: "style";
            };
        }>> | undefined;
    }, {
        disabled?: boolean | undefined;
        unstyled?: boolean | undefined;
        size?: import("@gui/web").SizeTokens | undefined;
    }>, "theme" | "debug" | "style" | `$${string}` | `$${number}` | import("@gui/web").GroupMediaKeys | `$theme-${string}` | `$theme-${number}` | "hitSlop" | "children" | "target" | "htmlFor" | "asChild" | "dangerouslySetInnerHTML" | "disabled" | "className" | "themeShallow" | "unstyled" | "id" | "render" | "group" | "untilMeasured" | "componentName" | "tabIndex" | "role" | "disableOptimization" | "forceStyle" | "disableClassName" | "animatedBy" | "onStartShouldSetResponder" | "onScrollShouldSetResponder" | "onScrollShouldSetResponderCapture" | "onSelectionChangeShouldSetResponder" | "onSelectionChangeShouldSetResponderCapture" | "onLayout" | "elevationAndroid" | "rel" | "download" | "onMoveShouldSetResponder" | "onResponderEnd" | "onResponderGrant" | "onResponderReject" | "onResponderMove" | "onResponderRelease" | "onResponderStart" | "onResponderTerminationRequest" | "onResponderTerminate" | "onStartShouldSetResponderCapture" | "onMoveShouldSetResponderCapture" | "onFocus" | "onBlur" | "onPointerCancel" | "onPointerDown" | "onPointerMove" | "onPointerUp" | "needsOffscreenAlphaCompositing" | "removeClippedSubviews" | "testID" | "nativeID" | "collapsable" | "collapsableChildren" | "renderToHardwareTextureAndroid" | "focusable" | "shouldRasterizeIOS" | "isTVSelectable" | "hasTVPreferredFocus" | "tvParallaxShiftDistanceX" | "tvParallaxShiftDistanceY" | "tvParallaxTiltAngle" | "tvParallaxMagnification" | "onTouchStart" | "onTouchMove" | "onTouchEnd" | "onTouchCancel" | "onTouchEndCapture" | "onPointerEnter" | "onPointerEnterCapture" | "onPointerLeave" | "onPointerLeaveCapture" | "onPointerMoveCapture" | "onPointerCancelCapture" | "onPointerDownCapture" | "onPointerUpCapture" | "accessible" | "accessibilityActions" | "accessibilityLabel" | "aria-label" | "accessibilityRole" | "accessibilityState" | "aria-busy" | "aria-checked" | "aria-disabled" | "aria-expanded" | "aria-selected" | "accessibilityHint" | "accessibilityValue" | "aria-valuemax" | "aria-valuemin" | "aria-valuenow" | "aria-valuetext" | "onAccessibilityAction" | "importantForAccessibility" | "aria-hidden" | "aria-modal" | "accessibilityLabelledBy" | "aria-labelledby" | "accessibilityLiveRegion" | "aria-live" | "screenReaderFocusable" | "accessibilityElementsHidden" | "accessibilityViewIsModal" | "onAccessibilityEscape" | "onAccessibilityTap" | "onMagicTap" | "accessibilityIgnoresInvertColors" | "accessibilityLanguage" | "accessibilityShowsLargeContentViewer" | "accessibilityLargeContentTitle" | "accessibilityRespondsToUserInteraction" | "onPress" | "onLongPress" | "onPressIn" | "onPressOut" | "onMouseEnter" | "onMouseLeave" | "onMouseDown" | "onMouseUp" | "onMouseMove" | "onMouseOver" | "onMouseOut" | "onClick" | "onDoubleClick" | "onContextMenu" | "onWheel" | "onKeyDown" | "onKeyUp" | "onChange" | "onInput" | "onBeforeInput" | "onScroll" | "onCopy" | "onCut" | "onPaste" | "onDrag" | "onDragStart" | "onDragEnd" | "onDragEnter" | "onDragLeave" | "onDragOver" | "onDrop" | keyof import("@gui/web").StackStyleBase | "size" | "activeStyle" | "value" | keyof import("@gui/web").WithPseudoProps<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase & {
        readonly activeStyle?: Partial<import("@gui/web").InferStyleProps<React.ForwardRefExoticComponent<Omit<import("@gui/core").RNGuiViewNonStyleProps, keyof import("@gui/web").StackStyleBase> & import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>> & import("@gui/web").WithPseudoProps<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>>> & import("@gui/web").WithMediaProps<import("@gui/web").WithThemeShorthandsAndPseudos<import("@gui/web").StackStyleBase, {}>> & React.RefAttributes<GuiElement>> & import("@gui/web").StaticComponentObject<import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}> & Omit<{}, "staticConfig" | "styleable"> & {
            __tama: [import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}];
        }, {
            accept: {
                readonly activeStyle: "style";
            };
        }>> | undefined;
    }> & {
        disabled?: boolean | undefined;
        unstyled?: boolean | undefined;
        size?: import("@gui/web").SizeTokens | undefined;
    } & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase & {
        readonly activeStyle?: Partial<import("@gui/web").InferStyleProps<React.ForwardRefExoticComponent<Omit<import("@gui/core").RNGuiViewNonStyleProps, keyof import("@gui/web").StackStyleBase> & import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>> & import("@gui/web").WithPseudoProps<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>>> & import("@gui/web").WithMediaProps<import("@gui/web").WithThemeShorthandsAndPseudos<import("@gui/web").StackStyleBase, {}>> & React.RefAttributes<GuiElement>> & import("@gui/web").StaticComponentObject<import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}> & Omit<{}, "staticConfig" | "styleable"> & {
            __tama: [import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}];
        }, {
            accept: {
                readonly activeStyle: "style";
            };
        }>> | undefined;
    }>>> | "onInteraction" | "activeTheme" | "__scopeTabs"> & Omit<import("@gui/core").RNGuiViewNonStyleProps, "disabled" | "unstyled" | keyof import("@gui/web").StackStyleBase | "size" | "activeStyle"> & import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase & {
        readonly activeStyle?: Partial<import("@gui/web").InferStyleProps<React.ForwardRefExoticComponent<Omit<import("@gui/core").RNGuiViewNonStyleProps, keyof import("@gui/web").StackStyleBase> & import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>> & import("@gui/web").WithPseudoProps<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>>> & import("@gui/web").WithMediaProps<import("@gui/web").WithThemeShorthandsAndPseudos<import("@gui/web").StackStyleBase, {}>> & React.RefAttributes<GuiElement>> & import("@gui/web").StaticComponentObject<import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}> & Omit<{}, "staticConfig" | "styleable"> & {
            __tama: [import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}];
        }, {
            accept: {
                readonly activeStyle: "style";
            };
        }>> | undefined;
    }> & {
        disabled?: boolean | undefined;
        unstyled?: boolean | undefined;
        size?: import("@gui/web").SizeTokens | undefined;
    } & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase & {
        readonly activeStyle?: Partial<import("@gui/web").InferStyleProps<React.ForwardRefExoticComponent<Omit<import("@gui/core").RNGuiViewNonStyleProps, keyof import("@gui/web").StackStyleBase> & import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>> & import("@gui/web").WithPseudoProps<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>>> & import("@gui/web").WithMediaProps<import("@gui/web").WithThemeShorthandsAndPseudos<import("@gui/web").StackStyleBase, {}>> & React.RefAttributes<GuiElement>> & import("@gui/web").StaticComponentObject<import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}> & Omit<{}, "staticConfig" | "styleable"> & {
            __tama: [import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}];
        }, {
            accept: {
                readonly activeStyle: "style";
            };
        }>> | undefined;
    }>> & import("@gui/web").WithPseudoProps<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase & {
        readonly activeStyle?: Partial<import("@gui/web").InferStyleProps<React.ForwardRefExoticComponent<Omit<import("@gui/core").RNGuiViewNonStyleProps, keyof import("@gui/web").StackStyleBase> & import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>> & import("@gui/web").WithPseudoProps<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>>> & import("@gui/web").WithMediaProps<import("@gui/web").WithThemeShorthandsAndPseudos<import("@gui/web").StackStyleBase, {}>> & React.RefAttributes<GuiElement>> & import("@gui/web").StaticComponentObject<import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}> & Omit<{}, "staticConfig" | "styleable"> & {
            __tama: [import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}];
        }, {
            accept: {
                readonly activeStyle: "style";
            };
        }>> | undefined;
    }> & {
        disabled?: boolean | undefined;
        unstyled?: boolean | undefined;
        size?: import("@gui/web").SizeTokens | undefined;
    } & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase & {
        readonly activeStyle?: Partial<import("@gui/web").InferStyleProps<React.ForwardRefExoticComponent<Omit<import("@gui/core").RNGuiViewNonStyleProps, keyof import("@gui/web").StackStyleBase> & import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>> & import("@gui/web").WithPseudoProps<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>>> & import("@gui/web").WithMediaProps<import("@gui/web").WithThemeShorthandsAndPseudos<import("@gui/web").StackStyleBase, {}>> & React.RefAttributes<GuiElement>> & import("@gui/web").StaticComponentObject<import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}> & Omit<{}, "staticConfig" | "styleable"> & {
            __tama: [import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}];
        }, {
            accept: {
                readonly activeStyle: "style";
            };
        }>> | undefined;
    }>>> & import("@gui/web").WithMediaProps<import("@gui/web").WithThemeShorthandsAndPseudos<import("@gui/web").StackStyleBase & {
        readonly activeStyle?: Partial<import("@gui/web").InferStyleProps<React.ForwardRefExoticComponent<Omit<import("@gui/core").RNGuiViewNonStyleProps, keyof import("@gui/web").StackStyleBase> & import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>> & import("@gui/web").WithPseudoProps<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>>> & import("@gui/web").WithMediaProps<import("@gui/web").WithThemeShorthandsAndPseudos<import("@gui/web").StackStyleBase, {}>> & React.RefAttributes<GuiElement>> & import("@gui/web").StaticComponentObject<import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}> & Omit<{}, "staticConfig" | "styleable"> & {
            __tama: [import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}];
        }, {
            accept: {
                readonly activeStyle: "style";
            };
        }>> | undefined;
    }, {
        disabled?: boolean | undefined;
        unstyled?: boolean | undefined;
        size?: import("@gui/web").SizeTokens | undefined;
    }>> & {
        /** The value for the tabs state to be changed to after activation of the trigger */
        value: string;
        /** Used for making custom indicators when trigger interacted with */
        onInteraction?: (type: InteractionType, layout: TabLayout | null) => void;
        /** Custom styles to apply when tab is active */
        activeStyle?: TabsTriggerFrameProps;
        /** Theme to apply when tab is active (use null for no theme) */
        activeTheme?: string | null;
    } & {
        __scopeTabs?: string;
    }, GuiElement, import("@gui/core").RNGuiViewNonStyleProps & Omit<import("@gui/core").RNGuiViewNonStyleProps, "disabled" | "unstyled" | keyof import("@gui/web").StackStyleBase | "size" | "activeStyle"> & import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase & {
        readonly activeStyle?: Partial<import("@gui/web").InferStyleProps<React.ForwardRefExoticComponent<Omit<import("@gui/core").RNGuiViewNonStyleProps, keyof import("@gui/web").StackStyleBase> & import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>> & import("@gui/web").WithPseudoProps<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>>> & import("@gui/web").WithMediaProps<import("@gui/web").WithThemeShorthandsAndPseudos<import("@gui/web").StackStyleBase, {}>> & React.RefAttributes<GuiElement>> & import("@gui/web").StaticComponentObject<import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}> & Omit<{}, "staticConfig" | "styleable"> & {
            __tama: [import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}];
        }, {
            accept: {
                readonly activeStyle: "style";
            };
        }>> | undefined;
    }> & {
        disabled?: boolean | undefined;
        unstyled?: boolean | undefined;
        size?: import("@gui/web").SizeTokens | undefined;
    } & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase & {
        readonly activeStyle?: Partial<import("@gui/web").InferStyleProps<React.ForwardRefExoticComponent<Omit<import("@gui/core").RNGuiViewNonStyleProps, keyof import("@gui/web").StackStyleBase> & import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>> & import("@gui/web").WithPseudoProps<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>>> & import("@gui/web").WithMediaProps<import("@gui/web").WithThemeShorthandsAndPseudos<import("@gui/web").StackStyleBase, {}>> & React.RefAttributes<GuiElement>> & import("@gui/web").StaticComponentObject<import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}> & Omit<{}, "staticConfig" | "styleable"> & {
            __tama: [import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}];
        }, {
            accept: {
                readonly activeStyle: "style";
            };
        }>> | undefined;
    }>> & import("@gui/web").WithPseudoProps<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase & {
        readonly activeStyle?: Partial<import("@gui/web").InferStyleProps<React.ForwardRefExoticComponent<Omit<import("@gui/core").RNGuiViewNonStyleProps, keyof import("@gui/web").StackStyleBase> & import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>> & import("@gui/web").WithPseudoProps<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>>> & import("@gui/web").WithMediaProps<import("@gui/web").WithThemeShorthandsAndPseudos<import("@gui/web").StackStyleBase, {}>> & React.RefAttributes<GuiElement>> & import("@gui/web").StaticComponentObject<import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}> & Omit<{}, "staticConfig" | "styleable"> & {
            __tama: [import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}];
        }, {
            accept: {
                readonly activeStyle: "style";
            };
        }>> | undefined;
    }> & {
        disabled?: boolean | undefined;
        unstyled?: boolean | undefined;
        size?: import("@gui/web").SizeTokens | undefined;
    } & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase & {
        readonly activeStyle?: Partial<import("@gui/web").InferStyleProps<React.ForwardRefExoticComponent<Omit<import("@gui/core").RNGuiViewNonStyleProps, keyof import("@gui/web").StackStyleBase> & import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>> & import("@gui/web").WithPseudoProps<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>>> & import("@gui/web").WithMediaProps<import("@gui/web").WithThemeShorthandsAndPseudos<import("@gui/web").StackStyleBase, {}>> & React.RefAttributes<GuiElement>> & import("@gui/web").StaticComponentObject<import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}> & Omit<{}, "staticConfig" | "styleable"> & {
            __tama: [import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}];
        }, {
            accept: {
                readonly activeStyle: "style";
            };
        }>> | undefined;
    }>>> & import("@gui/web").WithMediaProps<import("@gui/web").WithThemeShorthandsAndPseudos<import("@gui/web").StackStyleBase & {
        readonly activeStyle?: Partial<import("@gui/web").InferStyleProps<React.ForwardRefExoticComponent<Omit<import("@gui/core").RNGuiViewNonStyleProps, keyof import("@gui/web").StackStyleBase> & import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>> & import("@gui/web").WithPseudoProps<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>>> & import("@gui/web").WithMediaProps<import("@gui/web").WithThemeShorthandsAndPseudos<import("@gui/web").StackStyleBase, {}>> & React.RefAttributes<GuiElement>> & import("@gui/web").StaticComponentObject<import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}> & Omit<{}, "staticConfig" | "styleable"> & {
            __tama: [import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}];
        }, {
            accept: {
                readonly activeStyle: "style";
            };
        }>> | undefined;
    }, {
        disabled?: boolean | undefined;
        unstyled?: boolean | undefined;
        size?: import("@gui/web").SizeTokens | undefined;
    }>> & {
        /** The value for the tabs state to be changed to after activation of the trigger */
        value: string;
        /** Used for making custom indicators when trigger interacted with */
        onInteraction?: (type: InteractionType, layout: TabLayout | null) => void;
        /** Custom styles to apply when tab is active */
        activeStyle?: TabsTriggerFrameProps;
        /** Theme to apply when tab is active (use null for no theme) */
        activeTheme?: string | null;
    } & {
        __scopeTabs?: string;
    }, import("@gui/web").StackStyleBase & {
        readonly activeStyle?: Partial<import("@gui/web").InferStyleProps<React.ForwardRefExoticComponent<Omit<import("@gui/core").RNGuiViewNonStyleProps, keyof import("@gui/web").StackStyleBase> & import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>> & import("@gui/web").WithPseudoProps<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>>> & import("@gui/web").WithMediaProps<import("@gui/web").WithThemeShorthandsAndPseudos<import("@gui/web").StackStyleBase, {}>> & React.RefAttributes<GuiElement>> & import("@gui/web").StaticComponentObject<import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}> & Omit<{}, "staticConfig" | "styleable"> & {
            __tama: [import("@gui/web").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {}, {}];
        }, {
            accept: {
                readonly activeStyle: "style";
            };
        }>> | undefined;
    }, {
        disabled?: boolean | undefined;
        unstyled?: boolean | undefined;
        size?: import("@gui/web").SizeTokens | undefined;
    }, {
        accept: {
            readonly activeStyle: "style";
        };
    }>;
    Content: import("@gui/web").GuiComponent<Omit<import("@gui/web").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/web").StackStyleBase, {
        elevation?: number | import("@gui/web").SizeTokens | undefined;
        transparent?: boolean | undefined;
        fullscreen?: boolean | undefined;
        circular?: boolean | undefined;
        elevate?: boolean | undefined;
        bordered?: boolean | undefined;
        chromeless?: boolean | "all" | undefined;
    }>, keyof TabsContentExtraProps> & TabsContentExtraProps, GuiElement, import("@gui/core").RNGuiViewNonStyleProps & TabsContentExtraProps, import("@gui/web").StackStyleBase, {
        elevation?: number | import("@gui/web").SizeTokens | undefined;
        transparent?: boolean | undefined;
        fullscreen?: boolean | undefined;
        circular?: boolean | undefined;
        elevate?: boolean | undefined;
        bordered?: boolean | undefined;
        chromeless?: boolean | "all" | undefined;
    }, import("@gui/web").StaticConfigPublic>;
};
type TabsFrameProps = GetProps<typeof DefaultTabsFrame>;
type TabsExtraProps<Tab = string> = {
    /** The value for the selected tab, if controlled */
    value?: string;
    /** The value of the tab to select by default, if uncontrolled */
    defaultValue?: Tab;
    /** A function called when a new tab is selected */
    onValueChange?: (value: Tab) => void;
    /**
     * The orientation the tabs are layed out.
     * Mainly so arrow navigation is done accordingly (left & right vs. up & down)
     * @defaultValue horizontal
     */
    orientation?: RovingFocusGroupProps['orientation'];
    /**
     * The direction of navigation between toolbar items.
     */
    dir?: RovingFocusGroupProps['dir'];
    /**
     * Whether a tab is activated automatically or manually. Only supported in web.
     * @defaultValue automatic
     * */
    activationMode?: 'automatic' | 'manual';
};
type TabsProps<Tab = string> = TabsFrameProps & TabsExtraProps<Tab>;
type TabsListFrameProps = GroupProps;
type TabsListProps = TabsListFrameProps & {
    /**
     * Whether to loop over after reaching the end or start of the items
     * @default true
     */
    loop?: boolean;
};
type InteractionType = 'select' | 'focus' | 'hover';
type TabLayout = LayoutRectangle;
type TabsTriggerFrameProps = GetProps<typeof DefaultTabsTabFrame>;
/**
 * @deprecated use `TabTabsProps` instead
 */
type TabsTriggerProps = TabsTriggerFrameProps & {
    /** The value for the tabs state to be changed to after activation of the trigger */
    value: string;
    /** Used for making custom indicators when trigger interacted with */
    onInteraction?: (type: InteractionType, layout: TabLayout | null) => void;
    /** Custom styles to apply when tab is active */
    activeStyle?: TabsTriggerFrameProps;
    /** Theme to apply when tab is active (use null for no theme) */
    activeTheme?: string | null;
};
type TabsTabProps = TabsTriggerProps;
type TabsTriggerLayout = LayoutRectangle;
type TabsContentFrameProps = GetProps<typeof DefaultTabsContentFrame>;
type TabsContentExtraProps = {
    /** Will show the content when the value matches the state of Tabs root */
    value: string;
    /**
     * Used to force mounting when more control is needed. Useful when
     * controlling animation with Gui animations.
     */
    forceMount?: boolean;
};
type TabsContentProps = TabsContentFrameProps & TabsContentExtraProps;
export type { TabLayout, TabsContentProps, TabsListProps, TabsProps, TabsTabProps, TabsTriggerLayout, TabsTriggerProps, };
//# sourceMappingURL=createTabs.d.ts.map