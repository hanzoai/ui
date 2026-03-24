import type { GetProps, SizeTokens, GuiElement } from '@gui/core';
import type { SizableStackProps } from '@gui/stacks';
import * as React from 'react';
import type { View } from 'react-native';
import type { SliderProps, SliderTrackProps } from './types';
export declare const SliderTrackFrame: import("@gui/core").GuiComponent<import("@gui/core").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
    unstyled?: boolean | undefined;
    elevation?: number | SizeTokens | undefined;
    size?: any;
    fullscreen?: boolean | undefined;
    orientation?: "horizontal" | "vertical" | undefined;
}, import("@gui/core").StaticConfigPublic>;
declare const SliderTrack: React.ForwardRefExoticComponent<Omit<import("@gui/core").RNGuiViewNonStyleProps, "unstyled" | "elevation" | keyof import("@gui/core").StackStyleBase | "size" | "transparent" | "fullscreen" | "circular" | "elevate" | "bordered" | "chromeless"> & import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
    size?: import("@gui/core").SizeTokens | undefined;
    unstyled?: boolean | undefined;
    elevation?: number | import("@gui/core").SizeTokens | undefined;
    transparent?: boolean | undefined;
    fullscreen?: boolean | undefined;
    circular?: boolean | undefined;
    elevate?: boolean | undefined;
    bordered?: boolean | undefined;
    chromeless?: boolean | "all" | undefined;
} & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>> & import("@gui/core").WithPseudoProps<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
    size?: import("@gui/core").SizeTokens | undefined;
    unstyled?: boolean | undefined;
    elevation?: number | import("@gui/core").SizeTokens | undefined;
    transparent?: boolean | undefined;
    fullscreen?: boolean | undefined;
    circular?: boolean | undefined;
    elevate?: boolean | undefined;
    bordered?: boolean | undefined;
    chromeless?: boolean | "all" | undefined;
} & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>>> & import("@gui/core").WithMediaProps<import("@gui/core").WithThemeShorthandsAndPseudos<import("@gui/core").StackStyleBase, {
    size?: import("@gui/core").SizeTokens | undefined;
    unstyled?: boolean | undefined;
    elevation?: number | import("@gui/core").SizeTokens | undefined;
    transparent?: boolean | undefined;
    fullscreen?: boolean | undefined;
    circular?: boolean | undefined;
    elevate?: boolean | undefined;
    bordered?: boolean | undefined;
    chromeless?: boolean | "all" | undefined;
}>> & React.RefAttributes<GuiElement>>;
export declare const SliderActiveFrame: import("@gui/core").GuiComponent<import("@gui/core").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
    unstyled?: boolean | undefined;
    elevation?: number | SizeTokens | undefined;
    size?: any;
    fullscreen?: boolean | undefined;
    orientation?: "horizontal" | "vertical" | undefined;
}, import("@gui/core").StaticConfigPublic>;
type SliderActiveProps = GetProps<typeof SliderActiveFrame>;
declare const SliderActive: React.ForwardRefExoticComponent<Omit<import("@gui/core").RNGuiViewNonStyleProps, "unstyled" | "elevation" | keyof import("@gui/core").StackStyleBase | "size" | "fullscreen" | "orientation"> & import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
    unstyled?: boolean | undefined;
    elevation?: number | SizeTokens | undefined;
    size?: any;
    fullscreen?: boolean | undefined;
    orientation?: "horizontal" | "vertical" | undefined;
} & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>> & import("@gui/core").WithPseudoProps<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
    unstyled?: boolean | undefined;
    elevation?: number | SizeTokens | undefined;
    size?: any;
    fullscreen?: boolean | undefined;
    orientation?: "horizontal" | "vertical" | undefined;
} & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>>> & import("@gui/core").WithMediaProps<import("@gui/core").WithThemeShorthandsAndPseudos<import("@gui/core").StackStyleBase, {
    unstyled?: boolean | undefined;
    elevation?: number | SizeTokens | undefined;
    size?: any;
    fullscreen?: boolean | undefined;
    orientation?: "horizontal" | "vertical" | undefined;
}>> & React.RefAttributes<View>>;
export declare const SliderThumbFrame: import("@gui/core").GuiComponent<import("@gui/core").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
    unstyled?: boolean | undefined;
    elevation?: number | SizeTokens | undefined;
    size?: number | SizeTokens | undefined;
    transparent?: boolean | undefined;
    fullscreen?: boolean | undefined;
    circular?: boolean | undefined;
    elevate?: boolean | undefined;
    bordered?: boolean | undefined;
    chromeless?: boolean | "all" | undefined;
}, import("@gui/core").StaticConfigPublic>;
export interface SliderThumbExtraProps {
    index?: number;
}
export interface SliderThumbProps extends SizableStackProps, SliderThumbExtraProps {
}
declare const SliderThumb: import("@gui/core").GuiComponent<Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
    unstyled?: boolean | undefined;
    elevation?: number | SizeTokens | undefined;
    size?: number | SizeTokens | undefined;
    transparent?: boolean | undefined;
    fullscreen?: boolean | undefined;
    circular?: boolean | undefined;
    elevate?: boolean | undefined;
    bordered?: boolean | undefined;
    chromeless?: boolean | "all" | undefined;
}>, "index"> & SliderThumbExtraProps, GuiElement, import("@gui/core").RNGuiViewNonStyleProps & SliderThumbExtraProps, import("@gui/core").StackStyleBase, {
    unstyled?: boolean | undefined;
    elevation?: number | SizeTokens | undefined;
    size?: number | SizeTokens | undefined;
    transparent?: boolean | undefined;
    fullscreen?: boolean | undefined;
    circular?: boolean | undefined;
    elevate?: boolean | undefined;
    bordered?: boolean | undefined;
    chromeless?: boolean | "all" | undefined;
}, import("@gui/core").StaticConfigPublic>;
declare const Slider: React.ForwardRefExoticComponent<SliderProps & {
    __scopeSlider?: string;
} & React.RefAttributes<unknown>> & {
    Track: React.ForwardRefExoticComponent<Omit<import("@gui/core").RNGuiViewNonStyleProps, "unstyled" | "elevation" | keyof import("@gui/core").StackStyleBase | "size" | "transparent" | "fullscreen" | "circular" | "elevate" | "bordered" | "chromeless"> & import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
        size?: import("@gui/core").SizeTokens | undefined;
        unstyled?: boolean | undefined;
        elevation?: number | import("@gui/core").SizeTokens | undefined;
        transparent?: boolean | undefined;
        fullscreen?: boolean | undefined;
        circular?: boolean | undefined;
        elevate?: boolean | undefined;
        bordered?: boolean | undefined;
        chromeless?: boolean | "all" | undefined;
    } & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>> & import("@gui/core").WithPseudoProps<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
        size?: import("@gui/core").SizeTokens | undefined;
        unstyled?: boolean | undefined;
        elevation?: number | import("@gui/core").SizeTokens | undefined;
        transparent?: boolean | undefined;
        fullscreen?: boolean | undefined;
        circular?: boolean | undefined;
        elevate?: boolean | undefined;
        bordered?: boolean | undefined;
        chromeless?: boolean | "all" | undefined;
    } & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>>> & import("@gui/core").WithMediaProps<import("@gui/core").WithThemeShorthandsAndPseudos<import("@gui/core").StackStyleBase, {
        size?: import("@gui/core").SizeTokens | undefined;
        unstyled?: boolean | undefined;
        elevation?: number | import("@gui/core").SizeTokens | undefined;
        transparent?: boolean | undefined;
        fullscreen?: boolean | undefined;
        circular?: boolean | undefined;
        elevate?: boolean | undefined;
        bordered?: boolean | undefined;
        chromeless?: boolean | "all" | undefined;
    }>> & React.RefAttributes<GuiElement>>;
    TrackActive: React.ForwardRefExoticComponent<Omit<import("@gui/core").RNGuiViewNonStyleProps, "unstyled" | "elevation" | keyof import("@gui/core").StackStyleBase | "size" | "fullscreen" | "orientation"> & import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
        unstyled?: boolean | undefined;
        elevation?: number | SizeTokens | undefined;
        size?: any;
        fullscreen?: boolean | undefined;
        orientation?: "horizontal" | "vertical" | undefined;
    } & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>> & import("@gui/core").WithPseudoProps<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
        unstyled?: boolean | undefined;
        elevation?: number | SizeTokens | undefined;
        size?: any;
        fullscreen?: boolean | undefined;
        orientation?: "horizontal" | "vertical" | undefined;
    } & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>>> & import("@gui/core").WithMediaProps<import("@gui/core").WithThemeShorthandsAndPseudos<import("@gui/core").StackStyleBase, {
        unstyled?: boolean | undefined;
        elevation?: number | SizeTokens | undefined;
        size?: any;
        fullscreen?: boolean | undefined;
        orientation?: "horizontal" | "vertical" | undefined;
    }>> & React.RefAttributes<View>>;
    Thumb: import("@gui/core").GuiComponent<Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
        unstyled?: boolean | undefined;
        elevation?: number | SizeTokens | undefined;
        size?: number | SizeTokens | undefined;
        transparent?: boolean | undefined;
        fullscreen?: boolean | undefined;
        circular?: boolean | undefined;
        elevate?: boolean | undefined;
        bordered?: boolean | undefined;
        chromeless?: boolean | "all" | undefined;
    }>, "index"> & SliderThumbExtraProps, GuiElement, import("@gui/core").RNGuiViewNonStyleProps & SliderThumbExtraProps, import("@gui/core").StackStyleBase, {
        unstyled?: boolean | undefined;
        elevation?: number | SizeTokens | undefined;
        size?: number | SizeTokens | undefined;
        transparent?: boolean | undefined;
        fullscreen?: boolean | undefined;
        circular?: boolean | undefined;
        elevate?: boolean | undefined;
        bordered?: boolean | undefined;
        chromeless?: boolean | "all" | undefined;
    }, import("@gui/core").StaticConfigPublic>;
};
declare const Track: React.ForwardRefExoticComponent<Omit<import("@gui/core").RNGuiViewNonStyleProps, "unstyled" | "elevation" | keyof import("@gui/core").StackStyleBase | "size" | "transparent" | "fullscreen" | "circular" | "elevate" | "bordered" | "chromeless"> & import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
    size?: import("@gui/core").SizeTokens | undefined;
    unstyled?: boolean | undefined;
    elevation?: number | import("@gui/core").SizeTokens | undefined;
    transparent?: boolean | undefined;
    fullscreen?: boolean | undefined;
    circular?: boolean | undefined;
    elevate?: boolean | undefined;
    bordered?: boolean | undefined;
    chromeless?: boolean | "all" | undefined;
} & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>> & import("@gui/core").WithPseudoProps<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
    size?: import("@gui/core").SizeTokens | undefined;
    unstyled?: boolean | undefined;
    elevation?: number | import("@gui/core").SizeTokens | undefined;
    transparent?: boolean | undefined;
    fullscreen?: boolean | undefined;
    circular?: boolean | undefined;
    elevate?: boolean | undefined;
    bordered?: boolean | undefined;
    chromeless?: boolean | "all" | undefined;
} & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>>> & import("@gui/core").WithMediaProps<import("@gui/core").WithThemeShorthandsAndPseudos<import("@gui/core").StackStyleBase, {
    size?: import("@gui/core").SizeTokens | undefined;
    unstyled?: boolean | undefined;
    elevation?: number | import("@gui/core").SizeTokens | undefined;
    transparent?: boolean | undefined;
    fullscreen?: boolean | undefined;
    circular?: boolean | undefined;
    elevate?: boolean | undefined;
    bordered?: boolean | undefined;
    chromeless?: boolean | "all" | undefined;
}>> & React.RefAttributes<GuiElement>>;
declare const Range: React.ForwardRefExoticComponent<Omit<import("@gui/core").RNGuiViewNonStyleProps, "unstyled" | "elevation" | keyof import("@gui/core").StackStyleBase | "size" | "fullscreen" | "orientation"> & import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
    unstyled?: boolean | undefined;
    elevation?: number | SizeTokens | undefined;
    size?: any;
    fullscreen?: boolean | undefined;
    orientation?: "horizontal" | "vertical" | undefined;
} & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>> & import("@gui/core").WithPseudoProps<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
    unstyled?: boolean | undefined;
    elevation?: number | SizeTokens | undefined;
    size?: any;
    fullscreen?: boolean | undefined;
    orientation?: "horizontal" | "vertical" | undefined;
} & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>>> & import("@gui/core").WithMediaProps<import("@gui/core").WithThemeShorthandsAndPseudos<import("@gui/core").StackStyleBase, {
    unstyled?: boolean | undefined;
    elevation?: number | SizeTokens | undefined;
    size?: any;
    fullscreen?: boolean | undefined;
    orientation?: "horizontal" | "vertical" | undefined;
}>> & React.RefAttributes<View>>;
declare const Thumb: import("@gui/core").GuiComponent<Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
    unstyled?: boolean | undefined;
    elevation?: number | SizeTokens | undefined;
    size?: number | SizeTokens | undefined;
    transparent?: boolean | undefined;
    fullscreen?: boolean | undefined;
    circular?: boolean | undefined;
    elevate?: boolean | undefined;
    bordered?: boolean | undefined;
    chromeless?: boolean | "all" | undefined;
}>, "index"> & SliderThumbExtraProps, GuiElement, import("@gui/core").RNGuiViewNonStyleProps & SliderThumbExtraProps, import("@gui/core").StackStyleBase, {
    unstyled?: boolean | undefined;
    elevation?: number | SizeTokens | undefined;
    size?: number | SizeTokens | undefined;
    transparent?: boolean | undefined;
    fullscreen?: boolean | undefined;
    circular?: boolean | undefined;
    elevate?: boolean | undefined;
    bordered?: boolean | undefined;
    chromeless?: boolean | "all" | undefined;
}, import("@gui/core").StaticConfigPublic>;
export { Range, Slider, SliderThumb, SliderTrack, SliderActive, Thumb, Track, };
export type { SliderProps, SliderActiveProps, SliderTrackProps };
//# sourceMappingURL=Slider.d.ts.map