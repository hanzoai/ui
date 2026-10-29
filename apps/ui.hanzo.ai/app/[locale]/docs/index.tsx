import { useLoader } from 'one'

import { Page } from '~/features/page'
import { LOCALES } from '~/i18n/locale'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export async function loader({ params }: { params: { locale: string } }) {
  const { doc } = await import('~/mdx')
  return doc('index', params.locale)
}

export default function Route() {
  return <Page {...useLoader(loader)} />
}
