import { Message } from '@hanzo/ui/chat'
import { Feedback } from '@hanzo/ui/agents'

/** Under a turn — goes in `Message`'s `actions`; pressing the chosen thumb again takes it back. */
export function UnderATurn() {
  return (
    <Message role="assistant" actions={<Feedback text="The cart now keeps its items across reloads." />}>
      The cart now keeps its items across reloads.
    </Message>
  )
}
