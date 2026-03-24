import type { GuiElement } from '@gui/core';
import type { DialogCloseProps, DialogContentProps, DialogDescriptionProps, DialogOverlayExtraProps, DialogOverlayProps, DialogPortalProps, DialogProps, DialogTitleProps, DialogTriggerProps } from '@gui/dialog';
import * as React from 'react';
export type AlertDialogScopes = string;
type ScopedProps<P> = Omit<P, 'scope'> & {
    scope?: AlertDialogScopes;
};
type AlertDialogProps = ScopedProps<DialogProps> & {
    native?: boolean;
};
type AlertDialogTriggerProps = ScopedProps<DialogTriggerProps>;
declare const AlertDialogTrigger: import("@gui/core").GuiComponent<Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {}>, "scope" | `$${string}` | `$${number}` | import("@gui/core").GroupMediaKeys | `$theme-${string}` | `$theme-${number}` | keyof import("@gui/core").StackStyleBase | keyof import("@gui/core").StackNonStyleProps | keyof import("@gui/core").WithPseudoProps<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>>>> & Omit<DialogTriggerProps, "scope"> & {
    scope?: AlertDialogScopes;
}, GuiElement, import("@gui/core").RNGuiViewNonStyleProps & Omit<DialogTriggerProps, "scope"> & {
    scope?: AlertDialogScopes;
}, import("@gui/core").StackStyleBase, {}, import("@gui/core").StaticConfigPublic>;
type AlertDialogPortalProps = ScopedProps<DialogPortalProps>;
declare const AlertDialogPortal: React.FC<AlertDialogPortalProps>;
type AlertDialogOverlayExtraProps = ScopedProps<{}> & DialogOverlayExtraProps;
type AlertDialogOverlayProps = AlertDialogOverlayExtraProps & DialogOverlayProps;
declare const AlertDialogOverlay: import("@gui/core").GuiComponent<Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
    open?: boolean | undefined;
    unstyled?: boolean | undefined;
    elevation?: number | import("@gui/core").SizeTokens | undefined;
    fullscreen?: boolean | undefined;
}>, "scope" | `$${string}` | `$${number}` | import("@gui/core").GroupMediaKeys | `$theme-${string}` | `$theme-${number}` | keyof import("@gui/core").StackStyleBase | keyof import("@gui/core").RNGuiViewNonStyleProps | keyof import("@gui/stacks").StackVariants | keyof import("@gui/core").WithPseudoProps<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
    elevation?: number | import("@gui/core").SizeTokens | undefined;
    fullscreen?: boolean | undefined;
} & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>>> | "forceMount"> & Omit<{}, "scope"> & {
    scope?: AlertDialogScopes;
} & {
    forceMount?: boolean;
} & {
    scope?: import("@gui/dialog").DialogScopes;
} & Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
    elevation?: number | import("@gui/core").SizeTokens | undefined;
    fullscreen?: boolean | undefined;
}>, keyof import("@gui/stacks").StackVariants> & import("@gui/stacks").StackVariants, GuiElement, import("@gui/core").RNGuiViewNonStyleProps & Omit<{}, "scope"> & {
    scope?: AlertDialogScopes;
} & {
    forceMount?: boolean;
} & {
    scope?: import("@gui/dialog").DialogScopes;
} & Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
    elevation?: number | import("@gui/core").SizeTokens | undefined;
    fullscreen?: boolean | undefined;
}>, keyof import("@gui/stacks").StackVariants> & import("@gui/stacks").StackVariants, import("@gui/core").StackStyleBase, {
    open?: boolean | undefined;
    unstyled?: boolean | undefined;
    elevation?: number | import("@gui/core").SizeTokens | undefined;
    fullscreen?: boolean | undefined;
}, import("@gui/core").StaticConfigPublic>;
type AlertDialogContentProps = ScopedProps<Omit<DialogContentProps, 'onPointerDownOutside' | 'onInteractOutside'>>;
declare const AlertDialogContent: React.ForwardRefExoticComponent<Omit<Omit<DialogContentProps, "onPointerDownOutside" | "onInteractOutside">, "scope"> & {
    scope?: AlertDialogScopes;
} & React.RefAttributes<GuiElement>>;
type AlertDialogTitleProps = ScopedProps<DialogTitleProps>;
declare const AlertDialogTitle: import("@gui/core").GuiComponent<Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {}>, "theme" | "debug" | "scope" | "children" | `$${string}` | `$${number}` | import("@gui/core").GroupMediaKeys | `$theme-${string}` | `$theme-${number}` | "hitSlop" | "target" | "htmlFor" | "asChild" | "dangerouslySetInnerHTML" | "disabled" | "className" | "themeShallow" | "unstyled" | "id" | "render" | "group" | "untilMeasured" | "componentName" | "tabIndex" | "role" | "disableOptimization" | "forceStyle" | "disableClassName" | "animatedBy" | "style" | "onFocus" | "onBlur" | "onPointerCancel" | "onPointerDown" | "onPointerMove" | "onPointerUp" | "testID" | "nativeID" | "accessible" | "accessibilityActions" | "accessibilityLabel" | "aria-label" | "accessibilityRole" | "accessibilityState" | "aria-busy" | "aria-checked" | "aria-disabled" | "aria-expanded" | "aria-selected" | "accessibilityHint" | "accessibilityValue" | "aria-valuemax" | "aria-valuemin" | "aria-valuenow" | "aria-valuetext" | "onAccessibilityAction" | "importantForAccessibility" | "aria-hidden" | "aria-modal" | "accessibilityLabelledBy" | "aria-labelledby" | "accessibilityLiveRegion" | "aria-live" | "screenReaderFocusable" | "accessibilityElementsHidden" | "accessibilityViewIsModal" | "onAccessibilityEscape" | "onAccessibilityTap" | "onMagicTap" | "accessibilityIgnoresInvertColors" | "accessibilityLanguage" | "accessibilityShowsLargeContentViewer" | "accessibilityLargeContentTitle" | "accessibilityRespondsToUserInteraction" | "onPress" | "onLongPress" | "onPressIn" | "onPressOut" | "onMouseEnter" | "onMouseLeave" | "onMouseDown" | "onMouseUp" | "onMouseMove" | "onMouseOver" | "onMouseOut" | "onClick" | "onDoubleClick" | "onContextMenu" | "onWheel" | "onKeyDown" | "onKeyUp" | "onChange" | "onInput" | "onBeforeInput" | "onScroll" | "onCopy" | "onCut" | "onPaste" | "onDrag" | "onDragStart" | "onDragEnd" | "onDragEnter" | "onDragLeave" | "onDragOver" | "onDrop" | "size" | "allowFontScaling" | "ellipsizeMode" | "lineBreakMode" | "numberOfLines" | "maxFontSizeMultiplier" | "minimumFontScale" | "pressRetentionOffset" | "adjustsFontSizeToFit" | "dynamicTypeRamp" | "suppressHighlighting" | "lineBreakStrategyIOS" | "selectable" | "selectionColor" | "textBreakStrategy" | "dataDetectorType" | "android_hyphenationFrequency" | keyof import("@gui/core").TextStylePropsBase | keyof import("@gui/core").WithPseudoProps<import("@gui/core").WithThemeValues<import("@gui/core").TextStylePropsBase> & {
    unstyled?: boolean | undefined;
    size?: import("@gui/core").FontSizeTokens | undefined;
} & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").TextStylePropsBase>>>> & Omit<DialogTitleProps, "scope"> & {
    scope?: AlertDialogScopes;
}, GuiElement, import("@gui/core").RNGuiViewNonStyleProps & Omit<DialogTitleProps, "scope"> & {
    scope?: AlertDialogScopes;
}, import("@gui/core").StackStyleBase, {}, import("@gui/core").StaticConfigPublic>;
type AlertDialogDescriptionProps = ScopedProps<DialogDescriptionProps>;
declare const AlertDialogDescription: import("@gui/core").GuiComponent<Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {}>, "theme" | "debug" | "scope" | "children" | `$${string}` | `$${number}` | import("@gui/core").GroupMediaKeys | `$theme-${string}` | `$theme-${number}` | "hitSlop" | "target" | "htmlFor" | "asChild" | "dangerouslySetInnerHTML" | "disabled" | "className" | "themeShallow" | "unstyled" | "id" | "render" | "group" | "untilMeasured" | "componentName" | "tabIndex" | "role" | "disableOptimization" | "forceStyle" | "disableClassName" | "animatedBy" | "style" | "onFocus" | "onBlur" | "onPointerCancel" | "onPointerDown" | "onPointerMove" | "onPointerUp" | "testID" | "nativeID" | "accessible" | "accessibilityActions" | "accessibilityLabel" | "aria-label" | "accessibilityRole" | "accessibilityState" | "aria-busy" | "aria-checked" | "aria-disabled" | "aria-expanded" | "aria-selected" | "accessibilityHint" | "accessibilityValue" | "aria-valuemax" | "aria-valuemin" | "aria-valuenow" | "aria-valuetext" | "onAccessibilityAction" | "importantForAccessibility" | "aria-hidden" | "aria-modal" | "accessibilityLabelledBy" | "aria-labelledby" | "accessibilityLiveRegion" | "aria-live" | "screenReaderFocusable" | "accessibilityElementsHidden" | "accessibilityViewIsModal" | "onAccessibilityEscape" | "onAccessibilityTap" | "onMagicTap" | "accessibilityIgnoresInvertColors" | "accessibilityLanguage" | "accessibilityShowsLargeContentViewer" | "accessibilityLargeContentTitle" | "accessibilityRespondsToUserInteraction" | "onPress" | "onLongPress" | "onPressIn" | "onPressOut" | "onMouseEnter" | "onMouseLeave" | "onMouseDown" | "onMouseUp" | "onMouseMove" | "onMouseOver" | "onMouseOut" | "onClick" | "onDoubleClick" | "onContextMenu" | "onWheel" | "onKeyDown" | "onKeyUp" | "onChange" | "onInput" | "onBeforeInput" | "onScroll" | "onCopy" | "onCut" | "onPaste" | "onDrag" | "onDragStart" | "onDragEnd" | "onDragEnter" | "onDragLeave" | "onDragOver" | "onDrop" | "size" | "allowFontScaling" | "ellipsizeMode" | "lineBreakMode" | "numberOfLines" | "maxFontSizeMultiplier" | "minimumFontScale" | "pressRetentionOffset" | "adjustsFontSizeToFit" | "dynamicTypeRamp" | "suppressHighlighting" | "lineBreakStrategyIOS" | "selectable" | "selectionColor" | "textBreakStrategy" | "dataDetectorType" | "android_hyphenationFrequency" | keyof import("@gui/core").TextStylePropsBase | keyof import("@gui/core").WithPseudoProps<import("@gui/core").WithThemeValues<import("@gui/core").TextStylePropsBase> & {
    unstyled?: boolean | undefined;
    size?: import("@gui/core").FontSizeTokens | undefined;
} & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").TextStylePropsBase>>>> & Omit<DialogDescriptionProps, "scope"> & {
    scope?: AlertDialogScopes;
}, GuiElement, import("@gui/core").RNGuiViewNonStyleProps & Omit<DialogDescriptionProps, "scope"> & {
    scope?: AlertDialogScopes;
}, import("@gui/core").StackStyleBase, {}, import("@gui/core").StaticConfigPublic>;
type AlertDialogActionProps = ScopedProps<DialogCloseProps>;
declare const AlertDialogAction: import("@gui/core").GuiComponent<Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {}>, "scope" | `$${string}` | `$${number}` | import("@gui/core").GroupMediaKeys | `$theme-${string}` | `$theme-${number}` | keyof import("@gui/core").StackStyleBase | keyof import("@gui/core").WithPseudoProps<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>>> | keyof import("@gui/core").RNGuiViewNonStyleProps | "displayWhenAdapted"> & Omit<DialogCloseProps, "scope"> & {
    scope?: AlertDialogScopes;
}, GuiElement, import("@gui/core").RNGuiViewNonStyleProps & Omit<DialogCloseProps, "scope"> & {
    scope?: AlertDialogScopes;
}, import("@gui/core").StackStyleBase, {}, import("@gui/core").StaticConfigPublic>;
type AlertDialogCancelProps = ScopedProps<DialogCloseProps>;
declare const AlertDialogCancel: import("@gui/core").GuiComponent<Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {}>, "scope" | `$${string}` | `$${number}` | import("@gui/core").GroupMediaKeys | `$theme-${string}` | `$theme-${number}` | keyof import("@gui/core").StackStyleBase | keyof import("@gui/core").WithPseudoProps<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>>> | keyof import("@gui/core").RNGuiViewNonStyleProps | "displayWhenAdapted"> & Omit<DialogCloseProps, "scope"> & {
    scope?: AlertDialogScopes;
}, GuiElement, import("@gui/core").RNGuiViewNonStyleProps & Omit<DialogCloseProps, "scope"> & {
    scope?: AlertDialogScopes;
}, import("@gui/core").StackStyleBase, {}, import("@gui/core").StaticConfigPublic>;
type AlertDialogDestructiveProps = ScopedProps<DialogCloseProps>;
declare const AlertDialogDestructive: import("@gui/core").GuiComponent<Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {}>, "scope" | `$${string}` | `$${number}` | import("@gui/core").GroupMediaKeys | `$theme-${string}` | `$theme-${number}` | keyof import("@gui/core").StackStyleBase | keyof import("@gui/core").WithPseudoProps<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>>> | keyof import("@gui/core").RNGuiViewNonStyleProps | "displayWhenAdapted"> & Omit<DialogCloseProps, "scope"> & {
    scope?: AlertDialogScopes;
}, GuiElement, import("@gui/core").RNGuiViewNonStyleProps & Omit<DialogCloseProps, "scope"> & {
    scope?: AlertDialogScopes;
}, import("@gui/core").StackStyleBase, {}, import("@gui/core").StaticConfigPublic>;
declare const AlertDialog: React.FC<AlertDialogProps> & {
    Trigger: import("@gui/core").GuiComponent<Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {}>, "scope" | `$${string}` | `$${number}` | import("@gui/core").GroupMediaKeys | `$theme-${string}` | `$theme-${number}` | keyof import("@gui/core").StackStyleBase | keyof import("@gui/core").StackNonStyleProps | keyof import("@gui/core").WithPseudoProps<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>>>> & Omit<DialogTriggerProps, "scope"> & {
        scope?: AlertDialogScopes;
    }, GuiElement, import("@gui/core").RNGuiViewNonStyleProps & Omit<DialogTriggerProps, "scope"> & {
        scope?: AlertDialogScopes;
    }, import("@gui/core").StackStyleBase, {}, import("@gui/core").StaticConfigPublic>;
    Portal: React.FC<AlertDialogPortalProps>;
    Overlay: import("@gui/core").GuiComponent<Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
        open?: boolean | undefined;
        unstyled?: boolean | undefined;
        elevation?: number | import("@gui/core").SizeTokens | undefined;
        fullscreen?: boolean | undefined;
    }>, "scope" | `$${string}` | `$${number}` | import("@gui/core").GroupMediaKeys | `$theme-${string}` | `$theme-${number}` | keyof import("@gui/core").StackStyleBase | keyof import("@gui/core").RNGuiViewNonStyleProps | keyof import("@gui/stacks").StackVariants | keyof import("@gui/core").WithPseudoProps<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
        elevation?: number | import("@gui/core").SizeTokens | undefined;
        fullscreen?: boolean | undefined;
    } & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>>> | "forceMount"> & Omit<{}, "scope"> & {
        scope?: AlertDialogScopes;
    } & {
        forceMount?: boolean;
    } & {
        scope?: import("@gui/dialog").DialogScopes;
    } & Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
        elevation?: number | import("@gui/core").SizeTokens | undefined;
        fullscreen?: boolean | undefined;
    }>, keyof import("@gui/stacks").StackVariants> & import("@gui/stacks").StackVariants, GuiElement, import("@gui/core").RNGuiViewNonStyleProps & Omit<{}, "scope"> & {
        scope?: AlertDialogScopes;
    } & {
        forceMount?: boolean;
    } & {
        scope?: import("@gui/dialog").DialogScopes;
    } & Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
        elevation?: number | import("@gui/core").SizeTokens | undefined;
        fullscreen?: boolean | undefined;
    }>, keyof import("@gui/stacks").StackVariants> & import("@gui/stacks").StackVariants, import("@gui/core").StackStyleBase, {
        open?: boolean | undefined;
        unstyled?: boolean | undefined;
        elevation?: number | import("@gui/core").SizeTokens | undefined;
        fullscreen?: boolean | undefined;
    }, import("@gui/core").StaticConfigPublic>;
    Content: React.ForwardRefExoticComponent<Omit<Omit<DialogContentProps, "onPointerDownOutside" | "onInteractOutside">, "scope"> & {
        scope?: AlertDialogScopes;
    } & React.RefAttributes<GuiElement>>;
    Action: import("@gui/core").GuiComponent<Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {}>, "scope" | `$${string}` | `$${number}` | import("@gui/core").GroupMediaKeys | `$theme-${string}` | `$theme-${number}` | keyof import("@gui/core").StackStyleBase | keyof import("@gui/core").WithPseudoProps<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>>> | keyof import("@gui/core").RNGuiViewNonStyleProps | "displayWhenAdapted"> & Omit<DialogCloseProps, "scope"> & {
        scope?: AlertDialogScopes;
    }, GuiElement, import("@gui/core").RNGuiViewNonStyleProps & Omit<DialogCloseProps, "scope"> & {
        scope?: AlertDialogScopes;
    }, import("@gui/core").StackStyleBase, {}, import("@gui/core").StaticConfigPublic>;
    Cancel: import("@gui/core").GuiComponent<Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {}>, "scope" | `$${string}` | `$${number}` | import("@gui/core").GroupMediaKeys | `$theme-${string}` | `$theme-${number}` | keyof import("@gui/core").StackStyleBase | keyof import("@gui/core").WithPseudoProps<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>>> | keyof import("@gui/core").RNGuiViewNonStyleProps | "displayWhenAdapted"> & Omit<DialogCloseProps, "scope"> & {
        scope?: AlertDialogScopes;
    }, GuiElement, import("@gui/core").RNGuiViewNonStyleProps & Omit<DialogCloseProps, "scope"> & {
        scope?: AlertDialogScopes;
    }, import("@gui/core").StackStyleBase, {}, import("@gui/core").StaticConfigPublic>;
    Destructive: import("@gui/core").GuiComponent<Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {}>, "scope" | `$${string}` | `$${number}` | import("@gui/core").GroupMediaKeys | `$theme-${string}` | `$theme-${number}` | keyof import("@gui/core").StackStyleBase | keyof import("@gui/core").WithPseudoProps<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>>> | keyof import("@gui/core").RNGuiViewNonStyleProps | "displayWhenAdapted"> & Omit<DialogCloseProps, "scope"> & {
        scope?: AlertDialogScopes;
    }, GuiElement, import("@gui/core").RNGuiViewNonStyleProps & Omit<DialogCloseProps, "scope"> & {
        scope?: AlertDialogScopes;
    }, import("@gui/core").StackStyleBase, {}, import("@gui/core").StaticConfigPublic>;
    Title: import("@gui/core").GuiComponent<Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {}>, "theme" | "debug" | "scope" | "children" | `$${string}` | `$${number}` | import("@gui/core").GroupMediaKeys | `$theme-${string}` | `$theme-${number}` | "hitSlop" | "target" | "htmlFor" | "asChild" | "dangerouslySetInnerHTML" | "disabled" | "className" | "themeShallow" | "unstyled" | "id" | "render" | "group" | "untilMeasured" | "componentName" | "tabIndex" | "role" | "disableOptimization" | "forceStyle" | "disableClassName" | "animatedBy" | "style" | "onFocus" | "onBlur" | "onPointerCancel" | "onPointerDown" | "onPointerMove" | "onPointerUp" | "testID" | "nativeID" | "accessible" | "accessibilityActions" | "accessibilityLabel" | "aria-label" | "accessibilityRole" | "accessibilityState" | "aria-busy" | "aria-checked" | "aria-disabled" | "aria-expanded" | "aria-selected" | "accessibilityHint" | "accessibilityValue" | "aria-valuemax" | "aria-valuemin" | "aria-valuenow" | "aria-valuetext" | "onAccessibilityAction" | "importantForAccessibility" | "aria-hidden" | "aria-modal" | "accessibilityLabelledBy" | "aria-labelledby" | "accessibilityLiveRegion" | "aria-live" | "screenReaderFocusable" | "accessibilityElementsHidden" | "accessibilityViewIsModal" | "onAccessibilityEscape" | "onAccessibilityTap" | "onMagicTap" | "accessibilityIgnoresInvertColors" | "accessibilityLanguage" | "accessibilityShowsLargeContentViewer" | "accessibilityLargeContentTitle" | "accessibilityRespondsToUserInteraction" | "onPress" | "onLongPress" | "onPressIn" | "onPressOut" | "onMouseEnter" | "onMouseLeave" | "onMouseDown" | "onMouseUp" | "onMouseMove" | "onMouseOver" | "onMouseOut" | "onClick" | "onDoubleClick" | "onContextMenu" | "onWheel" | "onKeyDown" | "onKeyUp" | "onChange" | "onInput" | "onBeforeInput" | "onScroll" | "onCopy" | "onCut" | "onPaste" | "onDrag" | "onDragStart" | "onDragEnd" | "onDragEnter" | "onDragLeave" | "onDragOver" | "onDrop" | "size" | "allowFontScaling" | "ellipsizeMode" | "lineBreakMode" | "numberOfLines" | "maxFontSizeMultiplier" | "minimumFontScale" | "pressRetentionOffset" | "adjustsFontSizeToFit" | "dynamicTypeRamp" | "suppressHighlighting" | "lineBreakStrategyIOS" | "selectable" | "selectionColor" | "textBreakStrategy" | "dataDetectorType" | "android_hyphenationFrequency" | keyof import("@gui/core").TextStylePropsBase | keyof import("@gui/core").WithPseudoProps<import("@gui/core").WithThemeValues<import("@gui/core").TextStylePropsBase> & {
        unstyled?: boolean | undefined;
        size?: import("@gui/core").FontSizeTokens | undefined;
    } & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").TextStylePropsBase>>>> & Omit<DialogTitleProps, "scope"> & {
        scope?: AlertDialogScopes;
    }, GuiElement, import("@gui/core").RNGuiViewNonStyleProps & Omit<DialogTitleProps, "scope"> & {
        scope?: AlertDialogScopes;
    }, import("@gui/core").StackStyleBase, {}, import("@gui/core").StaticConfigPublic>;
    Description: import("@gui/core").GuiComponent<Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {}>, "theme" | "debug" | "scope" | "children" | `$${string}` | `$${number}` | import("@gui/core").GroupMediaKeys | `$theme-${string}` | `$theme-${number}` | "hitSlop" | "target" | "htmlFor" | "asChild" | "dangerouslySetInnerHTML" | "disabled" | "className" | "themeShallow" | "unstyled" | "id" | "render" | "group" | "untilMeasured" | "componentName" | "tabIndex" | "role" | "disableOptimization" | "forceStyle" | "disableClassName" | "animatedBy" | "style" | "onFocus" | "onBlur" | "onPointerCancel" | "onPointerDown" | "onPointerMove" | "onPointerUp" | "testID" | "nativeID" | "accessible" | "accessibilityActions" | "accessibilityLabel" | "aria-label" | "accessibilityRole" | "accessibilityState" | "aria-busy" | "aria-checked" | "aria-disabled" | "aria-expanded" | "aria-selected" | "accessibilityHint" | "accessibilityValue" | "aria-valuemax" | "aria-valuemin" | "aria-valuenow" | "aria-valuetext" | "onAccessibilityAction" | "importantForAccessibility" | "aria-hidden" | "aria-modal" | "accessibilityLabelledBy" | "aria-labelledby" | "accessibilityLiveRegion" | "aria-live" | "screenReaderFocusable" | "accessibilityElementsHidden" | "accessibilityViewIsModal" | "onAccessibilityEscape" | "onAccessibilityTap" | "onMagicTap" | "accessibilityIgnoresInvertColors" | "accessibilityLanguage" | "accessibilityShowsLargeContentViewer" | "accessibilityLargeContentTitle" | "accessibilityRespondsToUserInteraction" | "onPress" | "onLongPress" | "onPressIn" | "onPressOut" | "onMouseEnter" | "onMouseLeave" | "onMouseDown" | "onMouseUp" | "onMouseMove" | "onMouseOver" | "onMouseOut" | "onClick" | "onDoubleClick" | "onContextMenu" | "onWheel" | "onKeyDown" | "onKeyUp" | "onChange" | "onInput" | "onBeforeInput" | "onScroll" | "onCopy" | "onCut" | "onPaste" | "onDrag" | "onDragStart" | "onDragEnd" | "onDragEnter" | "onDragLeave" | "onDragOver" | "onDrop" | "size" | "allowFontScaling" | "ellipsizeMode" | "lineBreakMode" | "numberOfLines" | "maxFontSizeMultiplier" | "minimumFontScale" | "pressRetentionOffset" | "adjustsFontSizeToFit" | "dynamicTypeRamp" | "suppressHighlighting" | "lineBreakStrategyIOS" | "selectable" | "selectionColor" | "textBreakStrategy" | "dataDetectorType" | "android_hyphenationFrequency" | keyof import("@gui/core").TextStylePropsBase | keyof import("@gui/core").WithPseudoProps<import("@gui/core").WithThemeValues<import("@gui/core").TextStylePropsBase> & {
        unstyled?: boolean | undefined;
        size?: import("@gui/core").FontSizeTokens | undefined;
    } & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").TextStylePropsBase>>>> & Omit<DialogDescriptionProps, "scope"> & {
        scope?: AlertDialogScopes;
    }, GuiElement, import("@gui/core").RNGuiViewNonStyleProps & Omit<DialogDescriptionProps, "scope"> & {
        scope?: AlertDialogScopes;
    }, import("@gui/core").StackStyleBase, {}, import("@gui/core").StaticConfigPublic>;
};
export { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogDestructive, AlertDialogContent, AlertDialogDescription, AlertDialogOverlay, AlertDialogPortal, AlertDialogTitle, AlertDialogTrigger, };
export type { AlertDialogActionProps, AlertDialogCancelProps, AlertDialogDestructiveProps, AlertDialogContentProps, AlertDialogDescriptionProps, AlertDialogOverlayProps, AlertDialogPortalProps, AlertDialogProps, AlertDialogTitleProps, AlertDialogTriggerProps, };
//# sourceMappingURL=AlertDialog.d.ts.map