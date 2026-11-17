// @hanzo/crm — Hanzo CRM: the org's people, companies, pipeline, fundraising,
// tasks, lists, candidates and sequences, kept in the org's own Base.
//
// ONE CRM, drawn by every app that has one: Hanzo Cloud's console (/crm, and
// crm.<brand>) and Hanzo Team (/crm). Each app says what only it knows through
// `configureCrm` (how it signs a request, the org, the session, its router, its
// brand) and draws `<CrmModule params={{ tab, id }} />` where its CRM goes.
//
//   import { configureCrm, CrmModule, CRM_PAGES } from '@hanzo/crm'
//
// `@hanzo/crm/base` is the Base client alone, with no screen behind it, for an
// app's data layer: `baseClient({ baseUrl, send })`.

export { configureCrm } from './lib/host'
export type { CrmAccount, CrmBrand, CrmHost, CrmRouter, CrmSearchParams, CrmSession } from './lib/host'
export type { BaseClient, BaseListResult, BaseRecord, ListRecordsParams } from './lib/base-data/api'
export { baseClient } from './lib/base-data/client'
export type { BaseClientOptions, BaseSend } from './lib/base-data/client'
export type { BaseCollection, BaseField } from './lib/base-data/fields'

export { CrmModule } from './CrmModule'
export { CRM_PAGES } from './nav'
export type { CrmPage } from './nav'

// What a host's navigation lists: the objects, in order, and where an address lands.
export { OBJECTS, TABS, movedView, objectOf } from './crm/objects'
export type { CrmObject, ObjectId } from './crm/objects'
