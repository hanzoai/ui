import type { ColorTokens, ThemeTokens } from '@gui/core';
import type { YStackProps } from '@gui/stacks';
import type * as React from 'react';
export type SpinnerProps = Omit<YStackProps, 'children'> & {
    size?: 'small' | 'large';
    color?: (ColorTokens | ThemeTokens | (string & {})) | null;
};
export declare const Spinner: React.ForwardRefExoticComponent<SpinnerProps & React.RefAttributes<any>>;
//# sourceMappingURL=Spinner.d.ts.map