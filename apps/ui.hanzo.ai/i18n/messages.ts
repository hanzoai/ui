/**
 * Docs chrome, keyed by the English on the page. Merged over `@hanzo/ui`'s
 * catalogs, so a string the library already translates (Search, Menu, Chat)
 * does not need a second copy. A missing key renders in English.
 */
import type { SiteLocale } from './locale'

import ar from './messages/ar.json'
import de from './messages/de.json'
import es from './messages/es.json'
import fr from './messages/fr.json'
import hi from './messages/hi.json'
import id from './messages/id.json'
import it from './messages/it.json'
import ja from './messages/ja.json'
import ko from './messages/ko.json'
import ptBR from './messages/pt-BR.json'
import ru from './messages/ru.json'
import th from './messages/th.json'
import tr from './messages/tr.json'
import vi from './messages/vi.json'
import zhCN from './messages/zh-CN.json'
import zhTW from './messages/zh-TW.json'

const asMap = (value: object) => value as Record<string, string>

const ALL: Record<SiteLocale, Record<string, string>> = {
  es: asMap(es), fr: asMap(fr), de: asMap(de), it: asMap(it), 'pt-BR': asMap(ptBR),
  ru: asMap(ru), tr: asMap(tr), ar: asMap(ar), hi: asMap(hi), id: asMap(id),
  vi: asMap(vi), th: asMap(th), ja: asMap(ja), ko: asMap(ko),
  'zh-CN': asMap(zhCN), 'zh-TW': asMap(zhTW),
}

export function docsMessages(locale: string | null | undefined): Record<string, string> | undefined {
  if (!locale || locale === 'en') return undefined
  return ALL[locale as SiteLocale]
}
