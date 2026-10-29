import { LOCALES } from '~/i18n/locale'

export { default, loader } from '../../chat'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}
