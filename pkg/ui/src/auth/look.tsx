'use client'

import type { ComponentProps, ReactNode } from 'react'
import { YStack } from '../backends/gui/layout'

/**
 * The look every Hanzo sign-in shares: the card and the rules its controls are
 * drawn by. The shared panel (./SignInPanel.tsx) is drawn on it, and so is
 * hanzo.ai's own sign-in (hanzo-inc/app components/auth/steps.tsx `Sheet`, which
 * keeps its own steps: the code, the password, the phone, the second factor).
 * Both read these rules, so a front page and the page it hands off to cannot
 * drift apart.
 *
 * The rules are hanzo.app's front-page sign-in (hanzo-inc/app steps.tsx
 * `HERO_STYLE`): 46px controls with 14px corners, the providers side by side,
 * one solid control. They are carried as one stylesheet scoped to the card
 * (`data-signin`), set raw, so the host imports none. They read design's custom
 * properties (`--popover`, `--border`, `--border-strong`, `--foreground`,
 * `--muted-foreground`) with gui's theme keys behind them, so a host without
 * design's sheet still draws it.
 *
 * What a host draws inside reads them by attribute:
 *
 *   [data-signin-body]   the column the controls stand in
 *   [data-signin-pair]   the providers, side by side (stacked under 380px of room)
 *   [data-signin-btn]    a control; with [data-solid], the one solid control
 *   [data-signin-or]     the word between the providers and the address
 *   [data-signin-form]   a form in the column
 *   [data-signin-field]  a plain address field
 *   [data-signin-wrong]  what went wrong; [data-signin-quiet] a quiet line
 *   [data-signin-terms]  the terms line
 *
 * and this library's own controls set in the card take the same box without
 * being marked: an Input or an InputGroup is the field (its padding stays its
 * own, so a password's eye keeps its well), and an Action is the control, the
 * filled one the solid control.
 *
 * The card is a solid ground inside a hairline, since a front page draws it over
 * a busy backdrop. It is the site's to colour (`background`, `borderColor`: a
 * theme token or any CSS colour), and `bare` drops it for a host that sets the
 * sign-in in a card of its own, or on a quiet page. Inside the card the controls
 * keep a 400px measure, so the card is 464px wide.
 */
export interface SignInCardProps extends Omit<ComponentProps<typeof YStack>, 'bg' | 'background' | 'borderColor'> {
  /** The card's ground: a theme token (`$panel`) or any CSS colour. Default `$background`, solid. */
  background?: Paint
  /** The card's hairline: a theme token or any CSS colour. Default `$borderColor`. */
  borderColor?: Paint
  /** No card: the controls alone, 400px wide at most. */
  bare?: boolean
  /** The `data-slot` a host finds the card by. Default `signin-panel`. */
  slot?: string
  children?: ReactNode
}

/** A colour the card takes, as the stack it is drawn on takes one. */
type Paint = ComponentProps<typeof YStack>['bg']

const AT = '[data-signin]'
const FILL = 'var(--popover,var(--panel))'
const EDGE = 'var(--border,var(--edge))'
const STRONG = 'var(--border-strong,var(--bound))'
const INK = 'var(--foreground,var(--ink))'
const MUTE = 'var(--muted-foreground,var(--quiet))'
const FONT = 'var(--font-sans,Zen,system-ui,sans-serif)'
const LIFT = 'transform .2s cubic-bezier(.16,1,.3,1),border-color .2s,background-color .2s,opacity .2s'

/**
 * Weight enough to outrank gui's atomic classes on this library's own controls,
 * its per-theme ones included (`:root:root.t_light ._bxsh-…`, a filled Action's
 * light shadow): an id's weight, matching every element (none is `#_`).
 */
const OVER = ':not(#_)'
/**
 * This library's Action, wherever it is set in the card. Its corners are stated
 * `!important` too: a host may hold every Action round with an `!important` rule
 * of its own (hanzo-inc/app app/layout.tsx `[data-slot="action"]`), and inside
 * the card this scoped, weightier rule is the one that stands.
 */
const ACTION = `:is(button,a)[data-slot="action"]${OVER}`
/** This library's Input, alone; inside an InputGroup the group is the box. */
const INPUT = `input[data-slot="input"]:not([data-slot="input-group"] *)${OVER}`
const GROUP = `[data-slot="input-group"]${OVER}`

/** Every rule the sign-in's controls are drawn by, scoped to the card. */
export const SIGNIN_STYLE =
  `${AT} [data-signin-body]{container-type:inline-size;display:flex;flex-direction:column;gap:10px;width:100%}` +
  // Equal halves no label can widen: a bare `1fr` keeps its label's width as
  // its floor, and "Continue with Google" would push the pair past the field.
  `${AT} [data-signin-pair]{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;width:100%}` +
  `${AT} [data-signin-pair]>:last-child:nth-child(odd){grid-column:1/-1}` +
  `@container (max-width:379.98px){${AT} [data-signin-pair]{grid-template-columns:minmax(0,1fr)}}` +
  `${AT} [data-signin-btn]{box-sizing:border-box;display:flex;align-items:center;justify-content:center;gap:9px;width:100%;height:46px;margin:0;padding:0 14px;border-radius:14px;border:1px solid ${EDGE};background:${FILL};color:${INK};font-family:${FONT};font-size:14px;font-weight:500;line-height:1;white-space:nowrap;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,.04);transition:${LIFT}}` +
  `${AT} ${ACTION}{box-sizing:border-box;height:46px;min-height:46px;padding:0 14px;gap:9px;border-radius:14px!important;border:1px solid ${EDGE};background:${FILL};color:${INK};font-family:${FONT};font-size:14px;font-weight:500;line-height:1;box-shadow:0 1px 2px rgba(0,0,0,.04);backdrop-filter:none;-webkit-backdrop-filter:none;transition:${LIFT}}` +
  `${AT} [data-signin-btn]:hover:not(:disabled),${AT} ${ACTION}:hover:not(:disabled){border-color:${STRONG};transform:translateY(-2px)}` +
  `${AT} [data-signin-btn]:active:not(:disabled),${AT} ${ACTION}:active:not(:disabled){transform:scale(.98)}` +
  `${AT} [data-signin-btn]:disabled,${AT} ${ACTION}:disabled{opacity:.55;cursor:not-allowed}` +
  `${AT} [data-signin-btn][data-solid],${AT} ${ACTION}[data-fill]{background:${INK};color:var(--background);border-color:${INK}}` +
  `${AT} [data-signin-btn][data-solid]:hover:not(:disabled),${AT} ${ACTION}[data-fill]:hover:not(:disabled){background:${INK};color:var(--background);border-color:${INK};opacity:.92;transform:none}` +
  `${AT} [data-signin-btn] svg{flex-shrink:0}` +
  `${AT} [data-signin-or]{display:flex;align-items:center;gap:12px;font-size:12.5px;color:${MUTE}}` +
  `${AT} [data-signin-or]::before,${AT} [data-signin-or]::after{content:'';flex:1;height:1px;background:${EDGE}}` +
  `${AT} [data-signin-form]{display:flex;flex-direction:column;gap:10px;margin:0}` +
  `${AT} [data-signin-field]{box-sizing:border-box;width:100%;height:46px;margin:0;padding:0 16px;border-radius:14px;border:1px solid ${EDGE};background-color:${FILL};color:${INK};font-family:${FONT};font-size:14px;outline:none}` +
  `${AT} ${INPUT}{height:46px;border-radius:14px;font-size:14px;background-color:${FILL}}` +
  `${AT} ${INPUT}:not([aria-invalid="true"]){border-color:${EDGE}}` +
  `${AT} ${GROUP}{border-radius:14px;background-color:${FILL}}` +
  `${AT} ${GROUP}:not([data-focused]):not([data-invalid]){border-color:${EDGE}}` +
  `${AT} [data-signin-field]::placeholder{color:${MUTE}}` +
  `${AT} [data-signin-field]:focus-visible,${AT} ${INPUT}:not([aria-invalid="true"]):focus-visible{border-color:${STRONG};box-shadow:0 0 0 2px var(--ring,${STRONG})}` +
  `${AT} ${GROUP}[data-focused]:not([data-invalid]){border-color:${STRONG}}` +
  `${AT} [data-signin-wrong]{margin:0;font-size:13px;color:var(--destructive,#e5484d)}` +
  `${AT} [data-signin-quiet]{margin:0;font-size:13px;color:${MUTE}}` +
  `${AT} [data-signin-quiet] button{padding:0;border:0;background:none;color:${INK};font:inherit;cursor:pointer}` +
  `${AT} [data-signin-quiet] button:hover:not(:disabled){text-decoration:underline}` +
  `${AT} [data-signin-terms]{margin:0;max-width:400px;text-align:center;font-size:12px;line-height:18px;color:${MUTE}}` +
  `${AT} [data-signin-terms] a{color:${INK};text-decoration:none}` +
  `${AT} [data-signin-terms] a:hover{text-decoration:underline;text-underline-offset:2px}`

/** The card a sign-in is drawn in, carrying the rules its controls are drawn by. */
export function SignInCard({ background = '$background', borderColor = '$borderColor', bare = false, slot = 'signin-panel', children, ...rest }: SignInCardProps) {
  const card = bare ? {} : ({ bg: background, borderWidth: 1, borderColor, rounded: '$6', p: '$6' } as const)
  return (
    <YStack data-signin="" data-slot={slot} data-surface={bare ? 'bare' : 'card'} width="100%" maxW={bare ? 400 : 464} items="center" gap="$3" {...card} {...rest}>
      {/* Raw: a server render would escape the rules' quotes as text. */}
      <style dangerouslySetInnerHTML={{ __html: SIGNIN_STYLE }} />
      {children}
    </YStack>
  )
}
