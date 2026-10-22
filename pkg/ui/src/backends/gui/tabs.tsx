'use client'

/**
 * Tabs — `TabsTrigger` is gui's `Tabs.Tab`; rows meet the 44px touch floor.
 *
 * Two looks. The default is the segmented pill: a 36px track on the hover rung
 * with the chosen tab lifted onto the ground. `variant="line"` is the record
 * page's strip (the record kit's Tabs, MIT, NOTICE): a transparent list over a 1px
 * baseline, 40px tabs whose label sits in an inner box (8×8 at `md`, 4×8 at
 * `sm`, 8px corner) that takes the hover rung under the pointer, and a 1px line
 * in the ink under the chosen tab. A tab takes a `startIcon`, an `endIcon` and a
 * `badge`, and `highlighted` rings it (a drop target during a drag). Vertical
 * orientation moves the baseline to the end edge.
 *
 * The variant and the chosen value ride a context from the root, because gui
 * paints a tab's `activeStyle` but tells nothing else inside it which tab is
 * chosen — and the line has to know where to draw.
 */
import { Tabs as GuiTabs, XStack, YStack } from '@hanzo/gui'
import { createContext, useContext, useState, type ComponentProps, type ReactNode } from 'react'
import { ink } from './ink'
import { slot } from './slot'
import { touch } from './gesture'

const ROW_H = 36
const LINE_H = 40

type Line = { variant: 'default' | 'line'; value: string | undefined; vertical: boolean }
const LineContext = /* @__PURE__ */ createContext<Line>({ variant: 'default', value: undefined, vertical: false })

export type TabsProps = ComponentProps<typeof GuiTabs> & {
  /** `line` is the underlined record strip; the default is the segmented pill. */
  variant?: 'default' | 'line'
}
export type TabsListProps = ComponentProps<typeof GuiTabs.List>
export type TabsTriggerProps = Omit<ComponentProps<typeof GuiTabs.Tab>, 'size'> & {
  /** A 16px icon before the label (line variant). */
  startIcon?: ReactNode
  /** An icon after the label. */
  endIcon?: ReactNode
  /** A count or marker after the label. */
  badge?: ReactNode
  /** `sm` tightens the inner box to 4×8 (line variant). */
  size?: 'sm' | 'md'
  /** Ringed as a drop target. */
  highlighted?: boolean
}
export type TabsContentProps = ComponentProps<typeof GuiTabs.Content>

const Tabs = ({ variant = 'default', value, defaultValue, onValueChange, orientation, ...p }: TabsProps) => {
  const [own, setOwn] = useState<string | undefined>(defaultValue as string | undefined)
  const current = (value as string | undefined) ?? own
  return (
    <LineContext.Provider value={{ variant, value: current, vertical: orientation === 'vertical' }}>
      <GuiTabs
        {...slot('tabs')}
        flexDirection={orientation === 'vertical' ? 'row' : 'column'}
        gap="$2"
        {...(value !== undefined ? { value } : { defaultValue })}
        onValueChange={(v: string) => {
          setOwn(v)
          onValueChange?.(v)
        }}
        {...(orientation ? { orientation } : null)}
        {...(variant === 'line' ? { 'data-variant': 'line' } : null)}
        {...p}
      />
    </LineContext.Provider>
  )
}

const TabsList = (p: TabsListProps) => {
  const { variant, vertical } = useContext(LineContext)
  if (variant === 'line')
    return (
      <GuiTabs.List
        {...slot('tabs-list')}
        {...(vertical
          ? { flexDirection: 'column', borderRightWidth: 1, items: 'stretch' }
          : { flexDirection: 'row', borderBottomWidth: 1, items: 'flex-end' })}
        borderColor="$borderColor"
        bg="transparent"
        gap="$1"
        p={0}
        rounded={0}
        justify="flex-start"
        {...p}
      />
    )
  return (
    <GuiTabs.List
      {...slot('tabs-list')}
      items="center"
      justify="center"
      self="flex-start"
      height={ROW_H}
      p={3}
      gap={2}
      bg="$hover"
      rounded="$4"
      {...p}
    />
  )
}

/** The record strip's tab: an inner box that hovers, and the line under the chosen one. */
const LineTab = ({ children, startIcon, endIcon, badge, size = 'md', highlighted = false, disabled, value, ...p }: TabsTriggerProps) => {
  const { value: current, vertical } = useContext(LineContext)
  const [hovered, setHovered] = useState(false)
  const chosen = current === value
  const tone = disabled ? '$hush' : chosen ? '$ink' : '$aside'
  return (
    <GuiTabs.Tab
      {...slot('tabs-trigger')}
      data-variant="line"
      {...(chosen ? { 'data-chosen': '' } : null)}
      unstyled
      value={value}
      disabled={disabled}
      position="relative"
      items="center"
      justify="center"
      minH={LINE_H}
      p={0}
      bg="transparent"
      borderWidth={0}
      cursor={disabled ? 'default' : 'pointer'}
      {...touch(LINE_H, 44, 'y')}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      {...p}
    >
      <XStack
        {...slot('tabs-trigger-box')}
        items="center"
        gap="$1"
        px="$2"
        py={size === 'sm' ? '$1' : '$2'}
        rounded={highlighted ? '$xs' : '$3'}
        bg={hovered && !disabled ? '$hover' : 'transparent'}
        {...(highlighted ? { outlineWidth: 1, outlineStyle: 'solid', outlineColor: 'var(--primary)' as never, outlineOffset: -1 } : null)}
      >
        {startIcon}
        {ink(children, undefined, { size: '$2', fontWeight: '500', color: tone, numberOfLines: 1 })}
        {badge}
        {endIcon}
      </XStack>
      {chosen ? (
        <YStack
          {...slot('tabs-indicator')}
          position="absolute"
          bg="$ink"
          {...(vertical ? { r: -1, t: 0, b: 0, width: 1 } : { b: -1, l: 0, r: 0, height: 1 })}
        />
      ) : null}
    </GuiTabs.Tab>
  )
}

const TabsTrigger = (props: TabsTriggerProps) => {
  const { variant } = useContext(LineContext)
  if (variant === 'line') return <LineTab {...props} />
  const { children, startIcon, endIcon, badge, size: _size, highlighted: _highlighted, ...p } = props
  return (
    <GuiTabs.Tab
      {...slot('tabs-trigger')}
      unstyled
      items="center"
      justify="center"
      height="100%"
      px="$3"
      gap="$1.5"
      rounded="$3"
      cursor="pointer"
      {...touch(ROW_H, 44, 'y')}
      hoverStyle={{ bg: '$edge' }}
      focusStyle={{ bg: '$edge' }}
      // The selected tab. gui's `Tabs.Tab` spreads `activeStyle` only for the tab
      // whose `value` is current, and the `unstyled` frame drops its OWN active
      // default (`...!unstyled && !activeStyle && {…}` in the compiled frame) — so
      // without this the active tab is painted identically to the rest and the row
      // reads as though nothing is chosen. A raised `$background` pill on the
      // `$hover` track: shadcn's `data-[state=active]:bg-background shadow-sm`.
      activeStyle={{
        bg: '$background',
        shadowColor: '$shadowColor',
        shadowOpacity: 0.12,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
      }}
      {...(p as ComponentProps<typeof GuiTabs.Tab>)}
    >
      {startIcon}
      {ink(children, undefined, { size: '$2', fontWeight: '500' })}
      {badge}
      {endIcon}
    </GuiTabs.Tab>
  )
}

// A panel fills a Tabs given a height, and is as tall as what it holds in one that
// has none. `flex={1}` set its basis to 0, so in an auto-height column the panel
// folded to 0px and its content drew over whatever came after the Tabs: every
// code sample on hanzo.ai/sdks overlapped the next section. Growing from its
// content's own height does both jobs.
const TabsContent = ({ children, ...p }: TabsContentProps) => (
  <GuiTabs.Content {...slot('tabs-content')} flexGrow={1} {...p}>
    {ink(children)}
  </GuiTabs.Content>
)

export { Tabs, TabsList, TabsTrigger, TabsContent }
