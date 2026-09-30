'use client'

/**
 * The blocks a feature page is made of, in the order a page uses them:
 *
 *   PageHeader   the page's <h1> and one line under it
 *   Section      a band with its own <h2>, one measure wide
 *   FeatureGrid  a row of Features, as many as fit
 *   Feature      a title and a sentence, optionally a link and an icon
 *   Steps        the order things happen in
 *   Quote        what a customer said, and who
 *   LogoRow      who else is here
 *
 * Every one takes CONTENT and draws it from tokens. None takes a class name or
 * reads one, so a page made of them is themed by @hanzo/appearance alone.
 */
import { Anchor, Image, XStack, YStack } from '@hanzo/gui'
import type { ReactNode } from 'react'

import { slot } from '../backends/gui/slot'
import { Grid } from '../grid'
import { Line } from './type'

const GUTTER = '$6'
const TIGHT = { letterSpacing: '-0.012em', textWrap: 'balance' } as const

export type PageHeaderProps = {
  title: ReactNode
  lede?: ReactNode
  /** A line above the title: the product's name, the section it belongs to. */
  eyebrow?: string
  /** Buttons under the lede. */
  actions?: ReactNode
}

const PageHeader = ({ title, lede, eyebrow, actions }: PageHeaderProps) => (
  <YStack
    {...slot('page-header')}
    render="header"
    width="100%"
    maxW={860}
    mx="auto"
    items="center"
    gap="$4"
    px={GUTTER}
    pt={88}
    pb={32}
    $md={{ pt: 120, pb: 48 }}
  >
    {eyebrow ? (
      <Line size="sm" tone="soft" weight="600" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {eyebrow}
      </Line>
    ) : null}
    <Line render="h1" m={0} align="center" fontFamily="$heading" fontSize="$10" lineHeight="$10" fontWeight={500} $md={{ fontSize: '$12', lineHeight: '$12' }} style={TIGHT}>
      {title}
    </Line>
    {lede ? (
      <Line render="p" m={0} align="center" tone="muted" fontSize="$6" lineHeight="$6" maxW={640} $md={{ fontSize: '$7', lineHeight: '$7' }}>
        {lede}
      </Line>
    ) : null}
    {actions ? (
      <XStack flexWrap="wrap" justify="center" gap="$4" pt="$2">
        {actions}
      </XStack>
    ) : null}
  </YStack>
)

export type SectionProps = { title?: string; lede?: ReactNode; children: ReactNode; measure?: number }

const Section = ({ title, lede, children, measure = 1080 }: SectionProps) => (
  <YStack
    {...slot('section')}
    render="section"
    width="100%"
    maxW={measure}
    mx="auto"
    gap="$6"
    px={GUTTER}
    py={32}
    $md={{ py: 64 }}
  >
    {title ? (
      <YStack gap="$3" items="center">
        <Line render="h2" m={0} align="center" fontFamily="$heading" fontSize="$8" lineHeight="$8" fontWeight={500} $md={{ fontSize: '$10', lineHeight: '$10' }} style={TIGHT}>
          {title}
        </Line>
        {lede ? (
          <Line render="p" m={0} align="center" tone="muted" size="lg" maxW={620}>
            {lede}
          </Line>
        ) : null}
      </YStack>
    ) : null}
    {children}
  </YStack>
)

export type FeatureProps = { title: string; children: ReactNode; icon?: ReactNode; href?: string; linkLabel?: string }

const Feature = ({ title, children, icon, href, linkLabel = 'Learn more' }: FeatureProps) => (
  <YStack
    {...slot('feature')}
    render="article"
    height="100%"
    gap="$3"
    p="$5"
    rounded="var(--radius-xl)"
    borderWidth={1}
    borderColor="$edge"
    bg="$panel"
  >
    {icon ? (
      <YStack aria-hidden width={32} height={32} items="center" justify="center">
        {icon}
      </YStack>
    ) : null}
    <Line render="h3" m={0} size="xl" weight="600">
      {title}
    </Line>
    <Line render="p" m={0} tone="muted" lineHeight="$5">
      {children}
    </Line>
    {href ? (
      <Anchor href={href} color="$ink" fontSize="$3" fontWeight="500" textDecorationLine="underline" mt="auto" pt="$2">
        {linkLabel}
      </Anchor>
    ) : null}
  </YStack>
)

const FeatureGrid = ({ children, min = 260 }: { children: ReactNode; min?: number }) => (
  <Grid columns={{ min, max: 3 }} gap={20}>
    {children}
  </Grid>
)

export type Step = { title: string; body: ReactNode }

const Steps = ({ steps }: { steps: readonly Step[] }) => (
  <YStack {...slot('steps')} render="ol" m={0} p={0} gap="$5" style={{ listStyle: 'none' }}>
    {steps.map((s, i) => (
      <XStack render="li" key={s.title} gap="$4" items="flex-start">
        <XStack
          shrink={0}
          width={32}
          height={32}
          rounded={9999}
          borderWidth={1}
          borderColor="$bound"
          items="center"
          justify="center"
          aria-hidden
        >
          <Line size="sm" weight="600">
            {i + 1}
          </Line>
        </XStack>
        <YStack flex={1} minW={0} gap="$1">
          <Line render="h3" m={0} size="lg" weight="600">
            {s.title}
          </Line>
          <Line render="div" tone="muted" lineHeight="$5">
            {s.body}
          </Line>
        </YStack>
      </XStack>
    ))}
  </YStack>
)

export type QuoteProps = { quote: ReactNode; name: string; role?: string }

const Quote = ({ quote, name, role }: QuoteProps) => (
  <YStack {...slot('quote')} render="figure" m={0} maxW={720} mx="auto" gap="$4" items="center" px={GUTTER}>
    <Line render="blockquote" m={0} align="center" fontSize="$7" lineHeight="$7" fontWeight={500} $md={{ fontSize: '$8', lineHeight: '$8' }}>
      {quote}
    </Line>
    <YStack render="figcaption" items="center">
      <Line render="cite" size="base" weight="600" fontStyle="normal">
        {name}
      </Line>
      {role ? (
        <Line size="sm" tone="soft">
          {role}
        </Line>
      ) : null}
    </YStack>
  </YStack>
)

export type Logo = { name: string; src?: string; href?: string }

const LogoRow = ({ logos, label }: { logos: readonly Logo[]; label?: string }) => (
  <YStack {...slot('logo-row')} width="100%" items="center" gap="$4" px={GUTTER} py="$6">
    {label ? (
      <Line size="sm" tone="soft" align="center">
        {label}
      </Line>
    ) : null}
    <XStack flexWrap="wrap" items="center" justify="center" gap="$8">
      {logos.map((l) => {
        const mark = l.src ? (
          <Image src={l.src} alt={l.name} height={28} width="auto" style={{ opacity: 0.8 }} />
        ) : (
          <Line size="lg" weight="600" tone="muted">
            {l.name}
          </Line>
        )
        return l.href ? (
          <Anchor key={l.name} href={l.href} aria-label={l.name} textDecorationLine="none">
            {mark}
          </Anchor>
        ) : (
          <XStack key={l.name}>{mark}</XStack>
        )
      })}
    </XStack>
  </YStack>
)

export { PageHeader, Section, Feature, FeatureGrid, Steps, Quote, LogoRow }
