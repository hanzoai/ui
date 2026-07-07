// The display router — resolves a field's read-only renderer by type and renders
// it. The single dispatch point: callers never branch on field type. Unknown
// types fall back to a safe string display rather than crashing.
import { getFieldRenderers } from './registry'
import { FallbackDisplay } from './displays'
import type { FieldDisplayProps } from './types'
import './registerDefaults'

export function FieldDisplay(props: FieldDisplayProps) {
  const Display = getFieldRenderers(props.field.type)?.Display ?? FallbackDisplay
  return <Display {...props} />
}
