'use client'

/**
 * Toaster — the toast viewport, mounted once near the root of an app.
 *
 * gui already owns the whole thing: `@hanzogui/toast/v2` ships a sonner-shaped
 * `toast()` observer and a `Toaster` that portals a themed, swipe-dismissable
 * stack on web, native and desktop. So this is a prop translation, not a
 * reimplementation.
 *
 * `className`, `style` and the per-part `classNames` are accepted and ignored:
 * gui paints from theme tokens (`$background`, `$color`, `$borderColor`), the one
 * styling channel that also exists on native. They stay in the type so existing
 * call sites keep compiling.
 */
import type { GuiElement } from '@hanzogui/core'
import {
  Toaster as GuiToaster,
  toast,
  type ExternalToast,
  type ToasterProps as GuiToasterProps,
} from '@hanzogui/toast/v2'
import { forwardRef } from 'react'

/** Sonner's per-part class hooks. Inert — see the note above. */
export type ToasterClassNames = Partial<
  Record<
    | 'toast'
    | 'title'
    | 'description'
    | 'icon'
    | 'actionButton'
    | 'cancelButton'
    | 'closeButton',
    string
  >
>

export interface ToasterProps extends Omit<GuiToasterProps, 'toastOptions'> {
  /** Inert. gui themes the viewport from tokens. */
  className?: string
  /** Inert. gui themes the viewport from tokens. */
  style?: Record<string, string | number>
  toastOptions?: ExternalToast & { classNames?: ToasterClassNames }
}

const Toaster = /* @__PURE__ */ forwardRef<GuiElement, ToasterProps>(function Toaster(props, ref) {
  const { theme = 'system', toastOptions, ...rest } = props
  return <GuiToaster ref={ref} theme={theme} toastOptions={toastOptions} {...rest} />
})

export { Toaster, toast }
