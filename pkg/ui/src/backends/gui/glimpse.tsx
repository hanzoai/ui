'use client'

/**
 * Glimpse — a link preview: rest a pointer on a trigger and see the page it
 * points to, image and title and description, before following it.
 *
 * Built the way `hover-card.tsx` is: a `Popover` in hover mode. `hoverable`
 * puts floating-ui's `useHover` + `safePolygon` on the popper so the cursor can
 * cross the gap into the panel without it closing, `useFocus` opens it from the
 * keyboard, and `place()` rejoins the `side`/`align`/`sideOffset` API a call
 * site is written against onto the one `placement`/`offset` the popper root
 * owns (shared with `popover.tsx` and `hover-card.tsx` rather than spelled
 * again here). Press is not a trigger — the trigger is usually a link whose
 * click must navigate.
 *
 * Content is composed directly on `GuiPopover.Content` rather than by wrapping
 * `HoverCard`, because a link preview's layout is not uniform padding: the
 * image bleeds to the panel's rounded edges and only the text sits in a
 * margin, which `HoverCardContent`'s single `p` cannot express. Content itself
 * carries no padding — `GlimpseImage` fills it edge to edge, `GlimpseTitle` and
 * `GlimpseDescription` carry their own.
 *
 * `GlimpseImage` owns one bit of state Radix's original left to `next/image`:
 * a broken `src` swaps the frame for an `ImageOff` glyph rather than the
 * browser's own broken-image icon.
 */
import { Image, Popover as GuiPopover, SizableText, YStack, type ImageProps } from '@hanzo/gui'
import { ImageOff } from '@hanzogui/lucide-icons-2'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ComponentProps,
  type SyntheticEvent,
} from 'react'

import { AspectRatio } from './aspect-ratio'
import { ink } from './ink'
import { place, type Align, type Side } from './place'
import { slot } from './slot'
import { PortalTheme, useThemeName } from '../../product/menu/portal-theme'

/** Radix's hover card defaults, kept so a migrated call site behaves identically. */
const OPEN_DELAY = 700
const CLOSE_DELAY = 300
const DEFAULT_OFFSET = 4
/** Radix/shadcn ship `w-80`. */
const WIDTH = 320
const DEFAULT_RATIO = 16 / 9

type Placement = NonNullable<ComponentProps<typeof GuiPopover>['placement']>

/** Root-owned floating geometry. Content publishes into it; see `place.ts`. */
const FloatContext = /* @__PURE__ */ createContext<
  ((placement: Placement, offset: number) => void) | null
>(null)

export type GlimpseProps = Omit<
  ComponentProps<typeof GuiPopover>,
  'hoverable' | 'placement' | 'offset'
> & {
  openDelay?: number
  closeDelay?: number
}

function Glimpse({ openDelay = OPEN_DELAY, closeDelay = CLOSE_DELAY, ...props }: GlimpseProps) {
  const [float, setFloat] = useState<{ placement: Placement; offset: number }>({
    placement: 'bottom',
    offset: DEFAULT_OFFSET,
  })
  // Identity-stable: an unchanged publish returns the same object, so Content's
  // effect cannot drive a render loop.
  const publish = useCallback(
    (placement: Placement, offset: number) =>
      setFloat((f) => (f.placement === placement && f.offset === offset ? f : { placement, offset })),
    [],
  )
  return (
    <FloatContext.Provider value={publish}>
      <GuiPopover
        hoverable={{ delay: { open: openDelay, close: closeDelay } }}
        placement={float.placement}
        offset={float.offset}
        {...props}
      />
    </FloatContext.Provider>
  )
}

export type GlimpseTriggerProps = ComponentProps<typeof GuiPopover.Trigger>

const GlimpseTrigger = (props: GlimpseTriggerProps) => (
  <GuiPopover.Trigger {...slot('glimpse-trigger')} disablePressTrigger {...props} />
)

export type GlimpseContentProps = ComponentProps<typeof GuiPopover.Content> & {
  side?: Side
  align?: Align
  sideOffset?: number
}

const GlimpseContent = ({
  side = 'bottom',
  align = 'center',
  sideOffset = DEFAULT_OFFSET,
  children,
  ...props
}: GlimpseContentProps) => {
  const themeName = useThemeName()
  const publish = useContext(FloatContext)
  useEffect(
    () => publish?.(place(side, align) as Placement, sideOffset),
    [publish, side, align, sideOffset],
  )
  return (
    <PortalTheme name={themeName}>
      <GuiPopover.Content
        {...slot('glimpse-content')}
        bg="$panel"
        borderWidth={1}
        borderColor="$borderColor"
        rounded="$4"
        overflow="hidden"
        width={WIDTH}
        {...props}
      >
        {ink(children, undefined, { size: '$2' })}
      </GuiPopover.Content>
    </PortalTheme>
  )
}

export type GlimpseImageProps = Omit<ImageProps, 'width' | 'height'> & {
  /** Width divided by height of the preview frame. 16:9 by default. */
  ratio?: number
}

/**
 * The preview thumbnail. Fills its frame edge to edge — `GlimpseContent` gives
 * it no margin to bleed out of, unlike Radix/shadcn's negative-margin trick.
 * A `src` that fails to load swaps the frame for an `ImageOff` glyph rather
 * than the browser's own broken-image icon.
 */
const GlimpseImage = ({ ratio = DEFAULT_RATIO, onError, ...props }: GlimpseImageProps) => {
  const [failed, setFailed] = useState(false)
  return (
    <AspectRatio ratio={ratio} bg="$edge" {...slot('glimpse-image')}>
      {failed ? (
        <YStack width="100%" height="100%" items="center" justify="center">
          <ImageOff size={20} color="$quiet" />
        </YStack>
      ) : (
        <Image
          width="100%"
          height="100%"
          objectFit="cover"
          // gui's Image intersects RN's and web's onError, two incompatible
          // event types; this branch is always the web one.
          // @ts-expect-error see above
          onError={(event: SyntheticEvent<HTMLImageElement>) => {
            setFailed(true)
            onError?.(event)
          }}
          {...props}
        />
      )}
    </AspectRatio>
  )
}

export type GlimpseTitleProps = ComponentProps<typeof SizableText>

const GlimpseTitle = ({ children, ...props }: GlimpseTitleProps) => (
  <SizableText
    {...slot('glimpse-title')}
    size="$3"
    fontWeight="600"
    px="$3"
    pt="$3"
    numberOfLines={1}
    {...props}
  >
    {children}
  </SizableText>
)

export type GlimpseDescriptionProps = ComponentProps<typeof SizableText>

const GlimpseDescription = ({ children, ...props }: GlimpseDescriptionProps) => (
  <SizableText
    {...slot('glimpse-description')}
    size="$2"
    color="$quiet"
    px="$3"
    pb="$3"
    numberOfLines={2}
    {...props}
  >
    {children}
  </SizableText>
)

export { Glimpse, GlimpseTrigger, GlimpseContent, GlimpseImage, GlimpseTitle, GlimpseDescription }
