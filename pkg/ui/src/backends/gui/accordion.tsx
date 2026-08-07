'use client'

/**
 * Accordion — @hanzogui/accordion's five parts under the four shadcn names.
 *
 * The behaviour is entirely the primitive's and nothing here re-implements any
 * of it: the roving Arrow/Home/End focus lives in gui's `Accordion` root,
 * `aria-expanded` + `aria-controls` on `Collapsible.Trigger`, `role="region"` +
 * `aria-labelledby` on `Accordion.Content`, and `aria-disabled` on a row that is
 * open in a non-collapsible single accordion. This file flattens the compound
 * into the four names and corrects four things:
 *
 *  1. gui's `Accordion.Header` renders an `<h1>` at `size: '$10'`. An accordion
 *     is a list of sections INSIDE a page that already has a title, so every
 *     item shipped a competing document heading and a screen reader's heading
 *     list came out as N level-1s. Radix's default is `<h3>`; `headingLevel`
 *     re-hosts it (and sets the matching `aria-level`, which gui's inherited
 *     `role="heading"` requires to be valid) so a call site can place the row in
 *     its own outline.
 *
 *  2. `unstyled` means gui applies nothing — which on web leaves the UA's own
 *     button chrome, and a native `<button>` is #efefef with a 2px outset black
 *     border. Unstyled must mean "no chrome", not "the browser's chrome". Same
 *     correction `collapsible.tsx` makes, for the same primitive underneath.
 *
 *  3. The chevron has to know whether its row is open, and gui exports no item
 *     context. `Collapsible.Trigger` renders a FUNCTION child with `{ open }` —
 *     that is the only seam, and it is typed as `ReactNode`, hence the one cast
 *     below. Reading `data-state` from CSS instead is not available to us: gui
 *     compiles style props to atomic classes and has no parent-state selector,
 *     and a Tailwind `[data-state=open]>svg` rule loses to gui's runtime sheet.
 *
 *  4. That trigger is a BARE `<button>`, and a bare button inside a form is a
 *     SUBMIT button — an accordion in a settings form posted the form every
 *     time someone opened a section. `type="button"`, declared on the props for
 *     the same reason `Button` declares it: gui's props come from the
 *     cross-platform stack and name no DOM attribute, so it reaches the element
 *     but does not type.
 *
 * ADDED, not from shadcn: `hideArrow` (kept from the desktop fork this replaces —
 * a row whose state is already shown some other way) and `headingLevel`.
 */
import { Accordion as GuiAccordion, XStack } from '@hanzo/gui'
import { ChevronDown } from '@hanzogui/lucide-icons-2'
import type { ComponentProps, ReactNode } from 'react'
import { ink } from './ink'
import { slot } from './slot'

/** The row IS the touch target — a full-width disclosure never needs `touch()`. */
const ROW_MIN_H = 44
const ICON = 16

export type AccordionProps = ComponentProps<typeof GuiAccordion>
export type AccordionItemProps = ComponentProps<typeof GuiAccordion.Item>
export type AccordionContentProps = ComponentProps<typeof GuiAccordion.Content>
export type AccordionTriggerProps = ComponentProps<typeof GuiAccordion.Trigger> & {
  hideArrow?: boolean
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6
  /** The DOM button type — see (4). Defaults to `button`, not the UA's submit. */
  type?: 'button' | 'submit' | 'reset'
}

const Accordion = (p: AccordionProps) => <GuiAccordion {...slot('accordion')} {...p} />

const AccordionItem = (p: AccordionItemProps) => (
  <GuiAccordion.Item
    {...slot('accordion-item')}
    borderBottomWidth={1}
    borderColor="$borderColor"
    {...p}
  />
)

const AccordionTrigger = ({
  children,
  hideArrow = false,
  headingLevel = 3,
  ...p
}: AccordionTriggerProps) => (
  <GuiAccordion.Header
    {...slot('accordion-header')}
    unstyled
    render={`h${headingLevel}`}
    aria-level={headingLevel}
    display="flex"
    // The header is STRUCTURE, not type: it holds one button and the button
    // holds the type. Left at gui's heading scale it publishes a 32px
    // font-family/size down the tree, which any element child of the trigger
    // inherits the moment a reset says `button { font: inherit }`.
    size="$3"
  >
    <GuiAccordion.Trigger
      {...slot('accordion-trigger')}
      unstyled
      type="button"
      bg="transparent"
      borderWidth={0}
      flexDirection="row"
      items="center"
      justify="space-between"
      gap="$2"
      width="100%"
      minH={ROW_MIN_H}
      px={0}
      py="$2"
      cursor="pointer"
      // The same two rungs every row in this backend uses for hover and for the
      // keyboard's arrow-key landing — an unstyled trigger has no focus ring of
      // its own, and roving focus that shows nothing is roving nowhere.
      hoverStyle={{ bg: '$color2' }}
      focusStyle={{ bg: '$color3' }}
      pressStyle={{ bg: '$color3' }}
      {...p}
    >
      {(({ open }: { open: boolean }) => (
        <>
          {ink(children, undefined, { fontSize: '$3', fontWeight: '500', color: '$color12' })}
          {hideArrow ? null : (
            <XStack
              {...slot('accordion-chevron')}
              shrink={0}
              items="center"
              justify="center"
              rotate={open ? '180deg' : '0deg'}
              opacity={0.6}
            >
              <ChevronDown size={ICON} />
            </XStack>
          )}
        </>
      )) as unknown as ReactNode}
    </GuiAccordion.Trigger>
  </GuiAccordion.Header>
)

const AccordionContent = ({ children, ...p }: AccordionContentProps) => (
  <GuiAccordion.Content {...slot('accordion-content')} unstyled overflow="hidden" pb="$3" {...p}>
    {ink(children, undefined, { fontSize: '$2', color: '$color11' })}
  </GuiAccordion.Content>
)

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
