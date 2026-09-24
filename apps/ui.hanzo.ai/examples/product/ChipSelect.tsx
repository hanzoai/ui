import { useState } from 'react'
import { XStack } from '@hanzo/gui'
import { Cloud } from '@hanzogui/lucide-icons-2'
import { ChipSelect, type ChipItem } from '@hanzo/ui/product'

const PLACES: ChipItem[] = [
  { id: 'sandbox', label: 'Default', hint: 'sandbox' },
  { id: 'gpu-01', label: 'gpu-01', hint: 'online' },
  { id: 'laptop', label: 'laptop', hint: 'offline', disabled: true },
]

/** A chip over a short list — the whole list is given, and the search is applied in the chip. */
export function Environment() {
  const [place, setPlace] = useState<ChipItem>(PLACES[0])
  return (
    <XStack pt={180}>
      <ChipSelect
        name="Environment"
        icon={<Cloud size={12} />}
        label={place.label}
        chosen={place}
        onChange={setPlace}
        items={PLACES}
        placeholder="Search environments…"
      />
    </XStack>
  )
}

/** Paged from a loader — each page answers a cursor for the next, and reaching the end asks for it. */
export function Paged() {
  const all = Array.from({ length: 60 }, (_, i) => ({ id: `item-${i}`, label: `item ${i}` }))
  const [chosen, setChosen] = useState<ChipItem | null>(null)
  return (
    <XStack pt={320}>
      <ChipSelect
        name="Item"
        label={chosen?.label ?? 'Pick one'}
        chosen={chosen}
        onChange={setChosen}
        load={async (q, after) => {
          const hit = all.filter((i) => i.label.includes(q))
          const start = after ? Number(after) : 0
          const next = start + 20 < hit.length ? String(start + 20) : null
          return { items: hit.slice(start, start + 20), next }
        }}
        footer="Twenty at a time. Type to search."
      />
    </XStack>
  )
}

/** The quiet look — for a choice in a row of words, like a composer's model. */
export function Quiet() {
  const models: ChipItem[] = [
    { id: 'zen-5', label: 'Zen 5' },
    { id: 'zen-5-mini', label: 'Zen 5 Mini' },
  ]
  const [model, setModel] = useState(models[0])
  return (
    <XStack pt={120}>
      <ChipSelect name="Model" label={model.label} chosen={model} onChange={setModel} items={models} quiet />
    </XStack>
  )
}
