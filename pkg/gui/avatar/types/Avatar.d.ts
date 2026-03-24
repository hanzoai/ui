import type { GetProps, SizeTokens, GuiElement } from '@gui/core';
import type { Scope } from '@gui/create-context';
import type { ImageProps } from '@gui/image';
import * as React from 'react';
declare const createAvatarScope: import("@gui/create-context").CreateScope;
type ImageLoadingStatus = 'idle' | 'loading' | 'loaded' | 'error';
type AvatarImageProps = Partial<ImageProps> & {
    onLoadingStatusChange?: (status: ImageLoadingStatus) => void;
};
declare const AvatarImage: React.ForwardRefExoticComponent<Partial<ImageProps> & {
    onLoadingStatusChange?: (status: ImageLoadingStatus) => void;
} & React.RefAttributes<GuiElement>>;
export declare const AvatarFallbackFrame: import("@gui/core").GuiComponent<import("@gui/core").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
    elevation?: number | SizeTokens | undefined;
    fullscreen?: boolean | undefined;
}, import("@gui/core").StaticConfigPublic>;
type AvatarFallbackExtraProps = {
    delayMs?: number;
};
type AvatarFallbackProps = GetProps<typeof AvatarFallbackFrame> & AvatarFallbackExtraProps;
declare const AvatarFallback: import("@gui/core").GuiComponent<Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
    elevation?: number | SizeTokens | undefined;
    fullscreen?: boolean | undefined;
}>, "delayMs" | "__scopeAvatar"> & AvatarFallbackExtraProps & {
    __scopeAvatar?: Scope;
}, GuiElement, import("@gui/core").RNGuiViewNonStyleProps & AvatarFallbackExtraProps & {
    __scopeAvatar?: Scope;
}, import("@gui/core").StackStyleBase, {
    elevation?: number | SizeTokens | undefined;
    fullscreen?: boolean | undefined;
}, import("@gui/core").StaticConfigPublic>;
export declare const AvatarFrame: import("@gui/core").GuiComponent<import("@gui/core").TamaDefer, GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
    elevation?: number | import("@gui/web").SizeTokens | undefined;
    size?: number | import("@gui/web").SizeTokens | undefined;
    transparent?: boolean | undefined;
    fullscreen?: boolean | undefined;
    circular?: boolean | undefined;
    elevate?: boolean | undefined;
    bordered?: boolean | undefined;
    chromeless?: boolean | "all" | undefined;
}, import("@gui/core").StaticConfigPublic & {
    memo: true;
}>;
type AvatarProps = GetProps<typeof AvatarFrame>;
/**
 * @summary A component that displays an image or a fallback icon.
 * @see — Docs https://gui.dev/ui/avatar
 *
 * @example
 * ```tsx
 * <Avatar circular size="$10">
 *  <Avatar.Image
 *    aria-label="Cam"
 *    src="https://images.unsplash.com/photo-1548142813-c348350df52b?&w=150&h=150&dpr=2&q=80"
 *  />
 *  <Avatar.Fallback backgroundColor="$blue10" />
 * </Avatar>
 * ```
 */
declare const Avatar: React.ForwardRefExoticComponent<Omit<import("@gui/core").RNGuiViewNonStyleProps, "size" | "elevation" | keyof import("@gui/core").StackStyleBase | "fullscreen" | "transparent" | "circular" | "elevate" | "bordered" | "chromeless"> & import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
    elevation?: number | import("@gui/web").SizeTokens | undefined;
    size?: number | import("@gui/web").SizeTokens | undefined;
    transparent?: boolean | undefined;
    fullscreen?: boolean | undefined;
    circular?: boolean | undefined;
    elevate?: boolean | undefined;
    bordered?: boolean | undefined;
    chromeless?: boolean | "all" | undefined;
} & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>> & import("@gui/core").WithPseudoProps<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
    elevation?: number | import("@gui/web").SizeTokens | undefined;
    size?: number | import("@gui/web").SizeTokens | undefined;
    transparent?: boolean | undefined;
    fullscreen?: boolean | undefined;
    circular?: boolean | undefined;
    elevate?: boolean | undefined;
    bordered?: boolean | undefined;
    chromeless?: boolean | "all" | undefined;
} & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>>> & import("@gui/core").WithMediaProps<import("@gui/core").WithThemeShorthandsAndPseudos<import("@gui/core").StackStyleBase, {
    elevation?: number | import("@gui/web").SizeTokens | undefined;
    size?: number | import("@gui/web").SizeTokens | undefined;
    transparent?: boolean | undefined;
    fullscreen?: boolean | undefined;
    circular?: boolean | undefined;
    elevate?: boolean | undefined;
    bordered?: boolean | undefined;
    chromeless?: boolean | "all" | undefined;
}>> & React.RefAttributes<GuiElement>> & {
    Image: React.ForwardRefExoticComponent<Partial<ImageProps> & {
        onLoadingStatusChange?: (status: ImageLoadingStatus) => void;
    } & React.RefAttributes<GuiElement>>;
    Fallback: import("@gui/core").GuiComponent<Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
        elevation?: number | SizeTokens | undefined;
        fullscreen?: boolean | undefined;
    }>, "delayMs" | "__scopeAvatar"> & AvatarFallbackExtraProps & {
        __scopeAvatar?: Scope;
    }, GuiElement, import("@gui/core").RNGuiViewNonStyleProps & AvatarFallbackExtraProps & {
        __scopeAvatar?: Scope;
    }, import("@gui/core").StackStyleBase, {
        elevation?: number | SizeTokens | undefined;
        fullscreen?: boolean | undefined;
    }, import("@gui/core").StaticConfigPublic>;
};
export { createAvatarScope, Avatar, AvatarImage, AvatarFallback };
export type { AvatarProps, AvatarImageProps, AvatarFallbackProps };
//# sourceMappingURL=Avatar.d.ts.map