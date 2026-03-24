import type { ColorTokens, GetProps, ThemeTokens } from '@gui/core';
import type { LinearGradientPoint } from './linear-gradient';
export type LinearGradientExtraProps = {
    colors?: (ColorTokens | ThemeTokens | (string & {}))[];
    locations?: number[] | null;
    start?: LinearGradientPoint | null;
    end?: LinearGradientPoint | null;
};
export declare const LinearGradient: import("@gui/core").GuiComponent<Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
    elevation?: number | import("@gui/core").SizeTokens | undefined;
    fullscreen?: boolean | undefined;
}>, keyof LinearGradientExtraProps> & LinearGradientExtraProps, import("@gui/core").GuiElement, import("@gui/core").RNGuiViewNonStyleProps & LinearGradientExtraProps, import("@gui/core").StackStyleBase, {
    elevation?: number | import("@gui/core").SizeTokens | undefined;
    fullscreen?: boolean | undefined;
}, import("@gui/core").StaticConfigPublic>;
export type LinearGradientProps = GetProps<typeof LinearGradient>;
//# sourceMappingURL=LinearGradient.d.ts.map