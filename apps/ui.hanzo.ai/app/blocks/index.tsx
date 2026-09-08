import { useLoader } from 'one'

import { Group } from '~/features/group'

export async function loader() {
  const { overview, sections } = await import('~/catalog')
  return { ...overview('blocks'), sections: sections() }
}

export default function Page() {
  return <Group {...useLoader(loader)} />
}
