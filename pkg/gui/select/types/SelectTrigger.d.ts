import type { GuiElement } from '@gui/core';
import type { ListItemProps } from '@gui/list-item';
import * as React from 'react';
import type { SelectScopedProps } from './types';
export type SelectTriggerProps = SelectScopedProps<ListItemProps>;
export declare const SelectTrigger: React.ForwardRefExoticComponent<Omit<import("@gui/core").StackNonStyleProps, "disabled" | "size" | "unstyled" | keyof import("@gui/core").StackStyleBase | "variant" | "active"> & import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
    size?: import("@gui/core").SizeTokens | undefined;
    variant?: "outlined" | undefined;
    disabled?: boolean | undefined;
    unstyled?: boolean | undefined;
    active?: boolean | undefined;
} & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>> & import("@gui/core").WithPseudoProps<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase> & {
    size?: import("@gui/core").SizeTokens | undefined;
    variant?: "outlined" | undefined;
    disabled?: boolean | undefined;
    unstyled?: boolean | undefined;
    active?: boolean | undefined;
} & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").StackStyleBase>>> & import("@gui/core").WithMediaProps<import("@gui/core").WithThemeShorthandsAndPseudos<import("@gui/core").StackStyleBase, {
    size?: import("@gui/core").SizeTokens | undefined;
    variant?: "outlined" | undefined;
    disabled?: boolean | undefined;
    unstyled?: boolean | undefined;
    active?: boolean | undefined;
}>> & import("@gui/list-item").ListItemExtraProps & {
    scope?: import("./types").SelectScopes;
} & React.RefAttributes<GuiElement>>;
//# sourceMappingURL=SelectTrigger.d.ts.map