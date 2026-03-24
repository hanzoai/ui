import type { GuiElement } from '@gui/core';
import { Slot } from '@gui/core';
import React from 'react';
type SlotProps = React.ComponentPropsWithoutRef<typeof Slot>;
interface CollectionProps extends SlotProps {
}
declare function createCollection<ItemElement extends GuiElement, ItemData = {}>(name: string): readonly [{
    readonly Provider: React.FC<{
        children?: React.ReactNode;
    } & {
        scope?: any;
    }>;
    readonly Slot: React.ForwardRefExoticComponent<CollectionProps & {
        scope?: any;
    } & React.RefAttributes<GuiElement | undefined>>;
    readonly ItemSlot: React.ForwardRefExoticComponent<React.PropsWithoutRef<ItemData & {
        children: React.ReactNode;
    } & {
        scope?: any;
    }> & React.RefAttributes<ItemElement | undefined>>;
}, (scope: string) => () => ({
    ref: React.RefObject<ItemElement | undefined>;
} & ItemData)[]];
export { createCollection };
export type { CollectionProps };
//# sourceMappingURL=Collection.d.ts.map