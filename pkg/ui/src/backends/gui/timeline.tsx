'use client'

/**
 * Timeline — a sequence of dated events, one marker and one caption per event,
 * joined by a connecting line.
 *
 * `orientation` picks the axis (a vertical column or a horizontal scroller);
 * `variant` picks how a vertical row reads: a bordered card beside the line
 * (`default`), cards alternating left and right of a centered line
 * (`alternate`), one compact line per event (`compact`), or a plain left rule
 * with no card (`simple`). A marker's fill and glyph come from the event's
 * `status` — a check for `completed`, a clock for `active`, nothing (a bare
 * dot) for `pending` or unset — unless the event supplies its own `icon`.
 *
 * `animated` reveals each row with `hz-fade-up` (styles/motion.css) the first
 * time it scrolls into view, via one shared `IntersectionObserver`; once
 * revealed a row stays that way. Web only — there is nothing to observe
 * scrolling into on native, so there `animated` has no effect and every row
 * renders visible immediately.
 */
import {
  SizableText,
  XStack,
  YStack,
  isWeb,
  styled,
  type YStackProps,
} from '@hanzo/gui'
import { Check, Circle, Clock } from '@hanzogui/lucide-icons-2'
import * as React from 'react'
import { ink } from './ink'
import { slot } from './slot'

export type TimelineStatus = 'completed' | 'active' | 'pending'
export type TimelineOrientation = 'vertical' | 'horizontal'
export type TimelineVariant = 'default' | 'alternate' | 'compact' | 'simple'

export interface TimelineItem {
  id: string
  title: string
  description?: string
  date?: string
  time?: string
  status?: TimelineStatus
  icon?: React.ReactNode
  content?: React.ReactNode
}

export interface TimelineProps extends Omit<YStackProps, 'children' | 'items'> {
  items: TimelineItem[]
  orientation?: TimelineOrientation
  variant?: TimelineVariant
  /** Reveal rows as they scroll into view. Defaults to true. */
  animated?: boolean
}

/** A row is revealed once and stays that way — this never needs to un-see one. */
const useReveal = (ids: string[], animated: boolean) => {
  const [seen, setSeen] = React.useState<Set<string>>(() => new Set(animated ? [] : ids))
  const observer = React.useRef<IntersectionObserver | null>(null)

  React.useEffect(() => {
    if (!animated) setSeen(new Set(ids))
  }, [animated, ids])

  React.useEffect(() => {
    if (!animated || !isWeb || typeof IntersectionObserver === 'undefined') return
    observer.current = new IntersectionObserver(
      (entries) => {
        const arrived = entries
          .filter((e) => e.isIntersecting)
          .map((e) => (e.target as HTMLElement).dataset.timelineId)
          .filter((id): id is string => !!id)
        if (!arrived.length) return
        setSeen((prev) => new Set([...prev, ...arrived]))
      },
      { threshold: 0.1, rootMargin: '50px' },
    )
    const io = observer.current
    return () => io.disconnect()
  }, [animated])

  const register = React.useCallback(
    (el: Element | null) => {
      if (el) observer.current?.observe(el)
    },
    [],
  )

  return { seen, register }
}

type Reveal = (id: string) => {
  ref?: React.Ref<never>
  className?: string
  style?: { opacity: 0 }
}

const statusFill = {
  completed: { bg: '$green9', color: '$white1' },
  active: { bg: '$blue9', color: '$white1' },
  pending: { bg: '$gray5', color: '$quiet' },
} as const
const defaultFill = { bg: '$ink', color: '$sunken' } as const

const fillFor = (status?: TimelineStatus) => (status ? statusFill[status] : defaultFill)

type FillColor = ReturnType<typeof fillFor>['color']

const glyphFor = (status: TimelineStatus | undefined, size: number, color: FillColor) => {
  if (status === 'completed') return <Check size={size} color={color} />
  if (status === 'active') return <Clock size={size} color={color} />
  return <Circle size={size} color={color} />
}

const Marker = ({ item, size }: { item: TimelineItem; size: number }) => {
  const { bg, color } = fillFor(item.status)
  return (
    <XStack
      {...slot('timeline-marker')}
      data-status={item.status ?? 'default'}
      width={size}
      height={size}
      shrink={0}
      rounded={9999}
      items="center"
      justify="center"
      borderWidth={2}
      borderColor="$background"
      bg={bg}
      position="relative"
      z={1}
    >
      {item.icon ?? glyphFor(item.status, Math.round(size * 0.32), color)}
    </XStack>
  )
}

const Title = styled(SizableText, { name: 'TimelineTitle', fontWeight: '600' })
const Description = styled(SizableText, {
  name: 'TimelineDescription',
  size: '$2',
  color: '$quiet',
  mt: '$1',
})
const Meta = styled(SizableText, { name: 'TimelineMeta', size: '$1', color: '$quiet', mb: '$1' })
const CardFrame = styled(YStack, {
  name: 'TimelineCard',
  borderWidth: 1,
  borderColor: '$borderColor',
  rounded: '$4',
  bg: '$background',
  p: '$4',
})
const VLine = styled(YStack, { name: 'TimelineConnectorV', position: 'absolute', width: 2, bg: '$borderColor' })
const HLine = styled(XStack, { name: 'TimelineConnectorH', position: 'absolute', height: 2, bg: '$borderColor' })

const MetaLine = ({ item }: { item: TimelineItem }) => {
  const text = [item.date, item.time].filter(Boolean).join(' • ')
  return text ? <Meta {...slot('timeline-meta')}>{text}</Meta> : null
}

const Body = ({ item, align = 'left' }: { item: TimelineItem; align?: 'left' | 'right' | 'center' }) => (
  <YStack items={align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start'}>
    <MetaLine item={item} />
    <Title {...slot('timeline-title')}>{ink(item.title)}</Title>
    {item.description && <Description {...slot('timeline-description')}>{ink(item.description)}</Description>}
    {item.content && <YStack mt="$3">{item.content}</YStack>}
  </YStack>
)

type Layout = { items: TimelineItem[]; reveal: Reveal }

const Horizontal = ({ items, reveal }: Layout) => (
  <XStack overflow="scroll" pb="$4">
    <XStack items="flex-start" gap="$8">
      {items.map((item, i) => (
        <YStack
          key={item.id}
          data-timeline-id={item.id}
          {...reveal(item.id)}
          position="relative"
          items="center"
          minW={200}
        >
          {i < items.length - 1 && <HLine t={20} l="50%" width="calc(100% + 48px)" />}
          <Marker item={item} size={40} />
          <YStack mt="$4">
            <Body item={item} align="center" />
          </YStack>
        </YStack>
      ))}
    </XStack>
  </XStack>
)

const Default = ({ items, reveal }: Layout) => (
  <YStack gap="$8">
    {items.map((item, i) => (
      <XStack key={item.id} data-timeline-id={item.id} {...reveal(item.id)} position="relative" gap="$6">
        {i < items.length - 1 && <VLine l={20} t={40} b={-48} />}
        <Marker item={item} size={40} />
        <YStack flex={1}>
          <CardFrame>
            <Body item={item} />
          </CardFrame>
        </YStack>
      </XStack>
    ))}
  </YStack>
)

const Alternate = ({ items, reveal }: Layout) => (
  <YStack position="relative" gap="$8">
    <VLine l="50%" x={-1} t={0} b={0} />
    {items.map((item, i) => {
      const right = i % 2 === 1
      return (
        <XStack
          key={item.id}
          data-timeline-id={item.id}
          {...reveal(item.id)}
          justify={right ? 'flex-end' : 'flex-start'}
        >
          <YStack width="calc(50% - 2rem)" items={right ? 'flex-start' : 'flex-end'} gap="$2">
            <Marker item={item} size={40} />
            <CardFrame width="100%">
              <Body item={item} align={right ? 'left' : 'right'} />
            </CardFrame>
          </YStack>
        </XStack>
      )
    })}
  </YStack>
)

const Compact = ({ items, reveal }: Layout) => (
  <YStack gap="$1">
    {items.map((item) => (
      <XStack
        key={item.id}
        data-timeline-id={item.id}
        {...reveal(item.id)}
        items="center"
        gap="$4"
        p="$2"
        rounded="$4"
        hoverStyle={{ bg: '$hover' }}
      >
        <Marker item={item} size={24} />
        <XStack flex={1} items="baseline" justify="space-between" gap="$2">
          <XStack items="baseline" gap="$2">
            <Title {...slot('timeline-title')} size="$2">{ink(item.title)}</Title>
            {item.description && (
              <Description {...slot('timeline-description')} mt={0} size="$2">
                {ink(item.description)}
              </Description>
            )}
          </XStack>
          <MetaLine item={item} />
        </XStack>
      </XStack>
    ))}
  </YStack>
)

const Simple = ({ items, reveal }: Layout) => (
  <YStack borderLeftWidth={2} borderColor="$borderColor" pl="$6" gap="$6">
    {items.map((item) => (
      <YStack key={item.id} data-timeline-id={item.id} {...reveal(item.id)} position="relative">
        <XStack position="absolute" l={-28} t={2}>
          <Marker item={item} size={16} />
        </XStack>
        <Body item={item} />
      </YStack>
    ))}
  </YStack>
)

/** The shared `data-timeline-id` + reveal wiring, one call per row. */
const revealProps = (
  id: string,
  seen: Set<string>,
  register: (el: Element | null) => void,
  animated: boolean,
): ReturnType<Reveal> =>
  animated
    ? {
        ref: register as React.Ref<never>,
        className: seen.has(id) ? 'hz-fade-up' : undefined,
        style: seen.has(id) ? undefined : { opacity: 0 },
      }
    : {}

export const Timeline = ({
  items,
  orientation = 'vertical',
  variant = 'default',
  animated = true,
  ...props
}: TimelineProps) => {
  const ids = React.useMemo(() => items.map((item) => item.id), [items])
  const { seen, register } = useReveal(ids, animated)
  const reveal: Reveal = (id) => revealProps(id, seen, register, animated)

  return (
    <YStack
      {...slot('timeline')}
      data-orientation={orientation}
      data-variant={variant}
      data-animated={animated}
      position="relative"
      {...props}
    >
      {orientation === 'horizontal' ? (
        <Horizontal items={items} reveal={reveal} />
      ) : variant === 'alternate' ? (
        <Alternate items={items} reveal={reveal} />
      ) : variant === 'compact' ? (
        <Compact items={items} reveal={reveal} />
      ) : variant === 'simple' ? (
        <Simple items={items} reveal={reveal} />
      ) : (
        <Default items={items} reveal={reveal} />
      )}
    </YStack>
  )
}
