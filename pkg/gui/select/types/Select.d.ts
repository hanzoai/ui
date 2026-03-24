import type { FontSizeTokens, GetProps, SizeTokens, GuiElement } from '@gui/core';
import * as React from 'react';
import type { SelectProps, SelectScopedProps } from './types';
declare const SelectValueFrame: import("@gui/core").GuiComponent<import("@gui/core").TamaDefer, import("@gui/core").GuiTextElement, import("@gui/core").TextNonStyleProps, import("@gui/core").TextStylePropsBase, {
    unstyled?: boolean | undefined;
    size?: import("@gui/web").FontSizeTokens | undefined;
}, import("@gui/core").StaticConfigPublic>;
export type SelectValueExtraProps = SelectScopedProps<{
    placeholder?: React.ReactNode;
}>;
export type SelectValueProps = GetProps<typeof SelectValueFrame> & SelectValueExtraProps;
export declare const SelectIcon: import("@gui/core").GuiComponent<import("@gui/core").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
    elevation?: number | SizeTokens | undefined;
    fullscreen?: boolean | undefined;
}, import("@gui/core").StaticConfigPublic>;
declare const SelectIndicatorFrame: import("@gui/core").GuiComponent<import("@gui/core").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
    unstyled?: boolean | undefined;
    elevation?: number | SizeTokens | undefined;
    fullscreen?: boolean | undefined;
}, import("@gui/core").StaticConfigPublic>;
export type SelectIndicatorProps = GetProps<typeof SelectIndicatorFrame>;
export declare const SelectGroupFrame: import("@gui/core").GuiComponent<import("@gui/core").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
    elevation?: number | SizeTokens | undefined;
    fullscreen?: boolean | undefined;
}, import("@gui/core").StaticConfigPublic>;
declare const SelectLabelFrame: import("@gui/core").GuiComponent<import("@gui/core").TamaDefer, import("@gui/core").GuiTextElement, import("@gui/core").TextNonStyleProps, import("@gui/core").TextStylePropsBase, {
    size?: SizeTokens | FontSizeTokens | undefined;
    unstyled?: boolean | undefined;
}, import("@gui/core").StaticConfigPublic>;
export type SelectLabelProps = SelectScopedProps<GetProps<typeof SelectLabelFrame>>;
export declare const SelectSeparator: import("@gui/core").GuiComponent<import("@gui/core").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
    unstyled?: boolean | undefined;
    vertical?: boolean | undefined;
}, import("@gui/core").StaticConfigPublic>;
export declare const Select: (<Value extends string = string>(props: SelectScopedProps<SelectProps<Value>>) => import("react/jsx-runtime").JSX.Element) & {
    Adapt: ((props: import("@gui/adapt").AdaptProps) => import("react/jsx-runtime").JSX.Element) & {
        Contents: {
            ({ scope, ...rest }: {
                scope?: string;
            }): React.FunctionComponentElement<any>;
            shouldForwardSpace: boolean;
        };
    };
    Content: ({ children, scope, ...focusScopeProps }: import("./types").SelectContentProps & import("@gui/focus-scope").FocusScopeProps) => import("react/jsx-runtime").JSX.Element | null;
    Group: React.ForwardRefExoticComponent<Omit<import("@gui/core").RNGuiViewNonStyleProps, "elevation" | keyof import("@gui/core").StackStyleBase | "fullscreen"> & import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
        elevation?: number | SizeTokens | undefined;
        fullscreen?: boolean | undefined;
    } & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>> & import("@gui/core").WithPseudoProps<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
        elevation?: number | SizeTokens | undefined;
        fullscreen?: boolean | undefined;
    } & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>>> & import("@gui/core").WithMediaProps<import("@gui/core").WithThemeShorthandsAndPseudos<import("@gui/core").StackStyleBase, {
        elevation?: number | SizeTokens | undefined;
        fullscreen?: boolean | undefined;
    }>> & {
        scope?: import("./types").SelectScopes;
    } & React.RefAttributes<GuiElement>>;
    Icon: import("@gui/core").GuiComponent<import("@gui/core").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
        elevation?: number | SizeTokens | undefined;
        fullscreen?: boolean | undefined;
    }, import("@gui/core").StaticConfigPublic>;
    Item: import("@gui/core").GuiComponent<Omit<import("@gui/core").GetFinalProps<import("@gui/core").StackNonStyleProps, import("@gui/core").StackStyleBase, {
        size?: SizeTokens | undefined;
        variant?: "outlined" | undefined;
        disabled?: boolean | undefined;
        unstyled?: boolean | undefined;
        active?: boolean | undefined;
    }>, keyof import("./SelectItem").SelectItemExtraProps> & import("./SelectItem").SelectItemExtraProps, GuiElement, import("@gui/core").StackNonStyleProps & import("./SelectItem").SelectItemExtraProps, import("@gui/core").StackStyleBase, {
        size?: SizeTokens | undefined;
        variant?: "outlined" | undefined;
        disabled?: boolean | undefined;
        unstyled?: boolean | undefined;
        active?: boolean | undefined;
    }, import("@gui/core").StaticConfigPublic>;
    ItemIndicator: React.ForwardRefExoticComponent<Omit<import("@gui/core").RNGuiViewNonStyleProps, "elevation" | keyof import("@gui/core").StackStyleBase | "fullscreen"> & import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
        elevation?: number | SizeTokens | undefined;
        fullscreen?: boolean | undefined;
    } & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>> & import("@gui/core").WithPseudoProps<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
        elevation?: number | SizeTokens | undefined;
        fullscreen?: boolean | undefined;
    } & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>>> & import("@gui/core").WithMediaProps<import("@gui/core").WithThemeShorthandsAndPseudos<import("@gui/core").StackStyleBase, {
        elevation?: number | SizeTokens | undefined;
        fullscreen?: boolean | undefined;
    }>> & {
        scope?: import("./types").SelectScopes;
    } & React.RefAttributes<GuiElement>>;
    ItemText: import("@gui/core").GuiComponent<Omit<import("@gui/core").GetFinalProps<import("@gui/core").TextNonStyleProps, import("@gui/core").TextStylePropsBase, {
        size?: FontSizeTokens | undefined;
        unstyled?: boolean | undefined;
    }>, "scope"> & {
        scope?: import("./types").SelectScopes;
    }, import("@gui/core").GuiTextElement, import("@gui/core").TextNonStyleProps & {
        scope?: import("./types").SelectScopes;
    }, import("@gui/core").TextStylePropsBase, {
        size?: FontSizeTokens | undefined;
        unstyled?: boolean | undefined;
    }, import("@gui/core").StaticConfigPublic>;
    Label: import("@gui/core").GuiComponent<Omit<import("@gui/core").GetFinalProps<import("@gui/core").TextNonStyleProps, import("@gui/core").TextStylePropsBase, {
        size?: SizeTokens | FontSizeTokens | undefined;
        unstyled?: boolean | undefined;
    }>, "scope"> & {
        scope?: any;
    }, import("@gui/core").GuiTextElement, import("@gui/core").TextNonStyleProps & {
        scope?: any;
    }, import("@gui/core").TextStylePropsBase, {
        size?: SizeTokens | FontSizeTokens | undefined;
        unstyled?: boolean | undefined;
    }, import("@gui/core").StaticConfigPublic>;
    ScrollDownButton: React.ForwardRefExoticComponent<import("./types").SelectScrollButtonProps & React.RefAttributes<GuiElement>>;
    ScrollUpButton: React.ForwardRefExoticComponent<import("./types").SelectScrollButtonProps & React.RefAttributes<GuiElement>>;
    Trigger: React.ForwardRefExoticComponent<Omit<import("@gui/core").StackNonStyleProps, "disabled" | "size" | "unstyled" | keyof import("@gui/core").StackStyleBase | "variant" | "active"> & import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
        size?: SizeTokens | undefined;
        variant?: "outlined" | undefined;
        disabled?: boolean | undefined;
        unstyled?: boolean | undefined;
        active?: boolean | undefined;
    } & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>> & import("@gui/core").WithPseudoProps<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
        size?: SizeTokens | undefined;
        variant?: "outlined" | undefined;
        disabled?: boolean | undefined;
        unstyled?: boolean | undefined;
        active?: boolean | undefined;
    } & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>>> & import("@gui/core").WithMediaProps<import("@gui/core").WithThemeShorthandsAndPseudos<import("@gui/core").StackStyleBase, {
        size?: SizeTokens | undefined;
        variant?: "outlined" | undefined;
        disabled?: boolean | undefined;
        unstyled?: boolean | undefined;
        active?: boolean | undefined;
    }>> & import("@gui/list-item").ListItemExtraProps & {
        scope?: import("./types").SelectScopes;
    } & React.RefAttributes<GuiElement>>;
    Value: import("@gui/core").GuiComponent<Omit<import("@gui/core").GetFinalProps<import("@gui/core").TextNonStyleProps, import("@gui/core").TextStylePropsBase, {
        unstyled?: boolean | undefined;
        size?: import("@gui/web").FontSizeTokens | undefined;
    }>, "scope" | "placeholder"> & {
        placeholder?: React.ReactNode;
    } & {
        scope?: import("./types").SelectScopes;
    }, import("@gui/core").GuiTextElement, import("@gui/core").TextNonStyleProps & {
        placeholder?: React.ReactNode;
    } & {
        scope?: import("./types").SelectScopes;
    }, import("@gui/core").TextStylePropsBase, {
        unstyled?: boolean | undefined;
        size?: import("@gui/web").FontSizeTokens | undefined;
    }, import("@gui/core").StaticConfigPublic>;
    Viewport: import("@gui/core").GuiComponent<Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
        size?: SizeTokens | undefined;
        unstyled?: boolean | undefined;
        elevation?: number | SizeTokens | undefined;
        fullscreen?: boolean | undefined;
    }>, "size" | "unstyled" | "scope" | "disableScroll"> & {
        size?: SizeTokens;
        disableScroll?: boolean;
        unstyled?: boolean;
    } & {
        scope?: import("./types").SelectScopes;
    }, GuiElement, import("@gui/core").RNGuiViewNonStyleProps & {
        size?: SizeTokens;
        disableScroll?: boolean;
        unstyled?: boolean;
    } & {
        scope?: import("./types").SelectScopes;
    }, import("@gui/core").StackStyleBase, {
        size?: SizeTokens | undefined;
        unstyled?: boolean | undefined;
        elevation?: number | SizeTokens | undefined;
        fullscreen?: boolean | undefined;
    }, import("@gui/core").StaticConfigPublic>;
    Indicator: import("@gui/core").GuiComponent<Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
        unstyled?: boolean | undefined;
        elevation?: number | SizeTokens | undefined;
        fullscreen?: boolean | undefined;
    }>, "style" | "disabled" | "onChange" | "className" | "id" | "tabIndex" | "role" | "rel" | "aria-busy" | "aria-checked" | "aria-disabled" | "aria-expanded" | "aria-hidden" | "aria-label" | "aria-labelledby" | "aria-live" | "aria-modal" | "aria-selected" | "aria-valuemax" | "aria-valuemin" | "aria-valuenow" | "aria-valuetext" | "children" | "dangerouslySetInnerHTML" | "onCopy" | "onCut" | "onPaste" | "onFocus" | "onBlur" | "onBeforeInput" | "onInput" | "onKeyDown" | "onKeyUp" | "onClick" | "onContextMenu" | "onDoubleClick" | "onDrag" | "onDragEnd" | "onDragEnter" | "onDragLeave" | "onDragOver" | "onDragStart" | "onDrop" | "onMouseDown" | "onMouseEnter" | "onMouseLeave" | "onMouseMove" | "onMouseOut" | "onMouseOver" | "onMouseUp" | "onTouchCancel" | "onTouchEnd" | "onTouchEndCapture" | "onTouchMove" | "onTouchStart" | "onPointerDown" | "onPointerDownCapture" | "onPointerMove" | "onPointerMoveCapture" | "onPointerUp" | "onPointerUpCapture" | "onPointerCancel" | "onPointerCancelCapture" | "onPointerEnter" | "onPointerLeave" | "onScroll" | "onWheel" | "theme" | "debug" | `$${string}` | "hitSlop" | "target" | "htmlFor" | "asChild" | "themeShallow" | "unstyled" | "render" | "group" | "untilMeasured" | "componentName" | "disableOptimization" | "forceStyle" | "disableClassName" | "animatedBy" | "onStartShouldSetResponder" | "onScrollShouldSetResponder" | "onScrollShouldSetResponderCapture" | "onSelectionChangeShouldSetResponder" | "onSelectionChangeShouldSetResponderCapture" | "onLayout" | "elevationAndroid" | "download" | "onMoveShouldSetResponder" | "onResponderEnd" | "onResponderGrant" | "onResponderReject" | "onResponderMove" | "onResponderRelease" | "onResponderStart" | "onResponderTerminationRequest" | "onResponderTerminate" | "onStartShouldSetResponderCapture" | "onMoveShouldSetResponderCapture" | "needsOffscreenAlphaCompositing" | "removeClippedSubviews" | "testID" | "nativeID" | "collapsable" | "collapsableChildren" | "renderToHardwareTextureAndroid" | "focusable" | "shouldRasterizeIOS" | "isTVSelectable" | "hasTVPreferredFocus" | "tvParallaxShiftDistanceX" | "tvParallaxShiftDistanceY" | "tvParallaxTiltAngle" | "tvParallaxMagnification" | "onPointerEnterCapture" | "onPointerLeaveCapture" | "accessible" | "accessibilityActions" | "accessibilityLabel" | "accessibilityRole" | "accessibilityState" | "accessibilityHint" | "accessibilityValue" | "onAccessibilityAction" | "importantForAccessibility" | "accessibilityLabelledBy" | "accessibilityLiveRegion" | "screenReaderFocusable" | "accessibilityElementsHidden" | "accessibilityViewIsModal" | "onAccessibilityEscape" | "onAccessibilityTap" | "onMagicTap" | "accessibilityIgnoresInvertColors" | "accessibilityLanguage" | "accessibilityShowsLargeContentViewer" | "accessibilityLargeContentTitle" | "accessibilityRespondsToUserInteraction" | "onPress" | "onLongPress" | "onPressIn" | "onPressOut" | "elevation" | keyof import("@gui/core").StackStyleBase | "fullscreen" | `$${number}` | import("@gui/core").GroupMediaKeys | `$theme-${string}` | `$theme-${number}` | "scope" | keyof import("@gui/core").WithPseudoProps<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
        unstyled?: boolean | undefined;
        elevation?: number | SizeTokens | undefined;
        fullscreen?: boolean | undefined;
    } & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>>>> & Omit<import("@gui/core").RNGuiViewNonStyleProps, "unstyled" | "elevation" | keyof import("@gui/core").StackStyleBase | "fullscreen"> & import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
        unstyled?: boolean | undefined;
        elevation?: number | SizeTokens | undefined;
        fullscreen?: boolean | undefined;
    } & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>> & import("@gui/core").WithPseudoProps<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
        unstyled?: boolean | undefined;
        elevation?: number | SizeTokens | undefined;
        fullscreen?: boolean | undefined;
    } & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>>> & import("@gui/core").WithMediaProps<import("@gui/core").WithThemeShorthandsAndPseudos<import("@gui/core").StackStyleBase, {
        unstyled?: boolean | undefined;
        elevation?: number | SizeTokens | undefined;
        fullscreen?: boolean | undefined;
    }>> & {
        scope?: import("./types").SelectScopes;
    }, GuiElement, import("@gui/core").RNGuiViewNonStyleProps & Omit<import("@gui/core").RNGuiViewNonStyleProps, "unstyled" | "elevation" | keyof import("@gui/core").StackStyleBase | "fullscreen"> & import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
        unstyled?: boolean | undefined;
        elevation?: number | SizeTokens | undefined;
        fullscreen?: boolean | undefined;
    } & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>> & import("@gui/core").WithPseudoProps<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
        unstyled?: boolean | undefined;
        elevation?: number | SizeTokens | undefined;
        fullscreen?: boolean | undefined;
    } & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>>> & import("@gui/core").WithMediaProps<import("@gui/core").WithThemeShorthandsAndPseudos<import("@gui/core").StackStyleBase, {
        unstyled?: boolean | undefined;
        elevation?: number | SizeTokens | undefined;
        fullscreen?: boolean | undefined;
    }>> & {
        scope?: import("./types").SelectScopes;
    }, import("@gui/core").StackStyleBase, {
        unstyled?: boolean | undefined;
        elevation?: number | SizeTokens | undefined;
        fullscreen?: boolean | undefined;
    }, import("@gui/core").StaticConfigPublic>;
    FocusScope: (props: import("@gui/focus-scope/types/types").ScopedProps<import("@gui/focus-scope").FocusScopeControllerProps>) => import("react/jsx-runtime").JSX.Element;
};
export {};
//# sourceMappingURL=Select.d.ts.map