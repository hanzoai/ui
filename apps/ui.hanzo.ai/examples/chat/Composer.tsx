import { useState } from 'react'
import { XStack, YStack } from '@hanzo/gui'
import { Mic, Plus } from '@hanzogui/lucide-icons-2'
import { Composer, ComposerTool } from '@hanzo/ui/chat'
import { BranchSelect, ChipSelect, RepoSelect } from '@hanzo/ui/product'

/** The stacked composer — a field over a toolbar, the send control at the end of it. */
export function Stacked() {
  const [draft, setDraft] = useState('')
  return <Composer value={draft} onChange={setDraft} onSend={() => setDraft('')} hint="Enter to send" />
}

/** One line, with the context above and the controls below — a coding composer. */
export function Coding() {
  const [draft, setDraft] = useState('')
  const [repo, setRepo] = useState({ owner: 'hanzo-inc', name: 'cloud' })
  const [branch, setBranch] = useState('main')
  return (
    <YStack width="100%" maxW={768} pt={260}>
      <Composer
        inline
        value={draft}
        onChange={setDraft}
        onSend={() => setDraft('')}
        placeholder="Describe a task or ask a question"
        head={
          <>
            <ChipSelect name="Environment" label="Default" onChange={() => {}} items={[{ id: 'd', label: 'Default' }]} />
            <RepoSelect value={repo} onChange={setRepo} load={async () => ({ repos: [repo] })} />
            <BranchSelect value={branch} onChange={setBranch} load={async () => ({ branches: ['main', 'dev'] })} />
          </>
        }
        foot={
          <>
            <ComposerTool label="Attach" icon={<Plus size={14} />} />
            <ComposerTool label="Voice" icon={<Mic size={14} />} />
            <ComposerTool label="Mode" text="Build" caret />
            <XStack flex={1} />
            <ChipSelect name="Model" label="Zen 5" onChange={() => {}} items={[{ id: 'z', label: 'Zen 5' }]} quiet />
          </>
        }
      />
    </YStack>
  )
}

/** Busy — the send mark becomes Stop while a turn is in flight. */
export function Busy() {
  return <Composer inline value="" busy onChange={() => {}} onSend={() => {}} onStop={() => {}} />
}
