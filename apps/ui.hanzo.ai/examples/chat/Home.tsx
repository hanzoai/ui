import { useState } from 'react'
import { XStack } from '@hanzo/gui'
import { Composer, Home } from '@hanzo/ui/chat'
import { ChipSelect, HanzoMark } from '@hanzo/ui/product'

/** A fresh pane — the mark and the question centred, the composer and its chips under it in the same column. */
export function Default() {
  const [draft, setDraft] = useState('')
  return (
    <XStack height={440} width="100%">
      <Home mark={<HanzoMark size={26} />}>
        <Composer
          value={draft}
          onChange={setDraft}
          onSend={() => setDraft('')}
          placeholder="Describe a task or ask a question"
          pills={<ChipSelect name="Environment" label="Cloud" onChange={() => {}} items={[{ id: 'c', label: 'Cloud' }]} />}
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
