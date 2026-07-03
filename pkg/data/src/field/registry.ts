// The field registry — the one dispatch point from a FieldType to its renderers.
//
// Why a registry and not a switch: adding (or overriding) a field type is a
// single `registerField` call, with zero edits to FieldDisplay/FieldInput/
// DataTable. Apps can register custom types (e.g. a domain-specific "sku" or
// "geo") and they render everywhere automatically. Orthogonal + open/closed.
import type {
  FieldType,
  FieldDisplayComponent,
  FieldInputComponent,
} from './types'

export interface FieldRenderers {
  /** Read-only renderer. Required — every type can at least display. */
  Display: FieldDisplayComponent
  /** Edit renderer. Optional — read-only types (uuid, actor, position) omit it. */
  Input?: FieldInputComponent
}

const registry = new Map<FieldType, FieldRenderers>()

/** Register (or override) the renderers for a field type. */
export function registerField(type: FieldType, renderers: FieldRenderers): void {
  registry.set(type, renderers)
}

/** Resolve renderers for a type, or undefined if none registered yet. */
export function getFieldRenderers(type: FieldType): FieldRenderers | undefined {
  return registry.get(type)
}

/** True when a type has a registered renderer. */
export function hasField(type: FieldType): boolean {
  return registry.has(type)
}

/** Every registered type — useful for schema editors / type pickers. */
export function registeredFieldTypes(): FieldType[] {
  return [...registry.keys()]
}
