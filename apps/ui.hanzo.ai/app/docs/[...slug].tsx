import type { LoaderProps } from 'one'
import { useLoader } from 'one'

import { Page } from '~/features/page'

export async function generateStaticParams() {
  const { slugs } = await import('~/catalog')
  return slugs()
    .filter((s) => s !== 'index')
    .map((slug) => ({ slug }))
}

export async function loader({ params }: LoaderProps<{ slug: string | string[] }>) {
  const { doc } = await import('~/mdx')
  return doc([params.slug].flat().join('/'))
}

export default function Route() {
  return <Page {...useLoader(loader)} />
}
