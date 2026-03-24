import type { ListItemProps } from '@gui/list-item';
import * as React from 'react';
type SelectItemContextValue = {
    value: string;
    textId: string;
    isSelected: boolean;
};
export declare const SelectItemContextProvider: React.Provider<SelectItemContextValue> & React.ProviderExoticComponent<Partial<SelectItemContextValue> & {
    children?: React.ReactNode;
    scope?: string;
}>, useSelectItemContext: (scope?: string) => SelectItemContextValue;
export interface SelectItemExtraProps {
    value: string;
    index: number;
    disabled?: boolean;
    textValue?: string;
}
export interface SelectItemProps extends Omit<ListItemProps, keyof SelectItemExtraProps>, SelectItemExtraProps {
}
export declare const SelectItem: import("@gui/core").GuiComponent<Omit<import("@gui/core").GetFinalProps<import("@gui/core").StackNonStyleProps, import("@gui/core").StackStyleBase, {
    size?: import("@gui/core").SizeTokens | undefined;
    variant?: "outlined" | undefined;
    disabled?: boolean | undefined;
    unstyled?: boolean | undefined;
    active?: boolean | undefined;
}>, keyof SelectItemExtraProps> & SelectItemExtraProps, import("@gui/core").GuiElement, import("@gui/core").StackNonStyleProps & SelectItemExtraProps, import("@gui/core").StackStyleBase, {
    size?: import("@gui/core").SizeTokens | undefined;
    variant?: "outlined" | undefined;
    disabled?: boolean | undefined;
    unstyled?: boolean | undefined;
    active?: boolean | undefined;
}, import("@gui/core").StaticConfigPublic>;
export {};
//# sourceMappingURL=SelectItem.d.ts.map