import { useState } from 'react'
import { YStack } from '@hanzo/gui'
import { Composer } from '@hanzo/ui/chat'
import { BranchSelect, ChipSelect, RepoSelect } from '@hanzo/ui/product'

/** The stacked composer — a field over a toolbar, the send control at the end of it. */
export function Stacked() {
  const [draft, setDraft] = useState('')
  return <Composer value={draft} onChange={setDraft} onSend={() => setDraft('')} hint="Enter to send" />
}

/** With context pills under the frame — a coding composer. */
export function Coding() {
  const [draft, setDraft] = useState('')
  const [repo, setRepo] = useState({ owner: 'hanzo-inc', name: 'cloud' })
  const [branch, setBranch] = useState('main')
  return (
    <YStack width="100%" maxW={768} pt={260}>
      <Composer
        value={draft}
        onChange={setDraft}
        onSend={() => setDraft('')}
        placeholder="Describe a task or ask a question"
        pills={
          <>
            <ChipSelect name="Environment" label="Default" onChange={() => {}} items={[{ id: 'd', label: 'Default' }]} />
            <RepoSelect value={repo} onChange={setRepo} load={async () => ({ repos: [repo] })} />
            <BranchSelect value={branch} onChange={setBranch} load={async () => ({ branches: ['main', 'dev'] })} />
          </>
        }
      />
    </YStack>
  )
}

/** Busy — the send mark becomes Stop while a turn is in flight. */
export function Busy() {
  return <Composer value="" busy onChange={() => {}} onSend={() => {}} onStop={() => {}} />
}
