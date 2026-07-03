// The input router — resolves a field's editor by type. Read-only types (and
// any without a registered Input yet) render nothing, so a host can safely ask
// for an editor and get one only when the type supports editing.
import { getFieldRenderers } from './registry'
import type { FieldInputProps } from './types'
import './registerDefaults'

export function FieldInput(props: FieldInputProps) {
  const Input = getFieldRenderers(props.field.type)?.Input
  if (!Input) return null
  return <Input {...props} />
}

/** True when a field type can be edited (has a registered Input). */
export function isEditable(type: FieldInputProps['field']['type']): boolean {
  return Boolean(getFieldRenderers(type)?.Input)
}
