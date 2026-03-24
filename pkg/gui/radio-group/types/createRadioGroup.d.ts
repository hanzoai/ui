import type { GetProps } from '@gui/core';
import React from 'react';
import { RadioGroupFrame, RadioGroupIndicatorFrame, RadioGroupItemFrame } from './RadioGroup';
type RadioIndicatorProps = GetProps<typeof RadioGroupIndicatorFrame> & {
    forceMount?: boolean;
    unstyled?: boolean;
};
export type RadioGroupItemProps = GetProps<typeof RadioGroupItemFrame> & {
    value: string;
    id?: string;
    labelledBy?: string;
    disabled?: boolean;
};
export type RadioGroupProps = GetProps<typeof RadioGroupFrame> & {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    required?: boolean;
    disabled?: boolean;
    name?: string;
    native?: boolean;
    accentColor?: string;
};
type RadioGroupComponent = (props: RadioGroupProps) => any;
type RadioGroupIndicatorComponent = (props: RadioIndicatorProps) => any;
type RadioGroupItemComponent = (props: RadioGroupItemProps) => any;
export declare function createRadioGroup<F extends RadioGroupComponent, D extends RadioGroupIndicatorComponent, I extends RadioGroupItemComponent>(createProps: {
    disableActiveTheme?: boolean;
    Frame?: F;
    Indicator?: D;
    Item?: I;
}): React.ForwardRefExoticComponent<Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
    elevation?: number | import("@gui/core").SizeTokens | undefined;
    fullscreen?: boolean | undefined;
    orientation?: "horizontal" | "vertical" | undefined;
}>, "native" | `$${string}` | `$${number}` | import("@gui/core").GroupMediaKeys | `$theme-${string}` | `$theme-${number}` | "name" | keyof import("@gui/core").RNGuiViewNonStyleProps | "elevation" | keyof import("@gui/core").StackStyleBase | "fullscreen" | "value" | "orientation" | keyof import("@gui/core").WithPseudoProps<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
    elevation?: number | import("@gui/core").SizeTokens | undefined;
    fullscreen?: boolean | undefined;
    orientation?: "horizontal" | "vertical" | undefined;
} & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>>> | "defaultValue" | "onValueChange" | "required" | "accentColor"> & Omit<import("@gui/core").RNGuiViewNonStyleProps, "elevation" | keyof import("@gui/core").StackStyleBase | "fullscreen" | "orientation"> & import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
    elevation?: number | import("@gui/core").SizeTokens | undefined;
    fullscreen?: boolean | undefined;
    orientation?: "horizontal" | "vertical" | undefined;
} & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>> & import("@gui/core").WithPseudoProps<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
    elevation?: number | import("@gui/core").SizeTokens | undefined;
    fullscreen?: boolean | undefined;
    orientation?: "horizontal" | "vertical" | undefined;
} & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>>> & import("@gui/core").WithMediaProps<import("@gui/core").WithThemeShorthandsAndPseudos<import("@gui/core").StackStyleBase, {
    elevation?: number | import("@gui/core").SizeTokens | undefined;
    fullscreen?: boolean | undefined;
    orientation?: "horizontal" | "vertical" | undefined;
}>> & {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    required?: boolean;
    disabled?: boolean;
    name?: string;
    native?: boolean;
    accentColor?: string;
} & React.RefAttributes<import("@gui/core").GuiElement>> & import("@gui/core").StaticComponentObject<Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
    elevation?: number | import("@gui/core").SizeTokens | undefined;
    fullscreen?: boolean | undefined;
    orientation?: "horizontal" | "vertical" | undefined;
}>, "native" | `$${string}` | `$${number}` | import("@gui/core").GroupMediaKeys | `$theme-${string}` | `$theme-${number}` | "name" | keyof import("@gui/core").RNGuiViewNonStyleProps | "elevation" | keyof import("@gui/core").StackStyleBase | "fullscreen" | "value" | "orientation" | keyof import("@gui/core").WithPseudoProps<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
    elevation?: number | import("@gui/core").SizeTokens | undefined;
    fullscreen?: boolean | undefined;
    orientation?: "horizontal" | "vertical" | undefined;
} & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>>> | "defaultValue" | "onValueChange" | "required" | "accentColor"> & Omit<import("@gui/core").RNGuiViewNonStyleProps, "elevation" | keyof import("@gui/core").StackStyleBase | "fullscreen" | "orientation"> & import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
    elevation?: number | import("@gui/core").SizeTokens | undefined;
    fullscreen?: boolean | undefined;
    orientation?: "horizontal" | "vertical" | undefined;
} & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>> & import("@gui/core").WithPseudoProps<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
    elevation?: number | import("@gui/core").SizeTokens | undefined;
    fullscreen?: boolean | undefined;
    orientation?: "horizontal" | "vertical" | undefined;
} & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>>> & import("@gui/core").WithMediaProps<import("@gui/core").WithThemeShorthandsAndPseudos<import("@gui/core").StackStyleBase, {
    elevation?: number | import("@gui/core").SizeTokens | undefined;
    fullscreen?: boolean | undefined;
    orientation?: "horizontal" | "vertical" | undefined;
}>> & {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    required?: boolean;
    disabled?: boolean;
    name?: string;
    native?: boolean;
    accentColor?: string;
}, import("@gui/core").GuiElement, import("@gui/core").RNGuiViewNonStyleProps & Omit<import("@gui/core").RNGuiViewNonStyleProps, "elevation" | keyof import("@gui/core").StackStyleBase | "fullscreen" | "orientation"> & import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
    elevation?: number | import("@gui/core").SizeTokens | undefined;
    fullscreen?: boolean | undefined;
    orientation?: "horizontal" | "vertical" | undefined;
} & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>> & import("@gui/core").WithPseudoProps<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
    elevation?: number | import("@gui/core").SizeTokens | undefined;
    fullscreen?: boolean | undefined;
    orientation?: "horizontal" | "vertical" | undefined;
} & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>>> & import("@gui/core").WithMediaProps<import("@gui/core").WithThemeShorthandsAndPseudos<import("@gui/core").StackStyleBase, {
    elevation?: number | import("@gui/core").SizeTokens | undefined;
    fullscreen?: boolean | undefined;
    orientation?: "horizontal" | "vertical" | undefined;
}>> & {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    required?: boolean;
    disabled?: boolean;
    name?: string;
    native?: boolean;
    accentColor?: string;
}, import("@gui/core").StackStyleBase, {
    elevation?: number | import("@gui/core").SizeTokens | undefined;
    fullscreen?: boolean | undefined;
    orientation?: "horizontal" | "vertical" | undefined;
}, import("@gui/core").StaticConfigPublic> & Omit<import("@gui/core").StaticConfigPublic, "staticConfig" | "styleable"> & {
    __tama: [Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
        elevation?: number | import("@gui/core").SizeTokens | undefined;
        fullscreen?: boolean | undefined;
        orientation?: "horizontal" | "vertical" | undefined;
    }>, "native" | `$${string}` | `$${number}` | import("@gui/core").GroupMediaKeys | `$theme-${string}` | `$theme-${number}` | "name" | keyof import("@gui/core").RNGuiViewNonStyleProps | "elevation" | keyof import("@gui/core").StackStyleBase | "fullscreen" | "value" | "orientation" | keyof import("@gui/core").WithPseudoProps<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
        elevation?: number | import("@gui/core").SizeTokens | undefined;
        fullscreen?: boolean | undefined;
        orientation?: "horizontal" | "vertical" | undefined;
    } & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>>> | "defaultValue" | "onValueChange" | "required" | "accentColor"> & Omit<import("@gui/core").RNGuiViewNonStyleProps, "elevation" | keyof import("@gui/core").StackStyleBase | "fullscreen" | "orientation"> & import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
        elevation?: number | import("@gui/core").SizeTokens | undefined;
        fullscreen?: boolean | undefined;
        orientation?: "horizontal" | "vertical" | undefined;
    } & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>> & import("@gui/core").WithPseudoProps<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
        elevation?: number | import("@gui/core").SizeTokens | undefined;
        fullscreen?: boolean | undefined;
        orientation?: "horizontal" | "vertical" | undefined;
    } & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>>> & import("@gui/core").WithMediaProps<import("@gui/core").WithThemeShorthandsAndPseudos<import("@gui/core").StackStyleBase, {
        elevation?: number | import("@gui/core").SizeTokens | undefined;
        fullscreen?: boolean | undefined;
        orientation?: "horizontal" | "vertical" | undefined;
    }>> & {
        value?: string;
        defaultValue?: string;
        onValueChange?: (value: string) => void;
        required?: boolean;
        disabled?: boolean;
        name?: string;
        native?: boolean;
        accentColor?: string;
    }, import("@gui/core").GuiElement, import("@gui/core").RNGuiViewNonStyleProps & Omit<import("@gui/core").RNGuiViewNonStyleProps, "elevation" | keyof import("@gui/core").StackStyleBase | "fullscreen" | "orientation"> & import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
        elevation?: number | import("@gui/core").SizeTokens | undefined;
        fullscreen?: boolean | undefined;
        orientation?: "horizontal" | "vertical" | undefined;
    } & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>> & import("@gui/core").WithPseudoProps<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
        elevation?: number | import("@gui/core").SizeTokens | undefined;
        fullscreen?: boolean | undefined;
        orientation?: "horizontal" | "vertical" | undefined;
    } & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>>> & import("@gui/core").WithMediaProps<import("@gui/core").WithThemeShorthandsAndPseudos<import("@gui/core").StackStyleBase, {
        elevation?: number | import("@gui/core").SizeTokens | undefined;
        fullscreen?: boolean | undefined;
        orientation?: "horizontal" | "vertical" | undefined;
    }>> & {
        value?: string;
        defaultValue?: string;
        onValueChange?: (value: string) => void;
        required?: boolean;
        disabled?: boolean;
        name?: string;
        native?: boolean;
        accentColor?: string;
    }, import("@gui/core").StackStyleBase, {
        elevation?: number | import("@gui/core").SizeTokens | undefined;
        fullscreen?: boolean | undefined;
        orientation?: "horizontal" | "vertical" | undefined;
    }, import("@gui/core").StaticConfigPublic];
} & {
    Item: import("@gui/core").GuiComponent<Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
        disabled?: boolean | undefined;
        unstyled?: boolean | undefined;
        elevation?: number | import("@gui/core").SizeTokens | undefined;
        fullscreen?: boolean | undefined;
        size?: import("@gui/core").SizeTokens | undefined;
    }>, "theme" | "debug" | "style" | `$${string}` | `$${number}` | import("@gui/core").GroupMediaKeys | `$theme-${string}` | `$theme-${number}` | "render" | "hitSlop" | "children" | "target" | "htmlFor" | "asChild" | "dangerouslySetInnerHTML" | "disabled" | "className" | "themeShallow" | "unstyled" | "id" | "group" | "untilMeasured" | "componentName" | "tabIndex" | "role" | "disableOptimization" | "forceStyle" | "disableClassName" | "animatedBy" | "onStartShouldSetResponder" | "onScrollShouldSetResponder" | "onScrollShouldSetResponderCapture" | "onSelectionChangeShouldSetResponder" | "onSelectionChangeShouldSetResponderCapture" | "onLayout" | "elevationAndroid" | "rel" | "download" | "onMoveShouldSetResponder" | "onResponderEnd" | "onResponderGrant" | "onResponderReject" | "onResponderMove" | "onResponderRelease" | "onResponderStart" | "onResponderTerminationRequest" | "onResponderTerminate" | "onStartShouldSetResponderCapture" | "onMoveShouldSetResponderCapture" | "onFocus" | "onBlur" | "onPointerCancel" | "onPointerDown" | "onPointerMove" | "onPointerUp" | "needsOffscreenAlphaCompositing" | "removeClippedSubviews" | "testID" | "nativeID" | "collapsable" | "collapsableChildren" | "renderToHardwareTextureAndroid" | "focusable" | "shouldRasterizeIOS" | "isTVSelectable" | "hasTVPreferredFocus" | "tvParallaxShiftDistanceX" | "tvParallaxShiftDistanceY" | "tvParallaxTiltAngle" | "tvParallaxMagnification" | "onTouchStart" | "onTouchMove" | "onTouchEnd" | "onTouchCancel" | "onTouchEndCapture" | "onPointerEnter" | "onPointerEnterCapture" | "onPointerLeave" | "onPointerLeaveCapture" | "onPointerMoveCapture" | "onPointerCancelCapture" | "onPointerDownCapture" | "onPointerUpCapture" | "accessible" | "accessibilityActions" | "accessibilityLabel" | "aria-label" | "accessibilityRole" | "accessibilityState" | "aria-busy" | "aria-checked" | "aria-disabled" | "aria-expanded" | "aria-selected" | "accessibilityHint" | "accessibilityValue" | "aria-valuemax" | "aria-valuemin" | "aria-valuenow" | "aria-valuetext" | "onAccessibilityAction" | "importantForAccessibility" | "aria-hidden" | "aria-modal" | "accessibilityLabelledBy" | "aria-labelledby" | "accessibilityLiveRegion" | "aria-live" | "screenReaderFocusable" | "accessibilityElementsHidden" | "accessibilityViewIsModal" | "onAccessibilityEscape" | "onAccessibilityTap" | "onMagicTap" | "accessibilityIgnoresInvertColors" | "accessibilityLanguage" | "accessibilityShowsLargeContentViewer" | "accessibilityLargeContentTitle" | "accessibilityRespondsToUserInteraction" | "onPress" | "onLongPress" | "onPressIn" | "onPressOut" | "onMouseEnter" | "onMouseLeave" | "onMouseDown" | "onMouseUp" | "onMouseMove" | "onMouseOver" | "onMouseOut" | "onClick" | "onDoubleClick" | "onContextMenu" | "onWheel" | "onKeyDown" | "onKeyUp" | "onChange" | "onInput" | "onBeforeInput" | "onScroll" | "onCopy" | "onCut" | "onPaste" | "onDrag" | "onDragStart" | "onDragEnd" | "onDragEnter" | "onDragLeave" | "onDragOver" | "onDrop" | "elevation" | keyof import("@gui/core").StackStyleBase | "fullscreen" | "size" | "value" | keyof import("@gui/core").WithPseudoProps<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
        disabled?: boolean | undefined;
        unstyled?: boolean | undefined;
        elevation?: number | import("@gui/core").SizeTokens | undefined;
        fullscreen?: boolean | undefined;
        size?: import("@gui/core").SizeTokens | undefined;
    } & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>>> | "labelledBy"> & Omit<import("@gui/core").RNGuiViewNonStyleProps, "disabled" | "unstyled" | "elevation" | keyof import("@gui/core").StackStyleBase | "fullscreen" | "size"> & import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
        disabled?: boolean | undefined;
        unstyled?: boolean | undefined;
        elevation?: number | import("@gui/core").SizeTokens | undefined;
        fullscreen?: boolean | undefined;
        size?: import("@gui/core").SizeTokens | undefined;
    } & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>> & import("@gui/core").WithPseudoProps<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
        disabled?: boolean | undefined;
        unstyled?: boolean | undefined;
        elevation?: number | import("@gui/core").SizeTokens | undefined;
        fullscreen?: boolean | undefined;
        size?: import("@gui/core").SizeTokens | undefined;
    } & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>>> & import("@gui/core").WithMediaProps<import("@gui/core").WithThemeShorthandsAndPseudos<import("@gui/core").StackStyleBase, {
        disabled?: boolean | undefined;
        unstyled?: boolean | undefined;
        elevation?: number | import("@gui/core").SizeTokens | undefined;
        fullscreen?: boolean | undefined;
        size?: import("@gui/core").SizeTokens | undefined;
    }>> & {
        value: string;
        id?: string;
        labelledBy?: string;
        disabled?: boolean;
    }, import("@gui/core").GuiElement, import("@gui/core").RNGuiViewNonStyleProps & Omit<import("@gui/core").RNGuiViewNonStyleProps, "disabled" | "unstyled" | "elevation" | keyof import("@gui/core").StackStyleBase | "fullscreen" | "size"> & import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
        disabled?: boolean | undefined;
        unstyled?: boolean | undefined;
        elevation?: number | import("@gui/core").SizeTokens | undefined;
        fullscreen?: boolean | undefined;
        size?: import("@gui/core").SizeTokens | undefined;
    } & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>> & import("@gui/core").WithPseudoProps<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
        disabled?: boolean | undefined;
        unstyled?: boolean | undefined;
        elevation?: number | import("@gui/core").SizeTokens | undefined;
        fullscreen?: boolean | undefined;
        size?: import("@gui/core").SizeTokens | undefined;
    } & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>>> & import("@gui/core").WithMediaProps<import("@gui/core").WithThemeShorthandsAndPseudos<import("@gui/core").StackStyleBase, {
        disabled?: boolean | undefined;
        unstyled?: boolean | undefined;
        elevation?: number | import("@gui/core").SizeTokens | undefined;
        fullscreen?: boolean | undefined;
        size?: import("@gui/core").SizeTokens | undefined;
    }>> & {
        value: string;
        id?: string;
        labelledBy?: string;
        disabled?: boolean;
    }, import("@gui/core").StackStyleBase, {
        disabled?: boolean | undefined;
        unstyled?: boolean | undefined;
        elevation?: number | import("@gui/core").SizeTokens | undefined;
        fullscreen?: boolean | undefined;
        size?: import("@gui/core").SizeTokens | undefined;
    }, import("@gui/core").StaticConfigPublic>;
    Indicator: import("@gui/core").GuiComponent<Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
        unstyled?: boolean | undefined;
        elevation?: number | import("@gui/core").SizeTokens | undefined;
        fullscreen?: boolean | undefined;
    }>, "theme" | "debug" | "style" | `$${string}` | `$${number}` | import("@gui/core").GroupMediaKeys | `$theme-${string}` | `$theme-${number}` | "render" | "hitSlop" | "children" | "target" | "htmlFor" | "asChild" | "dangerouslySetInnerHTML" | "disabled" | "className" | "themeShallow" | "unstyled" | "id" | "group" | "untilMeasured" | "componentName" | "tabIndex" | "role" | "disableOptimization" | "forceStyle" | "disableClassName" | "animatedBy" | "onStartShouldSetResponder" | "onScrollShouldSetResponder" | "onScrollShouldSetResponderCapture" | "onSelectionChangeShouldSetResponder" | "onSelectionChangeShouldSetResponderCapture" | "onLayout" | "elevationAndroid" | "rel" | "download" | "onMoveShouldSetResponder" | "onResponderEnd" | "onResponderGrant" | "onResponderReject" | "onResponderMove" | "onResponderRelease" | "onResponderStart" | "onResponderTerminationRequest" | "onResponderTerminate" | "onStartShouldSetResponderCapture" | "onMoveShouldSetResponderCapture" | "onFocus" | "onBlur" | "onPointerCancel" | "onPointerDown" | "onPointerMove" | "onPointerUp" | "needsOffscreenAlphaCompositing" | "removeClippedSubviews" | "testID" | "nativeID" | "collapsable" | "collapsableChildren" | "renderToHardwareTextureAndroid" | "focusable" | "shouldRasterizeIOS" | "isTVSelectable" | "hasTVPreferredFocus" | "tvParallaxShiftDistanceX" | "tvParallaxShiftDistanceY" | "tvParallaxTiltAngle" | "tvParallaxMagnification" | "onTouchStart" | "onTouchMove" | "onTouchEnd" | "onTouchCancel" | "onTouchEndCapture" | "onPointerEnter" | "onPointerEnterCapture" | "onPointerLeave" | "onPointerLeaveCapture" | "onPointerMoveCapture" | "onPointerCancelCapture" | "onPointerDownCapture" | "onPointerUpCapture" | "accessible" | "accessibilityActions" | "accessibilityLabel" | "aria-label" | "accessibilityRole" | "accessibilityState" | "aria-busy" | "aria-checked" | "aria-disabled" | "aria-expanded" | "aria-selected" | "accessibilityHint" | "accessibilityValue" | "aria-valuemax" | "aria-valuemin" | "aria-valuenow" | "aria-valuetext" | "onAccessibilityAction" | "importantForAccessibility" | "aria-hidden" | "aria-modal" | "accessibilityLabelledBy" | "aria-labelledby" | "accessibilityLiveRegion" | "aria-live" | "screenReaderFocusable" | "accessibilityElementsHidden" | "accessibilityViewIsModal" | "onAccessibilityEscape" | "onAccessibilityTap" | "onMagicTap" | "accessibilityIgnoresInvertColors" | "accessibilityLanguage" | "accessibilityShowsLargeContentViewer" | "accessibilityLargeContentTitle" | "accessibilityRespondsToUserInteraction" | "onPress" | "onLongPress" | "onPressIn" | "onPressOut" | "onMouseEnter" | "onMouseLeave" | "onMouseDown" | "onMouseUp" | "onMouseMove" | "onMouseOver" | "onMouseOut" | "onClick" | "onDoubleClick" | "onContextMenu" | "onWheel" | "onKeyDown" | "onKeyUp" | "onChange" | "onInput" | "onBeforeInput" | "onScroll" | "onCopy" | "onCut" | "onPaste" | "onDrag" | "onDragStart" | "onDragEnd" | "onDragEnter" | "onDragLeave" | "onDragOver" | "onDrop" | "elevation" | keyof import("@gui/core").StackStyleBase | "fullscreen" | keyof import("@gui/core").WithPseudoProps<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
        unstyled?: boolean | undefined;
        elevation?: number | import("@gui/core").SizeTokens | undefined;
        fullscreen?: boolean | undefined;
    } & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>>> | "forceMount"> & Omit<import("@gui/core").RNGuiViewNonStyleProps, "unstyled" | "elevation" | keyof import("@gui/core").StackStyleBase | "fullscreen"> & import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
        unstyled?: boolean | undefined;
        elevation?: number | import("@gui/core").SizeTokens | undefined;
        fullscreen?: boolean | undefined;
    } & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>> & import("@gui/core").WithPseudoProps<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
        unstyled?: boolean | undefined;
        elevation?: number | import("@gui/core").SizeTokens | undefined;
        fullscreen?: boolean | undefined;
    } & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>>> & import("@gui/core").WithMediaProps<import("@gui/core").WithThemeShorthandsAndPseudos<import("@gui/core").StackStyleBase, {
        unstyled?: boolean | undefined;
        elevation?: number | import("@gui/core").SizeTokens | undefined;
        fullscreen?: boolean | undefined;
    }>> & {
        forceMount?: boolean;
        unstyled?: boolean;
    }, import("@gui/core").GuiElement, import("@gui/core").RNGuiViewNonStyleProps & Omit<import("@gui/core").RNGuiViewNonStyleProps, "unstyled" | "elevation" | keyof import("@gui/core").StackStyleBase | "fullscreen"> & import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
        unstyled?: boolean | undefined;
        elevation?: number | import("@gui/core").SizeTokens | undefined;
        fullscreen?: boolean | undefined;
    } & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>> & import("@gui/core").WithPseudoProps<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
        unstyled?: boolean | undefined;
        elevation?: number | import("@gui/core").SizeTokens | undefined;
        fullscreen?: boolean | undefined;
    } & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>>> & import("@gui/core").WithMediaProps<import("@gui/core").WithThemeShorthandsAndPseudos<import("@gui/core").StackStyleBase, {
        unstyled?: boolean | undefined;
        elevation?: number | import("@gui/core").SizeTokens | undefined;
        fullscreen?: boolean | undefined;
    }>> & {
        forceMount?: boolean;
        unstyled?: boolean;
    }, import("@gui/core").StackStyleBase, {
        unstyled?: boolean | undefined;
        elevation?: number | import("@gui/core").SizeTokens | undefined;
        fullscreen?: boolean | undefined;
    }, import("@gui/core").StaticConfigPublic>;
};
export {};
//# sourceMappingURL=createRadioGroup.d.ts.map