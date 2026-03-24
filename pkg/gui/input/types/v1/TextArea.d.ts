/**
 * @deprecated Use the new TextArea from '@gui/input' instead
 * @summary A text area is a multi-line input field that allows users to enter text.
 * @see — Docs https://gui.dev/ui/inputs#textarea
 */
export declare const TextArea: import("@gui/web").GuiComponent<import("@gui/web").TamaDefer, import("@gui/web").GuiElement, import("@gui/core").RNGuiViewNonStyleProps & import("@gui/web").StackNonStyleProps & import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>> & import("@gui/web").WithPseudoProps<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>>> & import("@gui/web").WithMediaProps<import("@gui/web").WithThemeShorthandsAndPseudos<import("@gui/web").StackStyleBase, {}>> & Omit<import("react").ClassAttributes<HTMLInputElement> & import("react").HTMLProps<HTMLInputElement>, "size" | `$${string}` | `$${number}` | import("@gui/web").GroupMediaKeys | `$theme-${string}` | `$theme-${number}` | "value" | keyof import("@gui/web").StackNonStyleProps | keyof import("@gui/web").StackStyleBase | keyof import("@gui/web").WithPseudoProps<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase> & import("@gui/web").WithShorthands<import("@gui/web").WithThemeValues<import("@gui/web").StackStyleBase>>>> & Pick<import("@gui/web").TextProps, "color"> & Omit<import("react").CSSProperties | undefined, "color"> & Omit<import("react-native").TextInputProps, "numberOfLines" | "selectionColor" | "secureTextEntry" | "keyboardType" | "enterKeyHint" | "inputMode" | "placeholderTextColor" | "editable" | "onChangeText"> & {
    secureTextEntry?: import("react-native").TextInputProps["secureTextEntry"];
    onChangeText?: import("react-native").TextInputProps["onChangeText"];
    editable?: import("react-native").TextInputProps["editable"];
    enterKeyHint?: "done" | "go" | "next" | "search" | "send" | "enter" | "previous";
    keyboardType?: import("react-native").TextInputProps["keyboardType"];
    inputMode?: import("react-native").InputModeOptions;
    placeholderTextColor?: import("@gui/web").ColorTokens;
    selectionColor?: import("@gui/web").ColorTokens;
    render?: import("@gui/web").GuiComponentPropsBase["render"];
    multiline?: boolean;
    numberOfLines?: number;
}, import("@gui/web").StackStyleBase & {
    readonly placeholderTextColor?: import("@gui/web").ColorTokens | undefined;
    readonly selectionColor?: import("@gui/web").ColorTokens | undefined;
    readonly cursorColor?: import("@gui/web").ColorTokens | undefined;
    readonly selectionHandleColor?: import("@gui/web").ColorTokens | undefined;
    readonly underlineColorAndroid?: import("@gui/web").ColorTokens | undefined;
}, {
    size?: import("@gui/web").SizeTokens | undefined;
    disabled?: boolean | undefined;
    unstyled?: boolean | undefined;
}, {
    readonly isInput: true;
    readonly accept: {
        readonly placeholderTextColor: "color";
        readonly selectionColor: "color";
        readonly cursorColor: "color";
        readonly selectionHandleColor: "color";
        readonly underlineColorAndroid: "color";
    };
    readonly validStyles: {
        [key: string]: boolean;
    } | undefined;
} & import("@gui/web").StaticConfigPublic>;
//# sourceMappingURL=TextArea.d.ts.map