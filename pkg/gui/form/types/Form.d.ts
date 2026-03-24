import type { ViewProps } from '@gui/core';
export declare const FormFrame: import("@gui/core").GuiComponent<import("@gui/core").TamaDefer, import("@gui/core").GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {}, import("@gui/core").StaticConfigPublic>;
type FormContextValue = {
    onSubmit?: () => unknown;
};
export declare const FormContext: import("@gui/core").StyledContext<FormContextValue>;
export declare const useFormContext: (scope?: string) => FormContextValue, FormProvider: import("react").Provider<FormContextValue> & import("react").ProviderExoticComponent<Partial<FormContextValue> & {
    children?: import("react").ReactNode;
    scope?: string;
}>;
type FormExtraProps = {
    scope?: string;
    onSubmit?: () => void;
};
export type FormProps = ViewProps & FormExtraProps;
export interface FormTriggerProps extends ViewProps {
    scope?: string;
}
export declare const FormTrigger: import("@gui/core").GuiComponent<Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {}>, keyof FormTriggerProps> & FormTriggerProps, import("@gui/core").GuiElement, import("@gui/core").RNGuiViewNonStyleProps & FormTriggerProps, import("@gui/core").StackStyleBase, {}, import("@gui/core").StaticConfigPublic>;
export declare const Form: import("react").ForwardRefExoticComponent<Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {}>, keyof FormExtraProps> & FormExtraProps & import("react").RefAttributes<import("@gui/core").GuiElement>> & import("@gui/core").StaticComponentObject<Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {}>, keyof FormExtraProps> & FormExtraProps, import("@gui/core").GuiElement, import("@gui/core").RNGuiViewNonStyleProps & FormExtraProps, import("@gui/core").StackStyleBase, {}, import("@gui/core").StaticConfigPublic> & Omit<import("@gui/core").StaticConfigPublic, "staticConfig" | "styleable"> & {
    __tama: [Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {}>, keyof FormExtraProps> & FormExtraProps, import("@gui/core").GuiElement, import("@gui/core").RNGuiViewNonStyleProps & FormExtraProps, import("@gui/core").StackStyleBase, {}, import("@gui/core").StaticConfigPublic];
} & {
    Trigger: import("@gui/core").GuiComponent<Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {}>, keyof FormTriggerProps> & FormTriggerProps, import("@gui/core").GuiElement, import("@gui/core").RNGuiViewNonStyleProps & FormTriggerProps, import("@gui/core").StackStyleBase, {}, import("@gui/core").StaticConfigPublic>;
};
export {};
//# sourceMappingURL=Form.d.ts.map