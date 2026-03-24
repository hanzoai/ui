import { Collapsible } from '@gui/collapsible';
import type { GetProps, GuiElement } from '@gui/core';
import { View } from '@gui/core';
import { H1 } from '@gui/text';
import * as React from 'react';
type Direction = 'ltr' | 'rtl';
type ScopedProps<P> = P & {
    __scopeAccordion?: string;
};
type AccordionElement = AccordionImplMultipleElement | AccordionImplSingleElement;
interface AccordionSingleProps extends AccordionImplSingleProps {
    type: 'single';
}
interface AccordionMultipleProps extends AccordionImplMultipleProps {
    type: 'multiple';
}
type AccordionImplSingleElement = AccordionImplElement;
interface AccordionImplSingleProps extends AccordionImplProps {
    /**
     * The controlled stateful value of the accordion item whose content is expanded.
     */
    value?: string;
    /**
     * The value of the item whose content is expanded when the accordion is initially rendered. Use
     * `defaultValue` if you do not need to control the state of an accordion.
     */
    defaultValue?: string;
    /**
     * The callback that fires when the state of the accordion changes.
     */
    onValueChange?(value: string): void;
    /**
     * Whether an accordion item can be collapsed after it has been opened.
     * @default false
     */
    collapsible?: boolean;
}
type AccordionImplMultipleElement = AccordionImplElement;
interface AccordionImplMultipleProps extends AccordionImplProps {
    /**
     * The controlled stateful value of the accordion items whose contents are expanded.
     */
    value?: string[];
    /**
     * The value of the items whose contents are expanded when the accordion is initially rendered. Use
     * `defaultValue` if you do not need to control the state of an accordion.
     */
    defaultValue?: string[];
    /**
     * The callback that fires when the state of the accordion changes.
     */
    onValueChange?(value: string[]): void;
}
type AccordionImplElement = GuiElement;
type PrimitiveDivProps = GetProps<typeof View>;
interface AccordionImplProps extends PrimitiveDivProps {
    /**
     * Whether or not an accordion is disabled from user interaction.
     *
     * @defaultValue false
     */
    disabled?: boolean;
    /**
     * The layout in which the Accordion operates.
     * @default vertical
     */
    orientation?: React.AriaAttributes['aria-orientation'];
    /**
     * The language read direction.
     */
    dir?: Direction;
    /**
     *  The callback that fires when the state of the accordion changes. for use with `useAccordion`
     * @param selected - The values of the accordion items whose contents are expanded.
     */
    control?(selected: string[]): void;
}
type CollapsibleProps = React.ComponentPropsWithoutRef<typeof Collapsible>;
interface AccordionItemProps extends Omit<CollapsibleProps, 'open' | 'defaultOpen' | 'onOpenChange'> {
    /**
     * Whether or not an accordion item is disabled from user interaction.
     *
     * @defaultValue false
     */
    disabled?: boolean;
    /**
     * A string value for the accordion item. All items within an accordion should use a unique value.
     */
    value: string;
}
type PrimitiveHeading3Props = React.ComponentPropsWithoutRef<typeof H1>;
type AccordionHeaderProps = PrimitiveHeading3Props;
declare const AccordionTriggerFrame: import("@gui/core").GuiComponent<import("@gui/core").TamaDefer, GuiElement, import("@gui/core").StackNonStyleProps & void, import("@gui/core").StackStyleBase, {
    unstyled?: boolean | undefined;
}, import("@gui/core").StaticConfigPublic>;
type AccordionTriggerProps = GetProps<typeof AccordionTriggerFrame>;
declare const AccordionContentFrame: import("@gui/core").GuiComponent<import("@gui/core").TamaDefer, GuiElement, import("@gui/core").StackNonStyleProps & import("@gui/collapsible").CollapsibleContentExtraProps, import("@gui/core").StackStyleBase, {
    unstyled?: boolean | undefined;
}, import("@gui/core").StaticConfigPublic>;
type AccordionContentProps = GetProps<typeof AccordionContentFrame>;
declare const Accordion: React.ForwardRefExoticComponent<ScopedProps<AccordionSingleProps | AccordionMultipleProps> & React.RefAttributes<AccordionElement>> & {
    Trigger: import("@gui/core").GuiComponent<import("@gui/core").GetFinalProps<import("@gui/core").StackNonStyleProps & void, import("@gui/core").StackStyleBase, {
        unstyled?: boolean | undefined;
    }>, GuiElement, import("@gui/core").StackNonStyleProps & void, import("@gui/core").StackStyleBase, {
        unstyled?: boolean | undefined;
    }, import("@gui/core").StaticConfigPublic>;
    Header: React.ForwardRefExoticComponent<Omit<Omit<import("@gui/core").TextNonStyleProps, "unstyled" | "size" | keyof import("@gui/core").TextStylePropsBase> & import("@gui/core").WithThemeValues<import("@gui/core").TextStylePropsBase> & {
        unstyled?: boolean | undefined;
        size?: import("@gui/core").FontSizeTokens | undefined;
    } & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").TextStylePropsBase>> & import("@gui/core").WithPseudoProps<import("@gui/core").WithThemeValues<import("@gui/core").TextStylePropsBase> & {
        unstyled?: boolean | undefined;
        size?: import("@gui/core").FontSizeTokens | undefined;
    } & import("@gui/core").WithShorthands<import("@gui/core").WithThemeValues<import("@gui/core").TextStylePropsBase>>> & import("@gui/core").WithMediaProps<import("@gui/core").WithThemeShorthandsAndPseudos<import("@gui/core").TextStylePropsBase, {
        unstyled?: boolean | undefined;
        size?: import("@gui/core").FontSizeTokens | undefined;
    }>> & React.RefAttributes<import("@gui/core").GuiTextElement>, "ref"> & React.RefAttributes<(HTMLElement & import("@gui/core").GuiElementMethods) | import("react-native").Text>>;
    Content: import("@gui/core").GuiComponent<import("@gui/core").GetFinalProps<import("@gui/core").StackNonStyleProps & import("@gui/collapsible").CollapsibleContentExtraProps, import("@gui/core").StackStyleBase, {
        unstyled?: boolean | undefined;
    }>, GuiElement, import("@gui/core").StackNonStyleProps & import("@gui/collapsible").CollapsibleContentExtraProps & void, import("@gui/core").StackStyleBase, {
        unstyled?: boolean | undefined;
    }, import("@gui/core").StaticConfigPublic>;
    Item: React.ForwardRefExoticComponent<AccordionItemProps & React.RefAttributes<(HTMLElement & import("@gui/core").GuiElementMethods) | import("react-native").View>>;
    HeightAnimator: import("@gui/core").GuiComponent<import("@gui/core").GetFinalProps<import("@gui/core").RNGuiViewNonStyleProps, import("@gui/core").StackStyleBase, {}>, GuiElement, import("@gui/core").RNGuiViewNonStyleProps & void, import("@gui/core").StackStyleBase, {}, {}>;
};
export { Accordion };
export type { AccordionContentProps, AccordionHeaderProps, AccordionItemProps, AccordionMultipleProps, AccordionSingleProps, AccordionTriggerProps, };
//# sourceMappingURL=Accordion.d.ts.map