'use client'

/**
 * The three controls a marketing page closes a thought with, one set:
 *
 *   Action  the button — chrome glass, or `fill` for the one loud control
 *   Chip    a word in an outline: a badge, a tag, a filter
 *   More    the quiet link — "View all →", "See full pricing ↗"
 *
 * Each is a gui Text, so it carries its own type and draws its own box: the
 * label and any icon beside it inherit the ink, and nothing reaches in from a
 * stylesheet. White space is the parent's, so a control inside a line that
 * clips with an ellipsis stays on that line. An `href` makes it a link: an internal one goes through the app's
 * router link (@hanzo/ui's `Link` context, set once at the root), any other is
 * an anchor. A control that does something passes `render="button"`.
 *
 * The ease between rest and hover is @hanzo/design's base, which grants every
 * `<a>` and `<button>` its colour, fill, edge and shadow transition, and the
 * pointer (or `not-allowed` on a disabled button); a control restates none of it.
 *
 * Both themes are props. On the light ground the dark glass would draw a grey
 * slab and the white fill would vanish into the page, so `$theme-light` turns
 * the quiet weight to white glass with a dark edge and the loud one to ink.
 */
import { Text, type TextProps } from '@hanzo/gui'

import { slot } from '../backends/gui/slot'
import { address, useHost } from './host'
import type { Host, Loose } from './loose'

export type ControlProps = Loose<Omit<TextProps, 'render' | 'children'>> &
  Host & {
    render?: TextProps['render']
  }

const BOX = {
  display: 'inline-flex',
  items: 'center',
  whiteSpace: 'inherit',
  textDecorationLine: 'none',
} as const

/** A rung that carries its own leading: naming the size alone leaves the line
 *  box to whatever an ancestor sets. */
const SMALL = { fontSize: '$2', lineHeight: 'calc(1.25 / 0.875)' as never } as const

type Style = Record<string, unknown>

/**
 * A caller's own value holds in every state, the way a value stated on the
 * element always has: a key the caller passes is dropped from the hover and from
 * the light theme, so `color` on a chip stays that colour under the pointer and
 * on the light ground. A caller's own `hoverStyle` or `$theme-light` replaces
 * the default whole.
 */
const states = (p: Style, hover: Style, light: Style) => {
  const own = (s: Style) => Object.fromEntries(Object.entries(s).filter(([k]) => !(k in p)))
  const { hoverStyle: lightHover, ...lightRest } = light as Style & { hoverStyle?: Style }
  return {
    ...(p.hoverStyle === undefined ? { hoverStyle: own(hover) } : null),
    ...(p['$theme-light'] === undefined
      ? { '$theme-light': { ...own(lightRest), ...(lightHover && p.hoverStyle === undefined ? { hoverStyle: own(lightHover) } : null) } }
      : null),
  }
}

/** The quiet weight is chrome glass; `fill` drops the border outright rather
 *  than making it transparent, which would leave the loud control 2px wider
 *  than the quiet one beside it. 44px is the thumb floor, not a style. */
const Action = ({ render, fill = false, ...p }: ControlProps & { fill?: boolean }) => {
  const host = useHost(render, p.href, 'a')
  return (
    <Text
      {...slot('action')}
      {...(fill ? { 'data-fill': '' } : null)}
      render={host}
      {...BOX}
      {...SMALL}
      justify="center"
      gap="$2"
      minH={44}
      px="$5"
      rounded={9999}
      fontWeight="500"
      backdropFilter="var(--chrome-blur)"
      {...((fill
        ? {
            borderWidth: 0,
            bg: 'var(--pure-white)',
            color: 'var(--pure-black)',
            boxShadow: '0 4px 20px -2px var(--white-22), 0 2px 8px 0 color-mix(in srgb, var(--pure-black) 40%, transparent)',
            ...states(
              p,
              { opacity: 0.92, bg: 'var(--neutral-100)', color: 'var(--pure-black)' },
              {
                bg: 'var(--foreground)',
                color: 'var(--background)',
                boxShadow: '0 4px 16px -6px color-mix(in srgb, var(--pure-black) 40%, transparent)',
                hoverStyle: { bg: 'var(--foreground)', color: 'var(--background)' },
              },
            ),
          }
        : {
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: 'var(--white-14)',
            bg: 'color-mix(in srgb, var(--neutral-900) 65%, transparent)',
            color: 'var(--foreground)',
            boxShadow: 'inset 0 1px 0 0 var(--white-14), 0 4px 16px -2px color-mix(in srgb, var(--pure-black) 30%, transparent)',
            ...states(
              p,
              { bg: 'color-mix(in srgb, var(--neutral-800) 80%, transparent)', borderColor: 'var(--white-22)', color: 'var(--pure-white)' },
              {
                borderColor: 'color-mix(in srgb, var(--pure-black) 14%, transparent)',
                bg: 'color-mix(in srgb, var(--pure-white) 72%, transparent)',
                color: 'var(--foreground)',
                boxShadow: '0 2px 10px -4px color-mix(in srgb, var(--pure-black) 18%, transparent)',
                hoverStyle: { borderColor: 'color-mix(in srgb, var(--pure-black) 26%, transparent)', bg: 'var(--pure-white)', color: 'var(--foreground)' },
              },
            ),
          }) as object)}
      {...(p as object)}
    />
  )
}

/** A word in an outline. Not an action — no fill, no weight — so the padding is
 *  the caller's: a chip and a badge are the same outline at two sizes. It
 *  brightens on approach only when it is a link. */
const Chip = ({ render, ...p }: ControlProps) => {
  const host = useHost(render, p.href, 'span')
  const link = address(host, p.href)
  return (
    <Text
      {...slot('chip')}
      render={host}
      {...BOX}
      {...SMALL}
      gap="$2"
      borderWidth={1}
      borderStyle="solid"
      borderColor="var(--white-08)"
      rounded={9999}
      color="var(--neutral-300)"
      bg="var(--white-03)"
      {...states(
        p,
        link ? { borderColor: 'var(--white-20)', color: 'var(--pure-white)' } : {},
        {
          borderColor: 'var(--border)',
          bg: 'var(--glass)',
          color: 'var(--muted-foreground)',
          ...(link ? { hoverStyle: { borderColor: 'var(--border-strong)', color: 'var(--foreground)' } } : null),
        },
      )}
      {...(p as object)}
    />
  )
}

/** The quiet link. The hover is the reason it is a component rather than a
 *  colour at the call site. */
const More = ({ render, ...p }: ControlProps) => {
  const host = useHost(render, p.href, 'a')
  return (
    <Text
      {...slot('more')}
      render={host}
      {...BOX}
      {...SMALL}
      gap="$2"
      fontWeight="500"
      color="var(--neutral-300)"
      {...states(p, { color: 'var(--pure-white)' }, { color: 'var(--muted-foreground)', hoverStyle: { color: 'var(--foreground)' } })}
      {...(p as object)}
    />
  )
}

export { Action, Chip, More }
