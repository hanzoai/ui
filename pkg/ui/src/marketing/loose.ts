import type { MouseEventHandler, ReactNode, Ref } from 'react'

/**
 * The props a marketing component takes from a page.
 *
 * gui types a style value against its token table, and a page's own values are
 * CSS: `var(--text-xs)`, `color-mix(in srgb, var(--primary) 15%, transparent)`,
 * a unitless leading. gui emits each of them exactly as written, so refusing
 * them at the type only pushed callers back to `style={{…}}`, which is the
 * thing these components exist to retire. A value prop also takes a string or a
 * number, and a state or a breakpoint (`hoverStyle`, `$sm`, `$theme-light`)
 * takes the same values inside it.
 *
 * `Host` is what the element underneath answers to on the web: a button's
 * `type`, a link's `download`, a tooltip's `title`. gui forwards every prop it
 * does not style to the DOM node, so these already arrive; they are declared
 * so a call site does not have to re-declare the component to pass one.
 */
export type Loose<P> = {
  [K in keyof P]?: K extends 'children' | 'render'
    ? P[K]
    : K extends `$${string}` | 'hoverStyle' | 'pressStyle' | 'focusStyle' | 'focusVisibleStyle' | 'focusWithinStyle' | 'disabledStyle' | 'enterStyle' | 'exitStyle'
      ? { [key: string]: unknown }
      : NonNullable<P[K]> extends object
        ? P[K]
        : P[K] | (string & {}) | number
}

export type Host = {
  children?: ReactNode
  href?: string
  target?: string
  rel?: string
  download?: boolean | string
  type?: 'button' | 'submit' | 'reset'
  title?: string
  name?: string
  value?: string
  disabled?: boolean
  tabIndex?: number
  onClick?: MouseEventHandler<HTMLElement>
  /** The node is whatever `render` names, so the ref takes any element. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ref?: Ref<any>
  textWrap?: 'wrap' | 'nowrap' | 'balance' | 'pretty' | 'stable'
  WebkitBackdropFilter?: string
}
