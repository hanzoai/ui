'use client'

import { createContext, useContext } from 'react'
import type { BaseRecord } from '../lib/base-data/api'
import type { TimelineEvent } from '../lib/crm'
import type { ObjectId } from './objects'

export type CrmViewMode = 'table' | 'board' | 'calendar'

export interface ActiveRecordContext {
  objectId: ObjectId
  collection: string
  recordId: string
  title: string
  email?: string
  record: BaseRecord
  timeline?: TimelineEvent[]
}

export interface ActiveListContext {
  objectId: ObjectId
  collection: string
  total: number
  records: BaseRecord[]
}

export interface EmailDraftHandoff {
  subject: string
  body: string
  at: number
}

export interface CrmShellContextValue {
  openCommandMenu: () => void
  copilotOpen: boolean
  setCopilotOpen: (open: boolean) => void
  toggleCopilot: () => void
  viewMode: CrmViewMode
  setViewMode: (mode: CrmViewMode) => void
  availableViews: CrmViewMode[]
  setAvailableViews: (views: CrmViewMode[]) => void
  activeRecord: ActiveRecordContext | null
  setActiveRecord: (ctx: ActiveRecordContext | null) => void
  activeList: ActiveListContext | null
  setActiveList: (ctx: ActiveListContext | null) => void
  draftEmail: EmailDraftHandoff | null
  openEmailDraft: (draft: { subject: string; body: string }) => void
  clearEmailDraft: () => void
  recordRevision: number
  bumpRecordRevision: () => void
  quickCreateObject: ObjectId | null
  setQuickCreateObject: (obj: ObjectId | null) => void
}

const noop = () => {}

const DEFAULT_CTX: CrmShellContextValue = {
  openCommandMenu: noop,
  copilotOpen: false,
  setCopilotOpen: noop,
  toggleCopilot: noop,
  viewMode: 'table',
  setViewMode: noop,
  availableViews: ['table'],
  setAvailableViews: noop,
  activeRecord: null,
  setActiveRecord: noop,
  activeList: null,
  setActiveList: noop,
  draftEmail: null,
  openEmailDraft: noop,
  clearEmailDraft: noop,
  recordRevision: 0,
  bumpRecordRevision: noop,
  quickCreateObject: null,
  setQuickCreateObject: noop,
}

export const CrmShellContext = createContext<CrmShellContextValue>(DEFAULT_CTX)

export const useCrmShell = (): CrmShellContextValue => useContext(CrmShellContext)
