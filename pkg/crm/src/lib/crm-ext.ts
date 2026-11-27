/**
 * Extended CRM API client methods wired onto `CrmApi`.
 * Every `/v1/crm/*` endpoint cleanly falls back to Base when not deployed yet,
 * so the UI never breaks.
 */
import type { BaseClient, BaseRecord } from './base-data/api'
import type { ObjectId } from '../crm/objects'
import { ApiError, currentOrg, restGet, restPost, v1Url } from './host'
import {
  SEARCH_ORDER,
  attachmentFilter,
  computeAnalytics,
  fallbackAiAssist,
  groupSearchHits,
  toSearchHit,
  validateCustomField,
  type AiAssistContext,
  type AiAssistResponse,
  type AttachmentCategory,
  type AttachmentRecord,
  type AttachmentTarget,
  type CrmAnalytics,
  type CustomFieldInput,
  type CustomFieldType,
  type SearchHit,
  type SearchResultGroup,
} from './crm-analytics'

export * from './crm-analytics'

const enc = encodeURIComponent
const str = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v))

export interface MergeResult {
  primaryId: string
  duplicateId: string
  mergedFields: string[]
  source: 'api' | 'base'
}

export function createCrmExt(deps: {
  base: () => BaseClient
  invalidateSchema: (collection: string) => void
}) {
  return {
    /** Cross-object search via GET /v1/crm/search with parallel Base fallback. */
    search: async (query: string, limit = 24): Promise<SearchResultGroup[]> => {
      const q = query.trim()
      if (!q) return []
      try {
        const res = await restGet<{ hits?: SearchHit[]; groups?: SearchResultGroup[] }>(
          v1Url(`crm/search?q=${enc(q)}&limit=${limit}`),
        )
        if (Array.isArray(res?.groups)) return res.groups
        if (Array.isArray(res?.hits)) return groupSearchHits(res.hits)
      } catch {
        /* fallback to parallel Base list queries below */
      }

      const safe = q.replace(/["\\]/g, '')
      const perObj = Math.max(3, Math.ceil(limit / SEARCH_ORDER.length))
      const queries: { objectId: ObjectId; collection: string; filter: string }[] = [
        { objectId: 'people', collection: 'people', filter: `(name.firstName ~ "${safe}" || name.lastName ~ "${safe}" || emails.primaryEmail ~ "${safe}" || job_title ~ "${safe}")` },
        { objectId: 'companies', collection: 'companies', filter: `(name ~ "${safe}" || domain ~ "${safe}")` },
        { objectId: 'deals', collection: 'opportunities', filter: `(pipeline = "sales" || pipeline = "") && name ~ "${safe}"` },
        { objectId: 'fundraising', collection: 'opportunities', filter: `pipeline = "fundraising" && name ~ "${safe}"` },
        { objectId: 'tasks', collection: 'tasks', filter: `title ~ "${safe}"` },
        { objectId: 'notes', collection: 'notes', filter: `(title ~ "${safe}" || body ~ "${safe}")` },
        { objectId: 'candidates', collection: 'candidates', filter: `(name.firstName ~ "${safe}" || name.lastName ~ "${safe}" || role ~ "${safe}")` },
      ]

      const lists = await Promise.all(
        queries.map(({ objectId, collection, filter }) =>
          deps.base()
            .listRecords(collection, { filter, perPage: perObj, skipTotal: true })
            .then((r) => r.items.map((item) => toSearchHit(objectId, item)))
            .catch(() => [] as SearchHit[]),
        ),
      )
      return groupSearchHits(lists.flat())
    },

    /** CRM analytics dashboard via GET /v1/crm/analytics with live Base computation fallback. */
    analytics: async (): Promise<CrmAnalytics> => {
      try {
        const res = await restGet<Partial<CrmAnalytics>>(v1Url('crm/analytics'))
        if (res?.sales && res?.fundraising && res?.outreach) {
          return {
            sales: res.sales,
            fundraising: res.fundraising,
            outreach: res.outreach,
            overdueTasks: Array.isArray(res.overdueTasks) ? res.overdueTasks : [],
            recentActivities: Array.isArray(res.recentActivities) ? res.recentActivities : [],
            source: 'api',
          }
        }
      } catch {
        /* fallback to live Base computation */
      }

      const safeList = (collection: string, sort?: string) =>
        deps.base()
          .listRecords(collection, { perPage: 200, sort, skipTotal: true })
          .then((r) => r.items)
          .catch(() => [] as BaseRecord[])

      const [opportunities, tasks, activities, people] = await Promise.all([
        safeList('opportunities', '-created'),
        safeList('tasks', 'due'),
        safeList('activities', '-at'),
        safeList('people', '-created'),
      ])

      return computeAnalytics({ opportunities, tasks, activities, people })
    },

    /** Merge duplicate records via POST /v1/crm/records/:object/merge with Base fallback. */
    merge: async (
      collection: string,
      primaryId: string,
      duplicateId: string,
      fields: Record<string, unknown>,
    ): Promise<MergeResult> => {
      try {
        await restPost(v1Url(`crm/records/${enc(collection)}/merge`), {
          primaryId,
          duplicateId,
          fields,
        })
        return { primaryId, duplicateId, mergedFields: Object.keys(fields), source: 'api' }
      } catch (e) {
        if (e instanceof ApiError && e.status >= 400 && e.status < 500 && e.status !== 404 && e.status !== 405) {
          throw e
        }
      }
      if (Object.keys(fields).length > 0) {
        await deps.base().updateRecord(collection, primaryId, fields)
      }
      await deps.base().deleteRecord(collection, duplicateId)
      return { primaryId, duplicateId, mergedFields: Object.keys(fields), source: 'base' }
    },

    /** Move a deal/round/candidate stage via POST /v1/crm/records/:object/:id/stage with Base fallback. */
    moveStage: async (collection: string, id: string, stage: string): Promise<BaseRecord> => {
      try {
        const res = await restPost<BaseRecord>(v1Url(`crm/records/${enc(collection)}/${enc(id)}/stage`), { stage })
        if (res && typeof res === 'object') return res
      } catch {
        /* fallback to Base PATCH */
      }
      return deps.base().updateRecord(collection, id, { stage })
    },

    /** AI Copilot assist via POST /v1/crm/ai/assist with deterministic offline fallback. */
    aiAssist: async (ctx: AiAssistContext): Promise<AiAssistResponse> => {
      try {
        const res = await restPost<Partial<AiAssistResponse>>(v1Url('crm/ai/assist'), ctx)
        if (res && typeof res.summary === 'string' && res.summary) {
          return {
            summary: res.summary,
            bullets: Array.isArray(res.bullets) ? res.bullets : undefined,
            suggestedPatch: res.suggestedPatch,
            emailDraft: res.emailDraft,
            suggestedTasks: Array.isArray(res.suggestedTasks) ? res.suggestedTasks : undefined,
            source: 'api',
          }
        }
      } catch {
        /* graceful offline fallback */
      }
      return fallbackAiAssist(ctx)
    },

    /** Add a custom field to a CRM object via POST /v1/crm/schema/:object/fields with Base fallback. */
    addField: async (
      collection: string,
      input: CustomFieldInput,
      existingNames?: ReadonlySet<string>,
    ): Promise<{ name: string; label: string; type: CustomFieldType }> => {
      const check = validateCustomField(input, existingNames)
      if (!check.valid) throw new Error(check.errors[0])

      const payload: Record<string, unknown> = {
        name: check.slug,
        label: input.label.trim(),
        type: input.type,
        required: Boolean(input.required),
        ...(input.type === 'select'
          ? {
              maxSelect: 1,
              values: (input.options ?? []).map((o) => o.trim()).filter(Boolean),
              options: (input.options ?? [])
                .map((o) => o.trim())
                .filter(Boolean)
                .map((v, i) => ({ value: v, label: v, position: i })),
            }
          : {}),
        ...(input.type === 'relation' && input.targetCollection ? { collectionId: input.targetCollection, maxSelect: 1 } : {}),
      }

      try {
        await restPost(v1Url(`crm/schema/${enc(collection)}/fields`), payload)
      } catch (e) {
        if (e instanceof ApiError && e.status !== 404 && e.status !== 405) throw e
        await restPost(v1Url(`base/collections/${enc(collection)}/fields`), payload)
      }

      deps.invalidateSchema(collection)
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(`hanzo.crm.schema.${currentOrg()}.${collection}`)
        }
      } catch {
        /* ignore storage errors */
      }
      return { name: check.slug, label: input.label.trim(), type: input.type }
    },

    /** Attachments CRUD over the Base `attachments` collection. */
    attachments: {
      list: async (target: AttachmentTarget): Promise<AttachmentRecord[]> => {
        const filter = attachmentFilter(target)
        if (!filter) return []
        try {
          const res = await deps.base().listRecords('attachments', { filter, sort: '-created', perPage: 100, skipTotal: true })
          return res.items.map((r) => ({
            id: str(r.id),
            name: str(r.name || 'Attachment'),
            file: str(r.file),
            category: (str(r.category) || 'document') as AttachmentCategory,
            size: typeof r.size === 'number' ? r.size : undefined,
            mimeType: str(r.mime_type || r.mimeType) || undefined,
            created: str(r.created || r.createdAt),
          }))
        } catch (e) {
          if (e instanceof ApiError && e.status === 404) return []
          throw e
        }
      },
      upload: async (
        target: AttachmentTarget,
        input: { name: string; file: string; category?: AttachmentCategory; size?: number; mimeType?: string },
      ): Promise<AttachmentRecord> => {
        const body: Record<string, unknown> = {
          name: input.name.trim() || 'Attachment',
          file: input.file,
          category: input.category ?? 'document',
          ...(input.size != null ? { size: input.size } : {}),
          ...(input.mimeType ? { mime_type: input.mimeType } : {}),
          ...(target.person ? { person: target.person } : {}),
          ...(target.company ? { company: target.company } : {}),
          ...(target.opportunity ? { opportunity: target.opportunity } : {}),
          ...(target.candidate ? { candidate: target.candidate } : {}),
          ...(target.note ? { note: target.note } : {}),
          ...(target.task ? { task: target.task } : {}),
        }
        const r = await deps.base().createRecord('attachments', body)
        return {
          id: str(r.id),
          name: str(r.name || input.name),
          file: str(r.file || input.file),
          category: (str(r.category) || input.category || 'document') as AttachmentCategory,
          size: input.size,
          mimeType: input.mimeType,
          created: str(r.created || r.createdAt || new Date().toISOString()),
        }
      },
      remove: (id: string): Promise<void> => deps.base().deleteRecord('attachments', id),
    },
  }
}
