import { cn } from '@hanzo/ui'
import { FONT_SANS_VAR } from '@hanzo/ui/core'
import { pages, tone } from '@hanzo/ui/product/pure'
import { radius } from '@hanzo/ui/tokens'
import Demo from './demo.jsx'

export default function Page() {
  const className = cn('hanzo-next-root', 'px-4')
  const run = pages(1, 5).join(',')
  const status = tone('past_due')
  const radiusKeys = Object.keys(radius).length
  return <Demo summary={`${className}|${run}|${status}|${FONT_SANS_VAR}|${radiusKeys}`} />
}
