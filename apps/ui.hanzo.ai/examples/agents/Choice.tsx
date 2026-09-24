import { useState } from 'react'
import { ModeSelect, PageSelect } from '@hanzo/ui/agents'

const MODES = [
  { id: 'build', label: 'Build', hint: 'Edits, commits and pushes' },
  { id: 'plan', label: 'Plan', hint: 'Plans without writing' },
]

/** Mode — the composer's chip; it opens upward because it sits at the bottom of the column. */
export function Mode() {
  const [mode, setMode] = useState('build')
  return <ModeSelect modes={MODES} value={mode} onChange={setMode} />
}

/** Page — the bar's wide field for the page the preview shows. */
export function Page() {
  const [page, setPage] = useState('/')
  return (
    <PageSelect
      pages={[
        { id: '/', label: 'Homepage' },
        { id: '/about', label: 'About' },
        { id: '/pricing', label: 'Pricing' },
      ]}
      value={page}
      onChange={setPage}
    />
  )
}
