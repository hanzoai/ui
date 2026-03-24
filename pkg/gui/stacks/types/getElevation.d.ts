import type { SizeTokens, SizeVariantSpreadFunction, ViewProps, VariantSpreadExtras } from '@gui/core';
export declare const getElevation: SizeVariantSpreadFunction<ViewProps>;
export declare const getSizedElevation: (val: SizeTokens | number | boolean, { theme, tokens }: VariantSpreadExtras<any>) => {
    elevationAndroid?: number | undefined;
    shadowColor: import("@gui/core").Variable<string> | import("@gui/core").Variable<any> | import("@gui/core").Variable<undefined> | undefined;
    shadowRadius: number;
    shadowOffset: {
        height: number;
        width: number;
    };
} | undefined;
//# sourceMappingURL=getElevation.d.ts.map