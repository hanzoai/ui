import { YStack } from "@hanzo/gui"
import { Editor } from "@hanzo/ui"

/** Default — a bold/italic/list toolbar above a blank contentEditable field. */
export function Default() {
  return (
    <YStack width="100%" minH={280} items="center" justify="center">
      <Editor width="100%" maxW={480} />
    </YStack>
  )
}

/** With content — starts the region with existing HTML rather than empty. */
export function WithContent() {
  return (
    <YStack width="100%" minH={280} items="center" justify="center">
      <Editor width="100%" maxW={480} value="<p><strong>Hello</strong> there — <em>start editing</em>.</p>" />
    </YStack>
  )
}

/** Custom placeholder — shown by the surrounding app's CSS when the field is empty. */
export function CustomPlaceholder() {
  return (
    <YStack width="100%" minH={280} items="center" justify="center">
      <Editor width="100%" maxW={480} placeholder="Write your notes here..." />
    </YStack>
  )
}
