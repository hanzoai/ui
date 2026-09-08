import { useLoader } from 'one'

import { Page } from '~/features/page'

export async function loader() {
  const { doc } = await import('~/mdx')
  return doc('index')
}

export default function Route() {
  return <Page {...useLoader(loader)} />
}
