import { useLoader } from 'one'

import { Group } from '~/features/group'
import { LOCALES } from '~/i18n/locale'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export async function loader() {
  const { overview, sections } = await import('~/catalog')
  return { ...overview('catalog'), sections: sections() }
}

export default function Page() {
  return <Group {...useLoader(loader)} />
}
