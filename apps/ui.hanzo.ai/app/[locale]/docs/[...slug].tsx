import type { LoaderProps } from 'one'
import { useLoader } from 'one'

import { Page } from '~/features/page'
import { LOCALES } from '~/i18n/locale'

export async function generateStaticParams() {
  const { slugs } = await import('~/catalog')
  return LOCALES.flatMap((locale) =>
    slugs()
      .filter((slug) => slug !== 'index')
      .map((slug) => ({ locale, slug: slug.split('/') })),
  )
}

export async function loader({ params }: LoaderProps<{ locale: string; slug: string | string[] }>) {
  const { doc } = await import('~/mdx')
  return doc([params.slug].flat().join('/'), params.locale)
}

export default function Route() {
  return <Page {...useLoader(loader)} />
}
