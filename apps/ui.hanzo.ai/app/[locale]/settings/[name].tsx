import { LOCALES } from '~/i18n/locale'

export { default, loader } from '../../settings/[name]'

export async function generateStaticParams() {
  const base = await import('../../settings/[name]')
  const rows = await base.generateStaticParams()
  return LOCALES.flatMap((locale) => rows.map((row: { name: string }) => ({ locale, ...row })))
}
