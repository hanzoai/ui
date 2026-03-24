import type { GetProps } from '@gui/core';
export declare const themeableVariants: {
    readonly circular: {
        true: (_: any, { props, tokens }: {
            props: any;
            tokens: any;
        }) => {
            borderRadius: number;
            padding: number;
        } | {
            width: any;
            height: any;
            maxWidth: any;
            maxHeight: any;
            minWidth: any;
            minHeight: any;
            borderRadius: number;
            padding: number;
        };
    };
    readonly elevate: {
        true: (_: boolean, extras: any) => any;
    };
    readonly bordered: {
        readonly true: (val: boolean | number, { props }: {
            props: any;
        }) => {
            borderWidth: number;
            borderColor: string;
        };
    };
    readonly transparent: {
        readonly true: {
            readonly backgroundColor: "transparent";
        };
    };
    readonly chromeless: {
        readonly true: {
            backgroundColor: string;
            borderColor: string;
            shadowColor: string;
            hoverStyle: {
                borderColor: string;
            };
        };
        readonly all: {
            readonly hoverStyle: {
                backgroundColor: string;
                borderColor: string;
                shadowColor: string;
                hoverStyle: {
                    borderColor: string;
                };
            };
            readonly pressStyle: {
                backgroundColor: string;
                borderColor: string;
                shadowColor: string;
                hoverStyle: {
                    borderColor: string;
                };
            };
            readonly focusStyle: {
                backgroundColor: string;
                borderColor: string;
                shadowColor: string;
                hoverStyle: {
                    borderColor: string;
                };
            };
            readonly backgroundColor: string;
            readonly borderColor: string;
            readonly shadowColor: string;
        };
    };
};
export declare const ThemeableStack: import("@gui/core").GuiComponent<import("@gui/core").TamaDefer, import("@gui/core").GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
    elevation?: number | import("@gui/core").SizeTokens | undefined;
    transparent?: boolean | undefined;
    fullscreen?: boolean | undefined;
    circular?: boolean | undefined;
    elevate?: boolean | undefined;
    bordered?: boolean | undefined;
    chromeless?: boolean | "all" | undefined;
}, import("@gui/core").StaticConfigPublic>;
export type ThemeableStackProps = GetProps<typeof ThemeableStack>;
//# sourceMappingURL=ThemeableStack.d.ts.map