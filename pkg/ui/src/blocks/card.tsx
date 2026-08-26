import * as React from 'react'

import { Card } from '../backends/gui/card'
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../backends/gui/card'
import { LinkElement } from '../backends/gui/link'
import { ApplyTypography, type TypographySize } from '../backends/gui/prose'
import { Box } from '../box'
import { cn } from '../core/cn'
import type { LinkDef } from '../types'
import type { CardBlock, VideoBlock } from './def'
import { CTABlockComponent } from './cta'
import { ImageBlockComponent } from './image'
import { VideoBlockComponent } from './video'
import { type BlockComponentProps, has, sx } from './spec'

const SIZES: TypographySize[] = ['responsive', 'sm', 'base', 'lg', 'xl']

/** `typography-lg` in the specifier bag picks the prose rung. */
const rung = (specifiers: string | undefined): TypographySize => {
  const hint = specifiers?.split(/\s+/).find((t) => t.startsWith('typography-'))
  const last = hint?.split('-').pop() as TypographySize | undefined
  return last && SIZES.includes(last) ? last : 'responsive'
}

/** A link that reads as a row: label left, an arrow out on the right. */
const LinkOut = ({ def }: { def: LinkDef }) => (
  <LinkElement
    def={def}
    style={{ justifyContent: 'space-between' }}
    variant="link"
    iconAfter
    icon={
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M7 17 17 7M7 7h10v10"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    }
  />
)

/**
 * A card: a heading, some media, some content, and a call to action — any of
 * which may be absent.
 *
 * `ghost` is the variant with everything taken away: no border, no padding, a
 * larger left-aligned title. It reads as content on the page rather than as a
 * card, which is what a card in a grid of prose usually wants to be.
 */
export const CardBlockComponent = ({
  block,
  className,
  contentClassName,
  agent,
}: BlockComponentProps & { contentClassName?: string }) => {
  if (block.blockType !== 'card') return <>card block required</>
  const card = block as CardBlock
  const spec = (s: string) => has(card.specifiers, s)

  const ghost = spec('ghost')
  const dim = spec('appear-disabled')
  const hover = spec('reveal-content-on-hover')
  const inline = spec('icon-inline')

  const pad = ghost ? 'px-0 py-0' : 'px-6 py-3'
  const border = dim ? 'border-muted-4' : 'border-muted-3'
  const bg = spec('bg-card') ? 'bg-level-1' : ''
  const place = cn(
    spec('content-left') ? 'items-start' : 'items-center',
    spec('content-top') && 'justify-start',
    contentClassName,
  )

  const Header = ({ inContent = false, className: cls }: { inContent?: boolean; className?: string }) =>
    card.title || card.byline || card.icon ? (
      <CardHeader {...sx(cn('text-accent', dim && 'text-muted-2', pad, ghost && 'border-0', cls))}>
        <Box className={inline || inContent ? 'flex flex-row justify-start items-end my-3' : ''}>
          {card.icon && !card.iconAfter && (
            <Box className={inline ? 'mr-1' : 'mb-2'}>{card.icon}</Box>
          )}
          {card.title && (
            <CardTitle
              {...sx(cn(
                'text-center text-lg font-medium',
                spec('heading-style-title') && 'font-heading text-base leading-tight',
                ghost && 'text-left md:text-xl',
                inline && 'md:text-xl',
              ))}
            >
              {card.title}
            </CardTitle>
          )}
          {card.icon && card.iconAfter && (
            <Box className={inline ? 'ml-1' : 'my-1'}>{card.icon}</Box>
          )}
        </Box>
        {card.byline && <CardDescription>{card.byline}</CardDescription>}
      </CardHeader>
    ) : null

  const prose = (content: React.ReactNode) =>
    typeof content === 'string' ? <Box tag="p">{content}</Box> : content

  const Body = ({ className: cls }: { className?: string }) =>
    spec('media-left') ? (
      <CardContent
        {...sx(cn('flex flex-row justify-start items-stretch p-0 grow', border, bg, place, cls))}
      >
        {card.media && (
          <Box
            className={cn('box-content grow-0', pad)}
            // This layout assumes the media is a video with an `sm` size — it
            // is the width that decides the split, so it has to be known here.
            style={{ width: (card.media as VideoBlock).dim?.sm?.w }}
          >
            <VideoBlockComponent
              block={card.media}
              usePoster={spec('video-use-poster')}
              size="sm"
              agent={agent}
              className={dim ? 'opacity-60' : ''}
            />
          </Box>
        )}
        {card.content && (
          <ApplyTypography
            className={cn('grow border-l flex flex-col justify-center', pad, border, place)}
            size={rung(card.specifiers)}
          >
            {prose(card.content)}
          </ApplyTypography>
        )}
      </CardContent>
    ) : (
      <CardContent
        {...sx(cn(
          'grow flex flex-col justify-center',
          bg,
          pad,
          place,
          spec('full-width') && 'p-0',
          cls,
        ))}
      >
        {hover && <Header inContent />}
        {card.content && spec('content-before') && prose(card.content)}
        {card.media &&
          (card.media.blockType === 'image' ? (
            <ImageBlockComponent block={card.media} agent={agent} />
          ) : (
            <VideoBlockComponent block={card.media} agent={agent} />
          ))}
        {card.content && !spec('content-before') && prose(card.content)}
      </CardContent>
    )

  const Foot = () =>
    !card.cta ? null : spec('links-w-arrow') ? (
      <CardFooter {...sx(cn('flex flex-col justify-start items-stretch', pad))}>
        <CTABlockComponent
          block={card.cta}
          agent={agent}
          renderLink={(def, key) => <LinkOut def={def} key={key} />}
        />
      </CardFooter>
    ) : (
      <CardFooter {...sx(cn('grid grid-cols-1 gap-2 md:flex md:flex-row md:justify-center', pad))}>
        <CTABlockComponent block={card.cta} agent={agent} />
      </CardFooter>
    )

  return (
    <Card
      {...sx(cn(
        'flex flex-col self-stretch',
        hover && 'group relative',
        border,
        (spec('no-outer-border') || ghost) && 'border-0',
        bg,
        ghost && 'gap-2',
        className,
      ))}
    >
      <Header className={hover ? 'absolute top-0 left-0 w-full hidden' : ''} />
      <Body
        className={
          hover
            ? 'items-start justify-start rounded-lg p-4 transition-opacity duration-500 ease-out opacity-100'
            : ''
        }
      />
      <Foot />
    </Card>
  )
}

export default CardBlockComponent
