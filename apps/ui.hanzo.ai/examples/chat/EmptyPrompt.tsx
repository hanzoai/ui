import { EmptyPrompt } from '@hanzo/ui/chat'
import { BrandMark } from '@hanzo/ui/product'

/** The empty pane's question, aligned to the composer column — the mark is the surface's own. */
export function Default() {
  return <EmptyPrompt mark={<BrandMark size={20} wordmark={false} animated={false} />} column={560} />
}
