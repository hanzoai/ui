/**
 * English, for words built outside a component.
 *
 * A pure module that writes a reader's sentence — a limit notice, a builder's
 * validation, a record's fallback title — takes the component's `t` as an
 * argument; this is what it uses when called with none. It is @hanzo/i18n's own
 * fallback (`translate` over no catalog: the source, `{name}` filled), typed as
 * the `t` a component hands in. Data, never stamped `'use client'`
 * (scripts/postbuild.mjs), so a server component can call those modules.
 */
import { translate } from '@hanzo/i18n'
import type { Say } from '@hanzo/i18n/react'

export const english = ((source: string, values?: Readonly<Record<string, string | number>>) =>
  translate({}, source, values)) as Say
