'use client'

/**
 * Empty — a placeholder for the absence of data: a header (media, title,
 * description) above a content slot for a call to action.
 *
 * `EmptyMedia` carries the one variant that matters here — a bare icon versus
 * one boxed into a rounded tile — through a styled context, the same split
 * Badge uses for its frame/text pair.
 */
import { SizableText, YStack, createStyledContext, styled } from '@hanzo/gui'
import type { ComponentProps } from 'react'
import { ink } from './ink'
import { slot } from './slot'

const EmptyFrame = styled(YStack, {
  name: 'Empty',
  flex: 1,
  minW: 0,
  items: 'center',
  justify: 'center',
  gap: '$6',
  p: '$6',
  rounded: '$6',
  borderStyle: 'dashed',
})

const HeaderFrame = styled(YStack, {
  name: 'EmptyHeader',
  maxW: 384,
  items: 'center',
  gap: '$2',
})

export type EmptyMediaVariant = 'default' | 'icon'

const MediaContext = /* @__PURE__ */ createStyledContext<{ variant: EmptyMediaVariant }>({ variant: 'default' })

const MediaFrame = styled(YStack, {
  name: 'EmptyMedia',
  context: MediaContext,
  shrink: 0,
  items: 'center',
  justify: 'center',
  mb: '$2',

  variants: {
    variant: {
      default: { bg: 'transparent' },
      icon: { bg: '$hover', width: 40, height: 40, rounded: '$3' },
    },
  } as const,

  defaultVariants: { variant: 'default' },
})

const TitleFrame = styled(SizableText, { name: 'EmptyTitle', size: '$4', fontWeight: '500' })
const DescriptionFrame = styled(SizableText, { name: 'EmptyDescription', size: '$2', color: '$quiet' })

const ContentFrame = styled(YStack, {
  name: 'EmptyContent',
  width: '100%',
  minW: 0,
  maxW: 384,
  items: 'center',
  gap: '$4',
})

export type EmptyProps = ComponentProps<typeof EmptyFrame>
export type EmptyHeaderProps = ComponentProps<typeof HeaderFrame>
export type EmptyMediaProps = ComponentProps<typeof MediaFrame> & { variant?: EmptyMediaVariant }
export type EmptyTitleProps = ComponentProps<typeof TitleFrame>
export type EmptyDescriptionProps = ComponentProps<typeof DescriptionFrame>
export type EmptyContentProps = ComponentProps<typeof ContentFrame>

export const Empty = (p: EmptyProps) => <EmptyFrame {...slot('empty')} {...p} />

export const EmptyHeader = (p: EmptyHeaderProps) => <HeaderFrame {...slot('empty-header')} {...p} />

export const EmptyMedia = ({ variant = 'default', ...p }: EmptyMediaProps) => (
  <MediaFrame {...slot('empty-icon')} data-variant={variant} variant={variant} {...p} />
)

export const EmptyTitle = ({ children, ...p }: EmptyTitleProps) => (
  <TitleFrame {...slot('empty-title')} {...p}>{ink(children)}</TitleFrame>
)

export const EmptyDescription = ({ children, ...p }: EmptyDescriptionProps) => (
  <DescriptionFrame {...slot('empty-description')} {...p}>{ink(children)}</DescriptionFrame>
)

export const EmptyContent = ({ children, ...p }: EmptyContentProps) => (
  <ContentFrame {...slot('empty-content')} {...p}>{ink(children)}</ContentFrame>
)
