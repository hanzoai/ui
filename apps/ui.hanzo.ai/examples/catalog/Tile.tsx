import { useState } from 'react'
import { SizableText, YStack } from '@hanzo/gui'
import { BookOpen } from '@hanzogui/lucide-icons-2'
import { Add, Featured, Tile, Tiles } from '@hanzo/ui/catalog'

const Mark = ({ letter }: { letter: string }) => (
  <YStack width={32} height={32} rounded="$3" bg="$raised" items="center" justify="center" shrink={0} aria-hidden>
    <SizableText size="$3" color="$ink">
      {letter}
    </SizableText>
  </YStack>
)

/** The cards — as many columns as fit, one on a phone. The press opens a card; its action sits beside that press, never inside it. */
export function Default() {
  const [added, setAdded] = useState(false)
  return (
    <YStack width="100%">
      <Tiles label="Connectors">
        <Tile title="GitHub" detail="Repositories, issues and pull requests." meta="Official" mark={<Mark letter="G" />} onOpen={() => {}} action={<Add name="GitHub" added={added} onPress={() => setAdded(true)} />} />
        <Tile title="Linear" detail="Issues and cycles." meta="Official" mark={<Mark letter="L" />} onOpen={() => {}} action={<Add name="Linear" added onPress={() => {}} />} />
        <Tile title="kms_secrets" detail="Read the names of an org’s secrets." mark={<BookOpen size={16} />} />
      </Tiles>
    </YStack>
  )
}

/** The featured card — the one a shelf puts first, drawn larger; its action wraps under it on a phone. */
export function Feature() {
  return (
    <Featured
      title="Triage"
      detail="How we triage an issue: label it, size it, and say who owns it."
      meta="Written here · saved Sep 21, 2026"
      mark={<Mark letter="T" />}
      onOpen={() => {}}
      action={<Add name="Triage" added={false} onPress={() => {}} />}
    />
  )
}
