import type { LoaderProps } from 'one'
import { useLoader } from 'one'
import type { ComponentType } from 'react'

import { Module } from '~/features/module'

export async function generateStaticParams() {
  const { entries } = await import('~/catalog')
  return entries('blocks').map((e) => ({ name: e.name }))
}

export async function loader({ params }: LoaderProps<{ name: string }>) {
  const { page } = await import('~/catalog')
  return page('blocks', params.name)
}

// Every example module, so the page for a module can render the functions its
// loader read the source of. Eager: the export is rendered on the server too.
const modules = import.meta.glob('../../examples/blocks/*.tsx', { eager: true }) as Record<string, Record<string, ComponentType>>

export default function Page() {
  const doc = useLoader(loader)
  return <Module doc={doc} examples={modules[`../../examples/blocks/${doc.name}.tsx`] ?? {}} />
}
