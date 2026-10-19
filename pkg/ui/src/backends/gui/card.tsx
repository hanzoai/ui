'use client'

/**
 * Card — surface, header, title, description, action, content, footer.
 *
 * The header is a row whose action sits at its end: gui/Yoga has no CSS grid,
 * and a row is the one box model that also exists on native.
 */
import { SizableText, XStack, YStack, styled, withStaticProperties } from '@hanzo/gui'
import { createContext, useContext, type ComponentProps } from 'react'
import { useDensity, type DensityName } from './density'
import { AspectRatio, type AspectRatioProps } from './aspect-ratio'
import { ink } from './ink'
import { slot } from './slot'
import type { Microdata } from './microdata'

const PAD = 24

/**
 * The compact card (twenty-ui's Card, MIT, NOTICE): the settings and record
 * frame. No inset of its own and an 8px corner; a Header and a Footer band at
 * 8×16 in 12px medium on the ground, a Content well at 16 on the panel rung,
 * hairlines between them (`divider` on Content, on by default for the Footer).
 * Asked for with `density="compact"` or given by a compact `<Density>`. The
 * regular card stays the 24px-padded panel.
 */
const Compact = /* @__PURE__ */ createContext(false)

const COMPACT = {
  frame: { py: 0, gap: 0, rounded: '$3', overflow: 'hidden', bg: 'transparent' },
  band: { px: 16, py: 8, bg: '$background' },
  content: { p: 16, bg: '$panel' },
} as const

const CardFrame = styled(YStack, {
  name: 'Card',
  bg: '$background',
  borderWidth: 1,
  borderColor: '$borderColor',
  rounded: '$6',
  py: PAD,
  gap: PAD,
})

// STACKED, not a row. The reference header is a grid whose rows are
// `[auto_auto]` — title above description — and it only becomes two columns
// when a CardAction is present. Porting it to XStack put the title and the
// description side by side, so every plain <CardHeader><CardTitle/>
// <CardDescription/></CardHeader> rendered as two narrow columns with the
// title wrapping mid-phrase. That is the shape 79 of 79 call sites in
// hanzo.app use; CardAction is used in none of them and self-aligns instead.
const HeaderFrame = styled(YStack, {
  name: 'CardHeader',
  px: PAD,
  gap: '$2',
  items: 'flex-start',
})

const TitleFrame = styled(SizableText, { name: 'CardTitle', size: '$4', fontWeight: '600' })
const DescriptionFrame = styled(SizableText, { name: 'CardDescription', size: '$2', color: '$quiet' })
const ActionFrame = styled(XStack, { name: 'CardAction', self: 'flex-end', shrink: 0 })
const ContentFrame = styled(YStack, { name: 'CardContent', px: PAD })
const FooterFrame = styled(XStack, { name: 'CardFooter', px: PAD, items: 'center' })

export type CardProps = ComponentProps<typeof CardFrame> & {
  /**
   * The whole card is the control. Makes it focusable, gives it the button role
   * and the Enter/Space keys, and lights it on hover and focus.
   *
   * This exists so nobody wraps a Card in a <Button> again. A Button pins its
   * own height — correctly, it is a control — and a card put inside one gets
   * clipped to a 30px sliver. The affordance belongs on the surface, not around
   * it.
   */
  interactive?: boolean
  /** `compact` is the sectioned settings/record card; unset, the nearest `<Density>` decides. */
  density?: DensityName
} & Microdata
export type CardHeaderProps = ComponentProps<typeof HeaderFrame>
export type CardTitleProps = ComponentProps<typeof TitleFrame>
export type CardDescriptionProps = ComponentProps<typeof DescriptionFrame>
export type CardActionProps = ComponentProps<typeof ActionFrame>
export type CardContentProps = ComponentProps<typeof ContentFrame> & {
  /** A hairline under the content (compact card). */
  divider?: boolean
}
export type CardFooterProps = ComponentProps<typeof FooterFrame> & {
  /** The hairline above the footer (compact card); on by default. */
  divider?: boolean
}

const Card = ({ interactive, onPress, density, children, ...p }: CardProps) => {
  const near = useDensity()
  const compact = (density ?? near) === 'compact'
  return (
  <CardFrame
    {...slot('card')}
    {...(compact ? { 'data-density': 'compact', ...COMPACT.frame } : null)}
    {...(interactive
      ? {
          role: 'button',
          tabIndex: 0,
          cursor: 'pointer',
          hoverStyle: compact ? { bg: '$hover' } : { borderColor: '$dim' },
          focusStyle: { borderColor: '$dim', outlineWidth: 2, outlineStyle: 'solid', outlineColor: '$dim' },
          // A div with role="button" is not a button: the browser gives it no
          // keyboard activation, so it has to be spelled out or the card is
          // mouse-only. Space must also preventDefault or the page scrolls.
          onKeyDown: (e: any) => {
            if (e.key !== 'Enter' && e.key !== ' ') return
            e.preventDefault()
            ;(onPress as ((e: unknown) => void) | undefined)?.(e)
          },
        }
      : null)}
    onPress={onPress}
    {...p}
  >
    <Compact.Provider value={compact}>{children}</Compact.Provider>
  </CardFrame>
  )
}

const CardHeader = ({ children, ...p }: CardHeaderProps) => {
  const compact = useContext(Compact)
  return (
    <HeaderFrame
      {...slot('card-header')}
      {...(compact ? { ...COMPACT.band, gap: '$1', borderBottomWidth: 1, borderColor: '$borderColor' } : null)}
      {...p}
    >
      {compact ? ink(children, SizableText, { size: '$1', fontWeight: '500', color: '$quiet' }) : children}
    </HeaderFrame>
  )
}
const CardTitle = (p: CardTitleProps) => <TitleFrame {...slot('card-title')} {...p} />
const CardDescription = (p: CardDescriptionProps) => <DescriptionFrame {...slot('card-description')} {...p} />
const CardAction = (p: CardActionProps) => <ActionFrame {...slot('card-action')} {...p} />
const CardContent = ({ children, divider = false, ...p }: CardContentProps) => {
  const compact = useContext(Compact)
  return (
    <ContentFrame
      {...slot('card-content')}
      {...(compact ? { ...COMPACT.content, ...(divider ? { borderBottomWidth: 1, borderColor: '$borderColor' } : null) } : null)}
      {...p}
    >
      {ink(children)}
    </ContentFrame>
  )
}
const CardFooter = ({ children, divider = true, ...p }: CardFooterProps) => {
  const compact = useContext(Compact)
  return (
    <FooterFrame
      {...slot('card-footer')}
      {...(compact ? { ...COMPACT.band, ...(divider ? { borderTopWidth: 1, borderColor: '$borderColor' } : null) } : null)}
      {...p}
    >
      {compact ? ink(children, SizableText, { size: '$1', color: '$quiet' }) : ink(children)}
    </FooterFrame>
  )
}

/**
 * CardMedia — the picture at the top of a card, edge to edge.
 *
 * Full-bleed needs one correction and only one: the Card frame has vertical
 * padding and no horizontal padding (the header/content/footer carry their own
 * `px`), so the media is already the full width and only has to climb back over
 * the frame's top padding. Hence `mt: -PAD` and nothing else — no negative
 * horizontal margin, which is the version that leaks past a rounded corner.
 *
 * It is an AspectRatio, so it has a height before the image loads. That is the
 * whole point: a card whose media is a bare <img> is a card that is 0px tall
 * until the network answers, and then jumps.
 */
export type CardMediaProps = AspectRatioProps
const CardMedia = ({ ratio = 16 / 10, ...p }: CardMediaProps) => (
  <AspectRatio {...slot('card-media')} ratio={ratio} mt={-PAD} {...p} />
)

/**
 * The dot-namespace. `Card.Media`, `Card.Body`, `Card.Title`, `Card.Meta` are
 * the SAME components as the named exports beside them, not second copies —
 * `withStaticProperties` hangs the existing implementations off `Card`. Nothing
 * here can drift from the named export, because there is nothing here to drift.
 *
 * The named exports keep their shadcn-lineage spelling because 79 call sites in
 * hanzo.app are written against it; renaming them would be a breaking change
 * bought for nothing.
 */
const CardNamespace = withStaticProperties(Card, {
  Media: CardMedia,
  Header: CardHeader,
  Title: CardTitle,
  Meta: CardDescription,
  Body: CardContent,
  Action: CardAction,
  Footer: CardFooter,
})

export {
  CardNamespace as Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  CardMedia,
}
