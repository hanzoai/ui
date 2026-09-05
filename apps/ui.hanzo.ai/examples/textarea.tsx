import { useState } from "react"
import { Text, XStack, YStack } from "@hanzo/gui"
import { Button, Label, Textarea } from "@hanzo/ui"

/** Default — a multiline field three rows tall that grows as lines are added or wrap, for any text longer than one line. */
export function Default() {
  return (
    <YStack width={320}>
      <Textarea placeholder="Describe the change and why it is needed" />
    </YStack>
  )
}

/** Rows — `rows` is the floor and `maxH` the ceiling: the height follows the text between them and scrolls past the top, and a floor under three rows lowers `minH` too, since the field is 64px tall on its own. */
export function Rows() {
  return (
    <YStack width={320} gap="$3">
      <Textarea rows={1} minH={36} placeholder="Add a comment" />
      <Textarea rows={6} placeholder="Steps to reproduce" />
      <Textarea
        maxH={120}
        defaultValue={
          "Fix the flaky bootstrap test\n\nThe peer list is read before the handshake finishes, so the first assertion sees an empty set. Wait on the handshake promise instead.\n\nSeen in 3 of the last 20 CI runs."
        }
      />
    </YStack>
  )
}

/** States — a disabled field takes no input and fades; a read-only one can be selected and copied but not changed; `aria-invalid` reddens the edge so a failed check is seen before its message is read. */
export function States() {
  return (
    <YStack width={320} gap="$3">
      <Textarea disabled placeholder="Comments are closed on this thread" />
      <Textarea
        readOnly
        defaultValue="You are the support agent for Hanzo Cloud. Answer from the docs, and say so when you are unsure."
      />
      <Textarea aria-invalid rows={2} defaultValue="Bump deps" />
      <Text fontSize="$2" color="$red10">
        A release note needs at least twenty characters.
      </Text>
    </YStack>
  )
}

/** Controlled — `value` and `onChangeText` keep the text in React state, `maxLength` caps it, and a Label bound by `htmlFor` focuses the field when clicked. */
export function Controlled() {
  const [note, setNote] = useState("")
  const limit = 280
  return (
    <YStack width={320} gap="$2">
      <Label htmlFor="release-note">Release note</Label>
      <Textarea
        id="release-note"
        value={note}
        onChangeText={setNote}
        placeholder="What changed for the people who use it"
        maxLength={limit}
      />
      <Text fontSize="$2" color="$quiet">
        {note.length}/{limit}
      </Text>
    </YStack>
  )
}

/** Composer — `onKeyDown` is the DOM event, so Cmd+Enter or Ctrl+Enter sends while Enter alone adds a line, and the Button beside the field sends for a pointer. */
export function Composer() {
  const [draft, setDraft] = useState("")
  const [sent, setSent] = useState<string[]>([])
  const send = () => {
    const text = draft.trim()
    if (!text) return
    setSent((all) => [...all, text])
    setDraft("")
  }
  return (
    <YStack width={320} gap="$2">
      {sent.map((message, i) => (
        <Text key={i} fontSize="$2" px="$3" py="$2" rounded="$3" bg="$color3">
          {message}
        </Text>
      ))}
      <Textarea
        value={draft}
        onChangeText={setDraft}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            send()
          }
        }}
        placeholder="Message #deploys"
      />
      <XStack justify="flex-end">
        <Button size="sm" onClick={send} disabled={!draft.trim()}>
          Send
        </Button>
      </XStack>
    </YStack>
  )
}
