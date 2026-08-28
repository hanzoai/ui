import { XStack, YStack } from '@hanzo/gui'
import * as React from 'react'

import { Card, CardContent, CardFooter, CardHeader } from '../backends/gui/card'
import { Box } from '../box'
import { cn } from '../core/cn'
import type { CarteBlancheBlock } from './def'
import { Content } from './content'
import { CTABlockComponent } from './cta'
import { EnhHeadingBlockComponent } from './enh-heading'
import { type BlockComponentProps, has, sx } from './spec'

/** The roomy padding `big-padding` asks for. Default is the card's own. */
const ROOMY = 'md:p-8 lg:p-12 xl:p-16'

/**
 * A panel with a free hand: anything above the heading, anything below it, and
 * a call to action at the foot.
 *
 * `variant-content-left` turns the stack on its side — the top content moves
 * beside the heading and body rather than above them — and
 * `variant-mobile-content-left` asks for that on a phone only, which is why the
 * choice is made here rather than in css.
 */
export const CarteBlancheBlockComponent = ({
  block,
  className,
  agent,
}: BlockComponentProps) => {
  if (block.blockType !== 'carte-blanche') return <>carte-blanche block required</>
  const b = block as CarteBlancheBlock
  const spec = (s: string) => has(b.specifiers, s)

  const head = cn(spec('big-padding') && ROOMY, spec('no-inner-borders') && 'border-none')
  const body = cn(spec('big-padding-content') && ROOMY)
  const foot = cn(spec('no-inner-borders') && 'border-t-0')

  const Heading = () =>
    b.heading ? (
      <CardHeader {...sx(head)}>
        <EnhHeadingBlockComponent block={b.heading} className="text-accent" agent={agent} />
      </CardHeader>
    ) : null

  const Body = () =>
    b.content ? (
      <CardContent {...sx(cn('flex flex-col justify-center', body, className))}>
        <Content blocks={b.content} agent={agent} />
      </CardContent>
    ) : null

  const Foot = ({ className: cls }: { className?: string }) =>
    b.cta ? (
      <CardFooter
        {...sx(cn('grid grid-cols-1 gap-2 md:flex md:flex-row md:justify-center', foot, cls))}
      >
        <CTABlockComponent block={b.cta} agent={agent} />
      </CardFooter>
    ) : null

  const sideways = spec('variant-content-left') || (spec('variant-mobile-content-left') && agent === 'phone')

  return (
    <Card {...sx(cn('flex flex-col', className, spec('no-outer-borders') && 'border-none'))}>
      {sideways ? (
        <>
          <XStack gap={8}>
            {b.topContent && (
              <Content blocks={b.topContent} agent={agent} className="self-center ml-6 mt-6" />
            )}
            <YStack>
              <Heading />
              {b.content && (
                <CardContent {...sx(cn('flex flex-col justify-start', body, className))}>
                  <Content blocks={b.content} agent={agent} />
                </CardContent>
              )}
            </YStack>
          </XStack>
          <Foot className="mx-auto" />
        </>
      ) : (
        <>
          {(b.heading || b.topContent) && (
            <CardHeader {...sx(head)}>
              {b.topContent && <Content blocks={b.topContent} agent={agent} />}
              {b.heading && (
                <EnhHeadingBlockComponent block={b.heading} className="text-accent" agent={agent} />
              )}
            </CardHeader>
          )}
          <Body />
          <Foot />
        </>
      )}
    </Card>
  )
}

export default CarteBlancheBlockComponent
