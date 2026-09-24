import { useState } from 'react'
import { Suggestions, SUGGESTIONS } from '@hanzo/ui/agents'

/** Default — v2's three asks; a chip sends its words, the × puts the row away. */
export function Default() {
  const [shown, setShown] = useState(true)
  return shown ? <Suggestions items={SUGGESTIONS} onPick={() => {}} onDismiss={() => setShown(false)} /> : null
}
