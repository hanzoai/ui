'use client'

/**
 * TooltipAnchor — a hint on one element, in one prop.
 *
 * The Tooltip primitive is a triple: root, trigger, content. That shape is
 * right when the hint is rich, and it is three levels of nesting when the hint
 * is a sentence — which is nearly always. Measured on a real surface, 48 call
 * sites wanted the same thing: wrap this control, say this string on hover.
 * So say it in one prop.
 *
 *   <TooltipAnchor description="Delete this agent">
 *     <Button icon={<Trash />} />
 *   </TooltipAnchor>
 *
 * `description` is a STRING, deliberately. A tooltip is an accessible name for
 * a control that has none, so it is also spelled onto the child as
 * `aria-label` — which markup cannot be. A hint that needs layout is not a
 * tooltip; reach for the triple, or a HoverCard.
 *
 * An empty or absent `description` renders the child alone, with no wrapper and
 * no listeners: a disabled hint costs nothing and needs no branch at the call
 * site.
 */
import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'

import { Tooltip, TooltipContent, TooltipTrigger } from '../backends/gui/tooltip'

export type TooltipSide = 'top' | 'right' | 'bottom' | 'left'

export type TooltipAnchorProps = {
  /** The hint. Empty or absent renders the child untouched. */
  description?: string
  children: ReactNode
  /** Which edge the hint sits on. Defaults to `top`. */
  side?: TooltipSide
  /** Delay before it opens, in ms. */
  delayMs?: number
  /**
   * By default the hint also becomes the child's `aria-label`, because the
   * control it labels usually has no text of its own. Turn this off when the
   * child already names itself and the hint only elaborates — two names on one
   * control is worse than none.
   */
  label?: boolean
}

export function TooltipAnchor({
  description,
  children,
  side = 'top',
  delayMs,
  label = true,
}: TooltipAnchorProps) {
  if (!description) return <>{children}</>

  const child =
    label && isValidElement(children) && !(children.props as { 'aria-label'?: string })['aria-label']
      ? cloneElement(children as ReactElement<{ 'aria-label'?: string }>, { 'aria-label': description })
      : children

  return (
    <Tooltip placement={side} {...(delayMs === undefined ? {} : { delay: delayMs })}>
      <TooltipTrigger asChild>{child}</TooltipTrigger>
      <TooltipContent>{description}</TooltipContent>
    </Tooltip>
  )
}
