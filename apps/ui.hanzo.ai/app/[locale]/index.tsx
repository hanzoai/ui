import { LOCALES } from '~/i18n/locale'

export { default, loader } from '../index'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}
