import { useState } from 'react'
import { Attachments, type Attachment } from '@hanzo/ui/agents'

/** Default — a file, a picked element and an upload, each removable before the turn is sent. */
export function Default() {
  const [items, setItems] = useState<Attachment[]>([
    { id: 'f', kind: 'file', label: 'src/app.tsx' },
    { id: 'e', kind: 'element', label: '<button> .cta' },
    { id: 'u', kind: 'upload', label: 'hero.png' },
  ])
  return <Attachments items={items} onRemove={(id) => setItems((all) => all.filter((i) => i.id !== id))} />
}
