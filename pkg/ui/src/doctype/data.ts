/**
 * Shared, non-React data helpers for the generic DocType renderer. A relation
 * (Link) field is a picker over the TARGET doctype's records, so before a view
 * can render or edit one it must load those records (+ the target's schema for
 * the human label). This is the ONE place that does it, used by the records list,
 * the mobile card list and the record detail — no per-view duplication.
 */
import type { SelectOption, FieldDefinition } from '@hanzo/data'
import type { DocType } from './types'
import type { FrameworkClient } from './client'
import { linkFields, titleOf } from './fields'

/** The picker options for every Link field of `dt`: value = target id, label = its title. */
export async function loadLinkOptions(
  client: FrameworkClient,
  dt: DocType,
): Promise<Record<string, SelectOption[]>> {
  const links = linkFields(dt)
  const out: Record<string, SelectOption[]> = {}
  await Promise.all(
    links.map(async (f) => {
      const target = f.options
      if (!target) return
      // A target the caller can't read (403) → no options → the field falls back
      // to a raw-id input (honest, never a fabricated candidate list).
      const [tdt, docs] = await Promise.all([
        client.doctypes.get(target).catch(() => null),
        client.records.list(target, { limit: 200 }).catch(() => []),
      ])
      out[f.fieldname] = docs.map((d) => ({
        value: String(d.name),
        label: tdt ? titleOf(d, tdt) : String(d.name),
      }))
    }),
  )
  return out
}

/**
 * The `fieldOptions` callback @hanzo/data's views take: relation fields get their
 * loaded target records; select fields get the choices declared in metadata (so
 * the table cell and the form input agree). Everything else → undefined.
 */
export function makeFieldOptions(
  linkOptions: Record<string, SelectOption[]>,
): (field: FieldDefinition) => SelectOption[] | undefined {
  return (field) => {
    if (field.type === 'relation') return linkOptions[field.name] ?? []
    if (field.type === 'select' || field.type === 'multiSelect') {
      return (field.metadata as { options?: SelectOption[] } | undefined)?.options
    }
    return undefined
  }
}
