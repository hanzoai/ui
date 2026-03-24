import type { GetProps, GetRef } from '@gui/web';
import { ScrollView as ScrollViewNative } from 'react-native';
export declare const ScrollView: import("@gui/web").GuiComponent<import("@gui/web").TamaDefer, ScrollViewNative, import("@gui/web").GuiComponentPropsBaseBase & import("react-native").ScrollViewProps, import("@gui/web").StackStyleBase & {
    readonly contentContainerStyle?: Partial<import("@gui/web").InferStyleProps<typeof ScrollViewNative, {
        accept: {
            readonly contentContainerStyle: "style";
        };
    }>> | undefined;
}, {
    fullscreen?: boolean | undefined;
}, {
    accept: {
        readonly contentContainerStyle: "style";
    };
}>;
export type ScrollView = GetRef<typeof ScrollView>;
export type ScrollViewProps = GetProps<typeof ScrollView>;
//# sourceMappingURL=ScrollView.d.ts.map