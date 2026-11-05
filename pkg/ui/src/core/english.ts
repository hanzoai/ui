/**
 * English, for words built outside a component.
 *
 * A pure module that writes a reader's sentence — a limit notice, a builder's
 * validation, a record's fallback title — takes the component's `t` as an
 * argument; this is what it uses when called with none: the source with its
 * `{name}` arguments filled, and one with no value left visible, which is what
 * @hanzo/i18n's `translate` does over no catalog.
 *
 * Written here rather than imported because `@hanzo/ui/product/pure` depends on
 * nothing (dist.test.ts holds it), and the limit notices it carries call this.
 * The type alone comes from @hanzo/i18n, and a type import is erased. Data,
 * never stamped `'use client'` (scripts/postbuild.mjs), so a server component
 * can call the modules that use it.
 */
import type { Say } from '@hanzo/i18n/react'

export const english = ((source: string, values: Readonly<Record<string, string | number>> = {}) =>
  source.replace(/\{(\w+)\}/g, (slot: string, name: string) =>
    Object.hasOwn(values, name) ? String(values[name]) : slot,
  )) as Say
