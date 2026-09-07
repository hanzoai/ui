import { YStack } from '@hanzo/gui'
import { Editor } from '@hanzo/ui'

/** Default — an empty rich-text surface with the formatting toolbar. */
export function Default() {
  return <Editor placeholder="Start typing..." />
}

/** Controlled — the value and its updates are owned by the caller. */
export function Controlled() {
  return (
    <YStack gap="$2">
      <Editor value="<p>Edit me and watch <b>onChange</b> fire.</p>" onChange={() => {}} />
    </YStack>
  )
}

/** Read only — the surface renders content without accepting edits. */
export function ReadOnly() {
  return <Editor readOnly value="<p>This note is locked.</p>" />
}
