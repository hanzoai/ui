import { LOCALES } from '~/i18n/locale'

export { default, loader } from '../../catalog/[name]'

export async function generateStaticParams() {
  const base = await import('../../catalog/[name]')
  const rows = await base.generateStaticParams()
  return LOCALES.flatMap((locale) => rows.map((row: { name: string }) => ({ locale, ...row })))
}
