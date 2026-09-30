'use client'

/**
 * Hero — the first screen: the promise and the way in on the left, the product
 * at work on the right.
 *
 * Two columns from 1021px up; below that they stack, the pitch first. The pitch
 * is centred in its column, so the headline, the sign-in and the download read
 * as one stack.
 *
 *   signIn    a slot. The sign-in belongs to the site's identity provider; this
 *             draws where it goes and never what is in it.
 *   media     a slot for the right column: a <Media> loop, or anything with a
 *             shape. It sits in a rounded card whose ratio is fixed from the
 *             first paint (`ratio`, and `ratioCompact` once stacked), so it
 *             never moves the page when it loads.
 *   download  a secondary link under the sign-in.
 *
 * The headline is the page's one <h1>.
 */
import { YStack } from '@hanzo/gui'
import { useEffect, type ReactNode } from 'react'

import { slot } from '../backends/gui/slot'
import { Cta } from './Cta'
import { Line } from './type'

export type HeroProps = {
  title: ReactNode
  subtitle?: ReactNode
  signIn?: ReactNode
  /** The line under the sign-in: terms, privacy. */
  terms?: ReactNode
  download?: { href: string; label: string }
  media?: ReactNode
  /** Width over height of the media card at full width. */
  ratio?: number
  /** …and once the columns stack. */
  ratioCompact?: number
  /** Called once, when the hero mounts. */
  onView?: () => void
}

const Hero = ({
  title,
  subtitle,
  signIn,
  terms,
  download,
  media,
  ratio = 4 / 3,
  ratioCompact = 4 / 5,
  onView,
}: HeroProps) => {
  useEffect(() => {
    onView?.()
    // The view is counted once, whatever the host's callback identity does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <YStack
      {...slot('hero')}
      render="section"
      aria-labelledby="hero-title"
      width="100%"
      maxW={1320}
      mx="auto"
      flexDirection="row"
      items="center"
      gap={64}
      px="$6"
      pt={120}
      pb={72}
      $md={{ flexDirection: 'column', gap: 32, px: '$4', pt: 88, pb: 48 }}
    >
      <YStack
        {...slot('hero-copy')}
        flex={5}
        flexBasis={0}
        minW={0}
        width="100%"
        items="center"
        gap="$5"
        $md={{ flex: 0, flexBasis: 'auto' }}
      >
        <Line
          render="h1"
          id="hero-title"
          m={0}
          maxW={520}
          align="center"
          fontFamily="$heading"
          fontSize="$13"
          lineHeight="$13"
          fontWeight={500}
          $md={{ fontSize: '$11', lineHeight: '$11' }}
          style={{ letterSpacing: '-0.012em', textWrap: 'balance' }}
        >
          {title}
        </Line>
        {subtitle ? (
          <Line render="p" m={0} mt={-4} align="center" tone="muted" fontSize="$7" lineHeight="$7" $md={{ fontSize: '$6', lineHeight: '$6' }}>
            {subtitle}
          </Line>
        ) : null}
        {signIn ? (
          <YStack {...slot('hero-signin')} width="100%" maxW={420}>
            {signIn}
          </YStack>
        ) : null}
        {terms ? (
          <Line render="p" m={0} mt={-4} maxW={420} align="center" tone="muted" size="xs">
            {terms}
          </Line>
        ) : null}
        {download ? (
          <Cta quiet href={download.href}>
            {download.label}
          </Cta>
        ) : null}
      </YStack>

      {media ? (
        <YStack
          {...slot('hero-media')}
          flex={7}
          flexBasis={0}
          minW={0}
          width="100%"
          aspectRatio={ratio}
          overflow="hidden"
          rounded={28}
          borderWidth={1}
          borderColor="$edge"
          bg="$panel"
          $md={{ flex: 0, flexBasis: 'auto', aspectRatio: ratioCompact }}
        >
          {media}
        </YStack>
      ) : null}
    </YStack>
  )
}

export { Hero }
