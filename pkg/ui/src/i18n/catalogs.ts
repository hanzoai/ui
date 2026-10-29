/**
 * One catalog per locale the library ships, imported statically so the first
 * render — a server render included — already has the wording. English is the
 * source and has no file: `translate` returns the key.
 *
 * Keys are `@hanzo/i18n`'s negotiated tags (`es` → `es-ES`, `zh-CN` → `zh-Hans`).
 * A tag with no file here still resolves, and every missing key falls back to
 * English.
 */
import type { Messages } from './source'

import ar from './catalogs/ar.json'
import deDE from './catalogs/de-DE.json'
import esES from './catalogs/es-ES.json'
import frFR from './catalogs/fr-FR.json'
import hiIN from './catalogs/hi-IN.json'
import idID from './catalogs/id-ID.json'
import itIT from './catalogs/it-IT.json'
import jaJP from './catalogs/ja-JP.json'
import koKR from './catalogs/ko-KR.json'
import ptBR from './catalogs/pt-BR.json'
import ru from './catalogs/ru.json'
import th from './catalogs/th.json'
import tr from './catalogs/tr.json'
import vi from './catalogs/vi.json'
import zhHans from './catalogs/zh-Hans.json'
import zhHant from './catalogs/zh-Hant.json'

const asMessages = (value: object): Messages => value as Messages

export const CATALOGS: Readonly<Record<string, Messages>> = {
  ar: asMessages(ar),
  'de-DE': asMessages(deDE),
  'es-ES': asMessages(esES),
  'fr-FR': asMessages(frFR),
  'hi-IN': asMessages(hiIN),
  'id-ID': asMessages(idID),
  'it-IT': asMessages(itIT),
  'ja-JP': asMessages(jaJP),
  'ko-KR': asMessages(koKR),
  'pt-BR': asMessages(ptBR),
  ru: asMessages(ru),
  th: asMessages(th),
  tr: asMessages(tr),
  vi: asMessages(vi),
  'zh-Hans': asMessages(zhHans),
  'zh-Hant': asMessages(zhHant),
}

/** The catalog for a negotiated tag, or none (English). */
export const catalogFor = (code: string): Messages => CATALOGS[code] ?? {}
