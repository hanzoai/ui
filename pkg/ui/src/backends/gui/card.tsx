'use client'

/**
 * Card — surface, header, title, description, action, content, footer.
 *
 * The header is a row whose action sits at its end: gui/Yoga has no CSS grid,
 * and a row is the one box model that also exists on native.
 */
import { SizableText, XStack, YStack, styled } from '@hanzo/gui'
import type { ComponentProps } from 'react'
import { slot } from './slot'

const PAD = 24

const CardFrame = styled(YStack, {
  name: 'Card',
  bg: '$background',
  borderWidth: 1,
  borderColor: '$borderColor',
  rounded: '$6',
  py: PAD,
  gap: PAD,
})

const HeaderFrame = styled(XStack, {
  name: 'CardHeader',
  px: PAD,
  gap: '$2',
  items: 'flex-start',
  justify: 'space-between',
})

const TitleFrame = styled(SizableText, { name: 'CardTitle', size: '$4', fontWeight: '600' })
const DescriptionFrame = styled(SizableText, { name: 'CardDescription', size: '$2', color: '$color11' })
const ActionFrame = styled(XStack, { name: 'CardAction', self: 'flex-start', shrink: 0 })
const ContentFrame = styled(YStack, { name: 'CardContent', px: PAD })
const FooterFrame = styled(XStack, { name: 'CardFooter', px: PAD, items: 'center' })

export type CardProps = ComponentProps<typeof CardFrame>
export type CardHeaderProps = ComponentProps<typeof HeaderFrame>
export type CardTitleProps = ComponentProps<typeof TitleFrame>
export type CardDescriptionProps = ComponentProps<typeof DescriptionFrame>
export type CardActionProps = ComponentProps<typeof ActionFrame>
export type CardContentProps = ComponentProps<typeof ContentFrame>
export type CardFooterProps = ComponentProps<typeof FooterFrame>

const Card = (p: CardProps) => <CardFrame {...slot('card')} {...p} />
const CardHeader = (p: CardHeaderProps) => <HeaderFrame {...slot('card-header')} {...p} />
const CardTitle = (p: CardTitleProps) => <TitleFrame {...slot('card-title')} {...p} />
const CardDescription = (p: CardDescriptionProps) => <DescriptionFrame {...slot('card-description')} {...p} />
const CardAction = (p: CardActionProps) => <ActionFrame {...slot('card-action')} {...p} />
const CardContent = (p: CardContentProps) => <ContentFrame {...slot('card-content')} {...p} />
const CardFooter = (p: CardFooterProps) => <FooterFrame {...slot('card-footer')} {...p} />

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent }
