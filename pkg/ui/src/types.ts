// @hanzo/ui/types — the content vocabulary the block renderers read.
//
// These are the shapes a SITE authors: a grid, a link, an image, a video. They
// carry no behaviour and import no component, so content can be written, typed
// and tested without pulling a renderer in.
//
// Flat on purpose. The 5.x line spread these across ten files that each exported
// one type as `default`, so a consumer wanting three of them wrote three imports
// of a name the file did not state. One module, named exports, one import.
//
// The two that referenced Tailwind are the reason this could not simply be
// copied: `Breakpoint` was `keyof typeof` a tailwind screens config (under a
// blanket @ts-nocheck), and `LinkDef` reached `VariantProps<typeof
// buttonVariants>` from class-variance-authority. Both now name what they
// actually mean, and neither pulls an engine.

import type { ReactNode } from 'react'
import type { ButtonProps, ButtonSize, ButtonVariant } from './backends/gui/button'

// ── Viewport ────────────────────────────────────────────────────────────────

/**
 * The responsive vocabulary, and the SAME one `tw()` maps class prefixes onto
 * (`md:` → the `$md` gui media prop). A second list would be a second answer to
 * "what is medium".
 *
 * `xs` is here and has no prefix in `tw()`: it is the base rung, which content
 * authored on 5.x names explicitly in `GridDef.at` and `SpaceBlock.sizes`.
 */
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

export const Breakpoints: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl']

// ── Measure ─────────────────────────────────────────────────────────────────

export interface Dimensions {
  w: number
  h: number
}

export type TShirtSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/** A size per rung, `md` required — the one every consumer can fall back to. */
export type TShirtDimensions = { [k in Exclude<TShirtSize, 'md'>]?: Dimensions } & {
  md: Dimensions
}

// ── Grid ────────────────────────────────────────────────────────────────────

/** Columns alone, or columns with the gap between them. */
export type GridColumnSpec = number | { columns: number; gap: number }

export interface GridDef {
  /** Must be given in ASCENDING order. */
  at: { [k in Breakpoint]?: GridColumnSpec }
  mobile?: GridColumnSpec
}

const grid = (md: number, lg: number): GridDef => ({
  at: {
    xs: { columns: 1, gap: 2 },
    md: { columns: md, gap: 3 },
    lg: { columns: lg, gap: 6 },
  },
  mobile: { columns: 1, gap: 2 },
})

// One column on a phone in every case; the name says where it lands on a desk.
export const COMMON_GRID_1_COL = grid(1, 1)
export const COMMON_GRID_2_COL = grid(2, 2)
export const COMMON_GRID_3_COL = grid(3, 3)
export const COMMON_GRID_4_COL = grid(2, 4)

// ── Media ───────────────────────────────────────────────────────────────────

/** @see https://nextjs.org/docs/app/api-reference/components/image */
export interface ImageDef {
  /** Image url. */
  src: string
  /** Defaults to the short filename. */
  alt?: string
  sizes?: string
  /**
   * A colour class for an svg. Every `fill` in the file must be
   * `currentColor` for it to have any effect.
   */
  svgFillClass?: string
  /**
   * Rendered dimensions, unless a style prop overrides them — in which case
   * give the file's own resolution so both the server and the browser can work
   * out the aspect ratio before the bytes arrive.
   */
  dim: Dimensions
  rounded?: string
}

export interface VideoDef {
  /**
   * Passed through to `<video>`. Valueless HTML attributes are booleans here,
   * and React's camelCase spelling is the one that reaches the element
   * (`playsinline` → `playsInline`):
   *
   *   videoProps: { autoPlay: true, loop: true, muted: true, playsInline: true }
   */
  videoProps?: Record<string, unknown>
  poster?: string
  sources?: string[]
  dim: TShirtDimensions
  /** e.g. `{ vh: 60, mobile: { vw: 70 } }` */
  sizing?: Record<string, unknown>
}

/**
 * A url to an animation document, played in place of a still.
 *
 * A url and not a record: that is what the content in this estate holds
 * (`ActualLineItem.animation?: string` is the only concrete declaration of it),
 * and a richer shape would be a type describing data nobody writes. Named for
 * what it is so the field reads the same as its neighbours.
 */
export type AnimationDef = string

/**
 * How a stack's media sits inside the box it was given.
 *
 * `scale` is a fraction of the constraint, not a CSS transform: a product shot
 * that fills its frame and a swatch that should read as small are the same
 * image at two sizes, and the content says which. Content in this estate
 * authors `scale` and nothing else; the offsets are here because a scaled image
 * that is not centred has no other way to say so.
 */
export interface MediaTransform {
  scale?: number
  offsetX?: number
  offsetY?: number
}

/**
 * One subject, in whatever media the content happens to have for it.
 *
 * The renderer picks in order — animation, then video, then image — so a family
 * can gain a video later without every consumer learning about it. Everything
 * is optional because a stack with nothing in it is a real state (an item whose
 * art has not landed yet) and must type, not throw.
 */
export interface MediaStackDef {
  animation?: AnimationDef
  video?: VideoDef
  img?: ImageDef
  mediaTransform?: MediaTransform
}

// ── Link and button ─────────────────────────────────────────────────────────

export interface BulletItem {
  text: string
  /** An icon is any node, so a string is a legal icon. */
  icon?: ReactNode
}

/**
 * A link that renders with a button's clothes.
 *
 * `variant` and `size` were `VariantProps<typeof buttonVariants>` — a type
 * class-variance-authority derives from a style table. Naming the two unions
 * directly says the same thing, is readable at the call site, and drops a
 * Tailwind-ecosystem dependency from a file that holds no styles.
 */
export interface LinkDef {
  variant?: ButtonVariant | null
  size?: ButtonSize | null
  /** Ignored when the element is rendered directly WITH children. */
  title?: string
  /** Ignored when the element is rendered directly WITH children. */
  icon?: ReactNode
  /** Ignored when the element is rendered directly WITH children. */
  iconAfter?: boolean
  href: string
  /**
   * External links open in a new tab, internal ones in the same tab.
   * `newTab` overrides both. ('external' means the url starts with `http`.)
   */
  newTab?: boolean
  /** Renders disabled: default cursor, and pointer events stop here. */
  disabled?: boolean
  contents?: string
  childMenu?: LinkDef[]
  groupName?: string
}

export type SubmitServerAction = (data: unknown, enclosure?: unknown) => Promise<unknown>

export interface ButtonModalProps {
  open: boolean
  onOpenChange: (b: boolean) => void
  buttonText: string
  buttonProps: ButtonProps
  title: string
  byline?: string
  action: SubmitServerAction
  actionEnclosure?: unknown
}

export interface ButtonModalDef {
  Comp: React.ComponentType<ButtonModalProps>
  title: string
  props?: Record<string, unknown>
  byline?: string
  action?: SubmitServerAction
  actionEnclosure?: unknown
}

export interface ButtonDef {
  text: string
  props: ButtonProps
  action: {
    type: 'modal'
    def: ButtonModalDef
  }
}
