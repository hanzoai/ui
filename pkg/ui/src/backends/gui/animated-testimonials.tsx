'use client'

/**
 * AnimatedTestimonials — one testimonial at a time in a card, advancing on a
 * timer and by pressing a dot below it.
 *
 * The card holds a real `<blockquote>`: the quote is its `<p>`, the author a
 * `<cite>` in its `<footer>`, so a reader announces it as a quotation.
 *
 * Mount is the animation: each testimonial gets a fresh `key`, so a change
 * remounts the card and `hz-fade-up` (styles/motion.css) plays. The outgoing
 * card unmounts with no exit.
 */
import { SizableText, XStack, YStack, styled } from '@hanzo/gui'
import * as React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from './avatar'
import { Card, CardContent } from './card'
import { touch } from './gesture'
import { slot } from './slot'

export type Testimonial = {
  id: string
  content: string
  author: string
  role?: string
  company?: string
  avatar?: string
}

const Frame = styled(YStack, {
  name: 'AnimatedTestimonials',
  position: 'relative',
  minH: 200,
  gap: '$4',
})

const Quote = styled(SizableText, {
  name: 'AnimatedTestimonialsQuote',
  size: '$5',
  fontStyle: 'italic',
})

/** A `<cite>` is italic by default; the author reads upright under the quote. */
const Author = styled(SizableText, {
  name: 'AnimatedTestimonialsAuthor',
  fontWeight: '500',
  fontStyle: 'normal',
})

const Meta = styled(SizableText, {
  name: 'AnimatedTestimonialsMeta',
  size: '$2',
  color: '$quiet',
})

/** A dot is 8px; `touch()` below meets the 44px floor without growing it. */
const DOT = 8

const Dot = styled(YStack, {
  name: 'AnimatedTestimonialsDot',
  height: DOT,
  rounded: 999,
  bg: '$edge',
  cursor: 'pointer',

  variants: {
    active: {
      true: { width: DOT * 4, bg: '$ink' },
      false: { width: DOT, hoverStyle: { bg: '$quiet' } },
    },
  } as const,

  defaultVariants: { active: false },
})

export type AnimatedTestimonialsProps = Omit<React.ComponentProps<typeof Frame>, 'children'> & {
  testimonials: Testimonial[]
  /** Advance on its own. Default true. */
  autoPlay?: boolean
  /** Milliseconds between slides. Default 5000. */
  duration?: number
}

export function AnimatedTestimonials({
  testimonials,
  autoPlay = true,
  duration = 5000,
  ...props
}: AnimatedTestimonialsProps) {
  const [activeIndex, setActiveIndex] = React.useState(0)

  React.useEffect(() => {
    if (!autoPlay || testimonials.length < 2) return
    const id = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length)
    }, duration)
    return () => clearInterval(id)
  }, [autoPlay, duration, testimonials.length])

  // One index for the card and the dots, so a list that shrank under the
  // current one never shows a card with no dot lit.
  const index = Math.min(activeIndex, testimonials.length - 1)
  const active = testimonials[index]

  return (
    <Frame {...slot('animated-testimonials')} {...props}>
      {active && (
        <Card key={active.id} className="hz-fade-up">
          <CardContent>
            <YStack render="blockquote" gap="$4">
              <Quote {...slot('animated-testimonials-quote')} render="p">
                &ldquo;{active.content}&rdquo;
              </Quote>
              <XStack render="footer" items="center" gap="$4">
                <Avatar>
                  <AvatarImage src={active.avatar} />
                  <AvatarFallback>{active.author.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <YStack>
                  <Author {...slot('animated-testimonials-author')} render="cite">
                    {active.author}
                  </Author>
                  {active.role && (
                    <Meta {...slot('animated-testimonials-meta')} render="p">
                      {active.role}
                      {active.company && `, ${active.company}`}
                    </Meta>
                  )}
                </YStack>
              </XStack>
            </YStack>
          </CardContent>
        </Card>
      )}

      <XStack {...slot('animated-testimonials-dots')} justify="center" gap="$2">
        {testimonials.map((t, i) => (
          <Dot
            key={t.id}
            {...slot('animated-testimonials-dot')}
            render={<button type="button" />}
            active={i === index}
            aria-label={`Go to testimonial ${i + 1}`}
            aria-current={i === index}
            style={{ transition: 'width .3s ease, background-color .3s ease' }}
            onPress={() => setActiveIndex(i)}
            {...touch(DOT, 44)}
          />
        ))}
      </XStack>
    </Frame>
  )
}
