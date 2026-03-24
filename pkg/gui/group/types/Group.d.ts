import type { GetProps } from '@gui/core';
import type { Scope } from '@gui/create-context';
import React from 'react';
type ScopedProps<P> = P & {
    __scopeGroup?: Scope;
};
declare const createGroupScope: import("@gui/create-context").CreateScope;
export declare const GroupFrame: import("@gui/core").GuiComponent<import("@gui/core").TamaDefer, import("@gui/core").GuiElement, import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
    unstyled?: boolean | undefined;
    elevation?: number | import("@gui/core").SizeTokens | undefined;
    fullscreen?: boolean | undefined;
    size?: any;
}, import("@gui/core").StaticConfigPublic>;
export type GroupExtraProps = {
    orientation?: 'horizontal' | 'vertical';
    disabled?: boolean;
};
export type GroupProps = GetProps<typeof GroupFrame> & GroupExtraProps;
export type GroupItemProps = {
    children: React.ReactNode;
    /**
     * forces the item to be a starting, center or ending item and gets the respective styles
     */
    forcePlacement?: 'first' | 'center' | 'last';
};
declare function GroupItem(props: ScopedProps<GroupItemProps & Record<string, any>>): any;
export declare const useGroupItem: (childrenProps: {
    disabled?: boolean;
}, forcePlacement?: GroupItemProps["forcePlacement"], __scopeGroup?: Scope) => {
    borderBottomLeftRadius?: number | undefined;
    borderBottomRightRadius?: number | undefined;
    borderTopLeftRadius?: number | undefined;
    borderTopRightRadius?: number | undefined;
    disabled: boolean | undefined;
};
export declare const Group: React.ForwardRefExoticComponent<Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
    unstyled?: boolean | undefined;
    elevation?: number | import("@gui/core").SizeTokens | undefined;
    fullscreen?: boolean | undefined;
    size?: any;
}>, keyof GroupExtraProps | "__scopeGroup"> & GroupExtraProps & {
    __scopeGroup?: Scope;
} & React.RefAttributes<import("@gui/core").GuiElement>> & import("@gui/core").StaticComponentObject<Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
    unstyled?: boolean | undefined;
    elevation?: number | import("@gui/core").SizeTokens | undefined;
    fullscreen?: boolean | undefined;
    size?: any;
}>, keyof GroupExtraProps | "__scopeGroup"> & GroupExtraProps & {
    __scopeGroup?: Scope;
}, import("@gui/core").GuiElement, import("@gui/core").RNGuiViewNonStyleProps & GroupExtraProps & {
    __scopeGroup?: Scope;
}, import("@gui/core").StackStyleBase, {
    unstyled?: boolean | undefined;
    elevation?: number | import("@gui/core").SizeTokens | undefined;
    fullscreen?: boolean | undefined;
    size?: any;
}, import("@gui/core").StaticConfigPublic> & Omit<import("@gui/core").StaticConfigPublic, "staticConfig" | "styleable"> & {
    __tama: [Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
        unstyled?: boolean | undefined;
        elevation?: number | import("@gui/core").SizeTokens | undefined;
        fullscreen?: boolean | undefined;
        size?: any;
    }>, keyof GroupExtraProps | "__scopeGroup"> & GroupExtraProps & {
        __scopeGroup?: Scope;
    }, import("@gui/core").GuiElement, import("@gui/core").RNGuiViewNonStyleProps & GroupExtraProps & {
        __scopeGroup?: Scope;
    }, import("@gui/core").StackStyleBase, {
        unstyled?: boolean | undefined;
        elevation?: number | import("@gui/core").SizeTokens | undefined;
        fullscreen?: boolean | undefined;
        size?: any;
    }, import("@gui/core").StaticConfigPublic];
} & {
    Item: typeof GroupItem;
};
export declare const YGroup: React.ForwardRefExoticComponent<Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
    unstyled?: boolean | undefined;
    elevation?: number | import("@gui/core").SizeTokens | undefined;
    fullscreen?: boolean | undefined;
    size?: any;
}>, keyof GroupExtraProps | "__scopeGroup"> & GroupExtraProps & {
    __scopeGroup?: Scope;
} & React.RefAttributes<import("@gui/core").GuiElement>> & import("@gui/core").StaticComponentObject<Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
    unstyled?: boolean | undefined;
    elevation?: number | import("@gui/core").SizeTokens | undefined;
    fullscreen?: boolean | undefined;
    size?: any;
}>, keyof GroupExtraProps | "__scopeGroup"> & GroupExtraProps & {
    __scopeGroup?: Scope;
}, import("@gui/core").GuiElement, import("@gui/core").RNGuiViewNonStyleProps & GroupExtraProps & {
    __scopeGroup?: Scope;
}, import("@gui/core").StackStyleBase, {
    unstyled?: boolean | undefined;
    elevation?: number | import("@gui/core").SizeTokens | undefined;
    fullscreen?: boolean | undefined;
    size?: any;
}, import("@gui/core").StaticConfigPublic> & Omit<import("@gui/core").StaticConfigPublic, "staticConfig" | "styleable"> & {
    __tama: [Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
        unstyled?: boolean | undefined;
        elevation?: number | import("@gui/core").SizeTokens | undefined;
        fullscreen?: boolean | undefined;
        size?: any;
    }>, keyof GroupExtraProps | "__scopeGroup"> & GroupExtraProps & {
        __scopeGroup?: Scope;
    }, import("@gui/core").GuiElement, import("@gui/core").RNGuiViewNonStyleProps & GroupExtraProps & {
        __scopeGroup?: Scope;
    }, import("@gui/core").StackStyleBase, {
        unstyled?: boolean | undefined;
        elevation?: number | import("@gui/core").SizeTokens | undefined;
        fullscreen?: boolean | undefined;
        size?: any;
    }, import("@gui/core").StaticConfigPublic];
} & {
    Item: typeof GroupItem;
};
export declare const XGroup: React.ForwardRefExoticComponent<Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
    unstyled?: boolean | undefined;
    elevation?: number | import("@gui/core").SizeTokens | undefined;
    fullscreen?: boolean | undefined;
    size?: any;
}>, keyof GroupExtraProps | "__scopeGroup"> & GroupExtraProps & {
    __scopeGroup?: Scope;
} & React.RefAttributes<import("@gui/core").GuiElement>> & import("@gui/core").StaticComponentObject<Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
    unstyled?: boolean | undefined;
    elevation?: number | import("@gui/core").SizeTokens | undefined;
    fullscreen?: boolean | undefined;
    size?: any;
}>, keyof GroupExtraProps | "__scopeGroup"> & GroupExtraProps & {
    __scopeGroup?: Scope;
}, import("@gui/core").GuiElement, import("@gui/core").RNGuiViewNonStyleProps & GroupExtraProps & {
    __scopeGroup?: Scope;
}, import("@gui/core").StackStyleBase, {
    unstyled?: boolean | undefined;
    elevation?: number | import("@gui/core").SizeTokens | undefined;
    fullscreen?: boolean | undefined;
    size?: any;
}, import("@gui/core").StaticConfigPublic> & Omit<import("@gui/core").StaticConfigPublic, "staticConfig" | "styleable"> & {
    __tama: [Omit<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {
        unstyled?: boolean | undefined;
        elevation?: number | import("@gui/core").SizeTokens | undefined;
        fullscreen?: boolean | undefined;
        size?: any;
    }>, keyof GroupExtraProps | "__scopeGroup"> & GroupExtraProps & {
        __scopeGroup?: Scope;
    }, import("@gui/core").GuiElement, import("@gui/core").RNGuiViewNonStyleProps & GroupExtraProps & {
        __scopeGroup?: Scope;
    }, import("@gui/core").StackStyleBase, {
        unstyled?: boolean | undefined;
        elevation?: number | import("@gui/core").SizeTokens | undefined;
        fullscreen?: boolean | undefined;
        size?: any;
    }, import("@gui/core").StaticConfigPublic];
} & {
    Item: typeof GroupItem;
};
export { createGroupScope };
//# sourceMappingURL=Group.d.ts.map