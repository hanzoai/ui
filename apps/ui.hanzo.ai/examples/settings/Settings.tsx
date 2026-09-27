import { useState } from 'react'
import { XStack } from '@hanzo/gui'
import { Settings, Heading, Soft, type Entry } from '@hanzo/ui/settings'

const ENTRIES: Entry[] = [
  { id: 'general', label: 'General', group: 'Settings' },
  { id: 'account', label: 'Account', group: 'Settings' },
  { id: 'usage', label: 'Usage', group: 'Settings' },
  { id: 'environments', label: 'Environments', group: 'Code' },
  { id: 'keys', label: 'API keys', group: 'Code' },
  { id: 'members', label: 'Members', group: 'Organization' },
]

/** The page — the sections grouped in a column from md up, a row of chips on a phone, and the open one in a 760px column. */
export function Default() {
  const [active, setActive] = useState('general')
  const entry = ENTRIES.find((e) => e.id === active)!
  return (
    <XStack height={480} width="100%" borderWidth={1} borderColor="$borderColor">
      <Settings entries={ENTRIES} groups={['Settings', 'Code', 'Organization']} active={active} onPick={setActive}>
        <Heading title={entry.label} />
        <Soft>Sign in to see your settings.</Soft>
      </Settings>
    </XStack>
  )
}
