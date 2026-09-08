import { useState } from 'react'
import { XStack, YStack } from '@hanzo/gui'
import { Tags, type Tag } from '@hanzo/ui'

const STACK: Tag[] = [
  { id: '1', label: 'React' },
  { id: '2', label: 'TypeScript' },
  { id: '3', label: 'Next.js' },
  { id: '4', label: 'Tailwind CSS' },
]

/** Default — a wrapping row of labels with no remove affordance. */
export function Default() {
  return <Tags tags={STACK} />
}

/** Variants — the same list rendered in each badge variant. */
export function Variants() {
  return (
    <YStack gap="$3">
      <Tags tags={STACK} variant="default" />
      <Tags tags={STACK} variant="secondary" />
      <Tags tags={STACK} variant="outline" />
      <Tags tags={STACK} variant="destructive" />
    </YStack>
  )
}

/** Removable — pass `onRemove` to grow each badge a close button. */
export function Removable() {
  const [tags, setTags] = useState(STACK)
  return (
    <XStack minH={40} items="center">
      <Tags
        tags={tags}
        variant="secondary"
        onRemove={(id) => setTags((current) => current.filter((tag) => tag.id !== id))}
      />
    </XStack>
  )
}
