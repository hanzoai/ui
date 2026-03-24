import type { AnimatePresenceProps } from '@gui/animate-presence';
import type { YStackProps } from '@gui/stacks';
import type { GetProps, ViewProps, GuiElement } from '@gui/web';
import { View } from '@gui/web';
import * as React from 'react';
interface CollapsibleProps extends ViewProps {
    defaultOpen?: boolean;
    open?: boolean;
    disabled?: boolean;
    onOpenChange?(open: boolean): void;
}
type CollapsibleTriggerProps = GetProps<typeof View>;
declare const CollapsibleTriggerFrame: import("@gui/web").GuiComponent<import("@gui/web").TamaDefer, GuiElement, import("@gui/web").StackNonStyleProps, import("@gui/web").StackStyleBase, {}, import("@gui/web").StaticConfigPublic>;
declare const CollapsibleTrigger: import("@gui/web").GuiComponent<import("@gui/web").GetFinalProps<import("@gui/web").StackNonStyleProps, import("@gui/web").StackStyleBase, {}>, GuiElement, import("@gui/web").StackNonStyleProps & void, import("@gui/web").StackStyleBase, {}, import("@gui/web").StaticConfigPublic>;
export interface CollapsibleContentExtraProps extends AnimatePresenceProps {
    /**
     * Used to force mounting when more control is needed. Useful when
     * controlling animation with React animation libraries.
     */
    forceMount?: boolean;
}
interface CollapsibleContentProps extends CollapsibleContentExtraProps, YStackProps {
}
declare const CollapsibleContentFrame: import("@gui/web").GuiComponent<import("@gui/web").TamaDefer, GuiElement, import("@gui/web").StackNonStyleProps, import("@gui/web").StackStyleBase, {}, import("@gui/web").StaticConfigPublic>;
declare const CollapsibleContent: import("@gui/web").GuiComponent<Omit<import("@gui/web").GetFinalProps<import("@gui/web").StackNonStyleProps, import("@gui/web").StackStyleBase, {}>, keyof CollapsibleContentExtraProps> & CollapsibleContentExtraProps, GuiElement, import("@gui/web").StackNonStyleProps & CollapsibleContentExtraProps, import("@gui/web").StackStyleBase, {}, import("@gui/web").StaticConfigPublic>;
declare const Collapsible: React.ForwardRefExoticComponent<CollapsibleProps & {
    __scopeCollapsible?: string;
} & React.RefAttributes<GuiElement>> & {
    Trigger: import("@gui/web").GuiComponent<import("@gui/web").GetFinalProps<import("@gui/web").StackNonStyleProps, import("@gui/web").StackStyleBase, {}>, GuiElement, import("@gui/web").StackNonStyleProps & void, import("@gui/web").StackStyleBase, {}, import("@gui/web").StaticConfigPublic>;
    Content: import("@gui/web").GuiComponent<Omit<import("@gui/web").GetFinalProps<import("@gui/web").StackNonStyleProps, import("@gui/web").StackStyleBase, {}>, keyof CollapsibleContentExtraProps> & CollapsibleContentExtraProps, GuiElement, import("@gui/web").StackNonStyleProps & CollapsibleContentExtraProps, import("@gui/web").StackStyleBase, {}, import("@gui/web").StaticConfigPublic>;
};
export { Collapsible, CollapsibleContent, CollapsibleContentFrame, CollapsibleTrigger, CollapsibleTriggerFrame, };
export type { CollapsibleContentProps, CollapsibleProps, CollapsibleTriggerProps };
//# sourceMappingURL=Collapsible.d.ts.map