import * as React from 'react'

import { ApplyTypography } from '../backends/gui/prose'
import { Box } from '../box'
import { cn } from '../core/cn'
import type { EnhHeadingBlock } from './def'
import { type BlockComponentProps, has } from './spec'

const DEFAULT = {
  preheading: { tag: 'h4' },
  heading: { tag: 'h1' },
  byline: { tag: 'h6' },
} as const

/**
 * The margin under a part, ONLY when the content asked for one.
 *
 * There used to be a default of `mb-2` here, which is 8px — and 8px is a
 * reasonable gap under a 15px line and far too little under a 52px one. Worse,
 * it was emitted always, so it outranked the proportional margin the prose
 * sheet sets per rung and every heading in the estate got the same 8px whatever
 * its size. Absent, the sheet decides; present, the content still wins.
 */
const gap = (mb: number | undefined) => (mb === undefined ? '' : `mb-${mb}`)

/** 0 is a paragraph; 1–6 are the heading tags. */
const tag = (level: number | undefined, fallback: string): string =>
  level === undefined ? fallback : level >= 1 && level <= 6 ? `h${level}` : 'p'

/** An icon given as a url is drawn at `size`; given as a node it renders as-is. */
const Mark = ({
  icon,
  size,
  phone,
}: {
  icon: React.ReactNode
  size: number
  phone: boolean
}) => {
  if (!icon) return null
  if (typeof icon === 'string') {
    const s = phone ? size * 0.75 : size
    return <Box tag="img" src={icon} width={s} height={s} alt="" />
  }
  return <Box>{icon}</Box>
}

/**
 * Where the three parts sit.
 *
 * The byline is tracked separately from the heading because it aligns
 * independently — a centred heading over a left-aligned byline is a normal
 * layout, and one value could not express it.
 */
const place = (spec: (s: string) => boolean, phone: boolean) => {
  const centre = spec('center')
  const right = spec('right')

  const at = (c: boolean, r: boolean) =>
    c ? 'self-center text-center' : r ? 'self-end text-right' : 'self-start text-left'

  let heading = at(centre, right)
  let byline = at(spec('byline-center'), spec('byline-right'))

  if (phone) {
    if (spec('mobile-heading-left')) heading = 'self-start text-left'
    else heading = at(spec('mobile-heading-centered') || centre, right)
    if (spec('mobile-byline-left')) byline = 'self-start text-left'
  } else if (spec('mobile-heading-centered')) {
    // Centred on a phone, and whatever was asked for from `md` up.
    heading = `self-center text-center ${heading.split(' ').map((c) => `md:${c}`).join(' ')}`
  }

  return { heading, byline }
}

export const EnhHeadingBlockComponent = ({
  block,
  className,
  agent,
  applyTypography = true,
  extraSpecifiers = '',
}: BlockComponentProps & {
  applyTypography?: boolean
  extraSpecifiers?: string
}) => {
  if (block.blockType !== 'enh-heading') return <>enh-heading block required</>
  const b = block as EnhHeadingBlock

  const spec = (s: string) => has(`${b.specifiers ?? ''} ${extraSpecifiers}`.trim(), s)
  const phone = agent === 'phone'
  const at = place(spec, phone)
  const headFont = spec('preheading-heading-font') ? 'font-heading' : ''

  const parts = [
    b.preheading && {
      Tag: tag(b.preheading.level, DEFAULT.preheading.tag),
      cls: cn(gap(b.preheading.mb), at.heading, headFont),
      text: b.preheading.text,
    },
    {
      Tag: tag(b.heading.level, DEFAULT.heading.tag),
      cls: cn(gap(b.heading.mb), at.heading),
      text: b.heading.text,
    },
    b.byline && {
      Tag: tag(b.byline.level, DEFAULT.byline.tag),
      // The byline is running text whatever tag it is given. Content here sets
      // `level` as a SIZE — a byline arrives as an h6 — so a rule keyed on `p`
      // never reaches it, and the line ran to 75 characters. Bound by role.
      cls: cn(at.byline, 'max-w-[var(--measure)]'),
      text: b.byline.text,
    },
  ].filter(Boolean) as { Tag: string; cls: string; text: string }[]

  // The icon rides the FIRST part that renders, whichever that turns out to be.
  const inner = parts.map(({ Tag, cls, text }, i) =>
    b.icon && i === 0 ? (
      <Box className={cn('flex flex-row items-center gap-2 sm:gap-4', cls)} key={i}>
        <Mark icon={b.icon} size={b.iconSize ?? 32} phone={phone} />
        <Box tag={Tag as 'h1'}>{text}</Box>
      </Box>
    ) : (
      <Box tag={Tag as 'h1'} className={cls} key={i}>
        {text}
      </Box>
    ),
  )

  // `gap-0` because each part carries its own bottom margin — a gap on the
  // column would add to every one of them and double the spacing.
  const cls = cn('flex flex-col w-full gap-0', className, spec('align-middle') && 'my-auto')

  return applyTypography ? (
    <ApplyTypography className={cls}>{inner}</ApplyTypography>
  ) : (
    <Box className={cls}>{inner}</Box>
  )
}

export default EnhHeadingBlockComponent
