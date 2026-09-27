import { useState } from 'react'
import { XStack } from '@hanzo/gui'
import { Mic, Plus } from '@hanzogui/lucide-icons-2'
import { Composer, ComposerTool, Home } from '@hanzo/ui/chat'
import { ChipSelect, HanzoMark } from '@hanzo/ui/product'

/** A fresh pane — the mark and the question centred, the composer and its chips under it in the same column. */
export function Default() {
  const [draft, setDraft] = useState('')
  return (
    <XStack height={440} width="100%">
      <Home mark={<HanzoMark size={26} />}>
        <Composer
          inline
          value={draft}
          onChange={setDraft}
          onSend={() => setDraft('')}
          placeholder="Describe a task or ask a question"
          head={<ChipSelect name="Environment" label="Cloud" onChange={() => {}} items={[{ id: 'c', label: 'Cloud' }]} />}
          foot={
            <>
              <ComposerTool label="Attach" icon={<Plus size={14} />} />
              <ComposerTool label="Voice" icon={<Mic size={14} />} />
              <XStack flex={1} />
              <ChipSelect name="Model" label="Enso" onChange={() => {}} items={[{ id: 'e', label: 'Enso' }]} quiet />
            </>
          }
        />
      </Home>
    </XStack>
  )
}

/** A person's own question — the host says who is asked; the page is the same. */
export function Named() {
  return (
    <XStack height={240} width="100%">
      <Home mark={<HanzoMark size={26} />} title="What’s up next, Dave?" />
    </XStack>
  )
}
