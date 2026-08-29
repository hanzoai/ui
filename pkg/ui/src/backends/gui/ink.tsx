'use client'
import { SizableText } from '@hanzo/gui'
import { Children, createElement, type ComponentType, type ReactNode } from 'react'

/**
 * Bare text needs a Text host to render on native; elements pass through.
 * Every component in this backend that accepts free-form children runs them
 * through here, so a string child behaves identically on web and native.
 */
export const ink = (
  children: ReactNode,
  Wrap: ComponentType<Record<string, unknown>> = SizableText as never,
  props: Record<string, unknown> = {},
) =>
  Children.map(children, (child) =>
    typeof child === 'string' || typeof child === 'number'
      ? createElement(Wrap, props, child)
      : child,
  )
