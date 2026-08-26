// The block vocabulary — what a site AUTHORS, with no renderer attached.
//
// A block is data: `blockType` picks the renderer, and the rest of the fields
// are that renderer's input. So a page is a `Block[]` that can be written in a
// CMS, checked into a repo, or produced by a server, and typed either way.
//
// Every `specifiers` field is a space-separated bag of layout hints read by the
// matching component. It is deliberately a string rather than a union: a site
// adds a hint by typing one, and an unrecognised hint is ignored rather than
// failing the build.
//
// Flat, for the reason given in ../types: the 5.x line spread these over
// sixteen files exporting `default`, so the imported name was never the name the
// file declared.

import type { ReactNode } from 'react'

import type {
  Breakpoint,
  BulletItem,
  ButtonDef,
  GridDef,
  ImageDef,
  LinkDef,
  VideoDef,
} from '../types'

/** Every block is at least this: a tag naming which renderer reads the rest. */
export interface Block {
  blockType: string
}

// ── Leaves ──────────────────────────────────────────────────────────────────

export interface ElementBlock extends Block {
  blockType: 'element'
  element: ReactNode
}

export interface HeadingBlock extends Block {
  blockType: 'heading'
  heading: string
  byline?: string
  level?: number
  bylineLevel?: number
  spaceBetween?: number
  spaceAfter?: number
}

/**
 * A heading with the parts named — an optional pre-heading above it and a byline
 * below, each with its own level and bottom margin.
 *
 * `level` is the heading tag: 1 renders `<h1>`, 0 renders `<p>`.
 * `mb` is bottom margin in spacing units (4 → 1rem), applied only when the
 * element BELOW it is present — so a heading with no byline carries no trailing
 * space.
 */
export interface EnhHeadingBlock extends Block {
  blockType: 'enh-heading'
  specifiers?: string
  /** A node, or a url string to an asset. */
  icon?: ReactNode
  /** Sizes the icon when it is given as a url. */
  iconSize?: number
  preheading?: { text: string; level?: number; mb?: number }
  heading: { text: string; level?: number; mb?: number }
  byline?: { text: string; level?: number }
}

export interface ImageBlock extends Block, ImageDef {
  blockType: 'image'
  /**
   * `left` (default) / `right` / `center` (needs a column parent).
   * `mobile-no-scale` — by default an image scales to 3/4 height below `md`.
   * `mobile-full-width` — overrides dim and fills the width, keeping the ratio.
   */
  specifiers?: string
  /** @deprecated Use `mobile-full-width` in specifiers. */
  fullWidthOnMobile?: boolean
  props?: {
    sizes?: string
    /** When true, alignment specifiers are ignored. */
    fill?: boolean
    style?: React.CSSProperties
  }
}

export interface VideoBlock extends VideoDef {
  blockType: 'video'
}

export type SpaceUnit = number
export type HeadingLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6

export const SPACE_DEFAULTS = {
  xs: 2,
  sm: 4,
  md: 5,
  lg: 6,
  xl: 8,
} satisfies { [k in Breakpoint]?: SpaceUnit }

export interface SpaceBlock extends Block {
  blockType: 'space'
  /**
   * Vertical space in spacing units, per rung and merged over SPACE_DEFAULTS —
   * or one number to use at every rung.
   */
  sizes?: { [k in Breakpoint]?: SpaceUnit } | SpaceUnit
  /**
   * The space the matching heading tag WOULD occupy, as `<ApplyTypography>`
   * renders it, plus any gap. 0 is 1rem. Default 3.
   */
  level?: HeadingLevel
  test?: boolean
}

// ── Containers ──────────────────────────────────────────────────────────────

export interface GroupBlock extends Block {
  blockType: 'group'
  specifiers?: string
  elements: Block[]
}

export interface GridBlock extends Block {
  blockType: 'grid'
  specifiers?: string
  grid: GridDef
  /** Ignored when children are passed to the component instead. */
  cells?: Block[]
}

export interface AccordianBlock extends Block {
  blockType: 'accordian'
  items: { trigger: string; content: ReactNode }[]
}

export interface BulletCardsBlock extends Block {
  blockType: 'bullet-cards'
  /** `no-card-border` · `mobile-small-text` · `borders-muted-1|3` (default 2). */
  specifiers?: string
  grid: GridDef
  cards: BulletItem[]
  /** In px. */
  iconSize?: number
}

/**
 * A call to action: a row of links and buttons.
 *
 * `fill` — the elements fill the parent width.
 * `left` / `right` — justify at `md` and up (centred otherwise).
 * `mobile-2-columns` — two columns on a phone instead of one per line.
 * `mobile-center-first-if-odd` — with an odd count, centre the last one.
 * `mobile-odd-full-width` — the centred one fills both columns.
 */
export interface CTABlock extends Block {
  blockType: 'cta'
  specifiers?: string
  elements: (LinkDef | ButtonDef)[]
}

export interface CardBlock extends Block {
  blockType: 'card'
  /** e.g. `media-left`, `appear-disabled`, `no-borders` — combinable. */
  specifiers?: string
  title?: string
  byline?: string
  /** For the title area. */
  icon?: ReactNode
  iconAfter?: boolean
  media?: ImageBlock | VideoBlock
  content?: ReactNode
  cta?: CTABlock
}

/**
 * A free-form panel: anything above, a heading, anything below, a call to
 * action at the foot.
 *
 * `big-padding` · `no-outer-borders` · `no-internal-borders` ·
 * `style-ghost` (all three at once, and no padding).
 */
export interface CarteBlancheBlock extends Block {
  blockType: 'carte-blanche'
  specifiers?: string
  topContent?: Block[]
  heading?: EnhHeadingBlock
  content?: Block[]
  cta?: CTABlock
}

/**
 * One screenful: an optional banner over one to three columns of content.
 *
 * A `VideoBlock` banner renders its poster on the server and lazy-loads the
 * `<video>` on the client, playing once 75% of it is in view.
 */
export interface ScreenfulBlock extends Block {
  blockType: 'screenful'
  /** An image url, or a video. */
  banner?: string | VideoBlock
  /** Layout hints for the block as a whole. */
  specifiers?: string
  /** Layout hints for the matching column. */
  columnSpecifiers?: string[]
  /**
   * The order columns appear in once stacked on a phone, overriding their
   * written order — e.g. `[1, 0, 2]` puts the second of three on top.
   */
  mobileOrder?: number[]
  /** Content per column. More than three is allowed but rarely readable. */
  contentColumns: Block[][]
  footer?: ReactNode
  /** For linking to this screenful. */
  anchorId?: string
}
