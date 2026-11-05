import type { LoaderProps } from 'one'
import { useLoader } from 'one'
import type { ComponentType } from 'react'

import { Module } from '~/features/module'
import { LOCALES } from '~/i18n/locale'

export async function generateStaticParams() {
  const { entries } = await import('~/catalog')
  const rows = entries('agents').map((e) => ({ name: e.name }))
  return LOCALES.flatMap((locale) => rows.map((row) => ({ locale, ...row })))
}

export async function loader({ params }: LoaderProps<{ locale: string; name: string }>) {
  const { page } = await import('~/catalog')
  return page('agents', params.name)
}

const modules = import.meta.glob('../../../examples/agents/*.tsx', { eager: true }) as Record<string, Record<string, ComponentType>>

export default function Page() {
  const doc = useLoader(loader)
  return <Module doc={doc} examples={modules[`../../../examples/agents/${doc.name}.tsx`] ?? {}} />
}
