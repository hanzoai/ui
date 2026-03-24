import type { GetProps, GuiTextElement } from '@gui/core';
import type { SelectScopedProps } from './types';
export declare const ITEM_TEXT_NAME = "SelectItemText";
export declare const SelectItemTextFrame: import("@gui/core").GuiComponent<import("@gui/core").TamaDefer, GuiTextElement, import("@gui/core").TextNonStyleProps, import("@gui/core").TextStylePropsBase, {
    size?: import("@gui/core").FontSizeTokens | undefined;
    unstyled?: boolean | undefined;
}, import("@gui/core").StaticConfigPublic>;
type SelectItemTextExtraProps = SelectScopedProps<{}>;
export type SelectItemTextProps = GetProps<typeof SelectItemTextFrame> & SelectItemTextExtraProps;
export declare const SelectItemText: import("@gui/core").GuiComponent<Omit<import("@gui/core").GetFinalProps<import("@gui/core").TextNonStyleProps, import("@gui/core").TextStylePropsBase, {
    size?: import("@gui/core").FontSizeTokens | undefined;
    unstyled?: boolean | undefined;
}>, "scope"> & {
    scope?: import("./types").SelectScopes;
}, GuiTextElement, import("@gui/core").TextNonStyleProps & {
    scope?: import("./types").SelectScopes;
}, import("@gui/core").TextStylePropsBase, {
    size?: import("@gui/core").FontSizeTokens | undefined;
    unstyled?: boolean | undefined;
}, import("@gui/core").StaticConfigPublic>;
export {};
//# sourceMappingURL=SelectItemText.d.ts.map