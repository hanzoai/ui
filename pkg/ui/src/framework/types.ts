/**
 * The Hanzo Framework wire types — the DocType/DocField/document contract the
 * cloud `clients/framework` engine serves at /v1/framework/* (Frappe's DocType
 * metadata core, rebuilt native in Go). These mirror the Go JSON tags exactly.
 *
 * This is the ONE metadata vocabulary the generic @hanzo/data DocType renderer
 * builds from, so CMS/ERP/CRM/Helpdesk — all "just DocTypes" on the engine —
 * render through the SAME components. Types only; no runtime.
 */

/** The engine's closed fieldtype set (mirrors clients/framework/doctype.go). */
export type Fieldtype =
  | 'Data'
  | 'Int'
  | 'Float'
  | 'Currency'
  | 'Check'
  | 'Date'
  | 'Datetime'
  | 'Text'
  | 'SmallText'
  | 'LongText'
  | 'RichText'
  | 'Select'
  | 'Link'
  | 'Table'
  | 'Attach'
  | 'JSON'
  | 'Password'

/** One field of a DocType (Frappe's DocField). */
export interface DocField {
  fieldname: string
  fieldtype: Fieldtype
  label?: string
  reqd?: boolean
  /** Select → newline-separated choices; Link → target DocType; Table → child DocType. */
  options?: string
  default?: string
  unique?: boolean
  readOnly?: boolean
  hidden?: boolean
  inListView?: boolean
  fetchFrom?: string
}

/** A role's rights on a DocType (Frappe's DocPerm). */
export interface DocPerm {
  role: string
  read?: boolean
  write?: boolean
  create?: boolean
  delete?: boolean
  submit?: boolean
  cancel?: boolean
}

/** A DocType definition — per-org metadata. */
export interface DocType {
  name: string
  module?: string
  isSingle?: boolean
  isSubmittable?: boolean
  autoname?: string
  titleField?: string
  fields: DocField[]
  permissions?: DocPerm[]
  createdAt?: number
  updatedAt?: number
}

/** The managed document envelope keys the engine always returns. */
export interface DocEnvelope {
  name: string
  doctype: string
  /** 0 = draft, 1 = submitted, 2 = cancelled. */
  docstatus: number
  createdAt: number
  updatedAt: number
}

/** A document: the field data overlaid with the managed envelope keys. */
export type FrameworkDoc = Record<string, unknown> & DocEnvelope

/** A registered app lane and (optionally, per-org) which fixtures are installed. */
export interface ModuleInfo {
  module: string
  doctypes: string[]
  installed?: string[]
}

/** The result of installing a module into the caller's org. */
export interface InstallResult {
  module: string
  created: string[]
  existing: string[]
}

/** List query for the generic document surface. */
export interface ListQuery {
  filters?: Record<string, string | number | boolean>
  fields?: string[]
  orderBy?: string
  limit?: number
}

/** The redacted-Password marker the engine returns for a set secret. */
export const REDACTED_MARKER = '__set__'
