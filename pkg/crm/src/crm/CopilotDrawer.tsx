'use client'

/**
 * Twenty `side-panel` + `modules/ai` inspired In-CRM AI Copilot Drawer.
 *
 * - Desktop (`>=768px`): fixed 380px right-hand slide-over panel.
 * - Mobile (`<768px`, e.g. 390px): full-height, full-width overlay sheet.
 * - Context-aware of the currently open record or object list.
 * - One-click action chips: Enrich record, Draft follow-up email, Summarize timeline,
 *   Extract next tasks, Audit stale deals.
 * - Actionable result buttons: Apply to record, Save as note, Create task, Open in email composer.
 */
import { useState } from 'react'
import { Button, Input, Spinner, Text, XStack, YStack } from '@hanzo/gui'
import { Card } from '@hanzo/ui'
import { Check, CheckSquare, FileText, Mail, Send, Sparkles, Wand2, X } from '@hanzogui/lucide-icons-2'

import {
  CrmApi,
  paragraphs,
  type AiAssistAction,
  type AiAssistResponse,
  type AiSuggestedTask,
} from '../lib/crm'
import { toBase } from '../lib/base-data/fields'
import { useSession } from '../lib/host'
import { useCrmShell } from './CrmContext'
import { useViewport } from './responsive'
import { words } from './schema'

interface CopilotMessage {
  id: string
  role: 'user' | 'assistant'
  label: string
  response?: AiAssistResponse
}

const ACTION_CHIPS: { action: AiAssistAction; label: string }[] = [
  { action: 'enrich', label: 'Enrich record' },
  { action: 'draft_email', label: 'Draft follow-up email' },
  { action: 'summarize', label: 'Summarize timeline' },
  { action: 'extract_tasks', label: 'Extract next tasks' },
  { action: 'audit_stale', label: 'Audit stale deals' },
]

const LINK_MANY: Record<string, string> = {
  people: 'people',
  companies: 'companies',
  opportunities: 'opportunities',
  candidates: 'candidates',
}

export function CopilotDrawer() {
  const { mobile } = useViewport()
  const { account } = useSession()
  const {
    copilotOpen,
    setCopilotOpen,
    activeRecord,
    activeList,
    openEmailDraft,
    bumpRecordRevision,
  } = useCrmShell()

  const [messages, setMessages] = useState<CopilotMessage[]>([])
  const [prompt, setPrompt] = useState('')
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  if (!copilotOpen) return null

  const contextLabel = activeRecord
    ? `${activeRecord.objectId} · ${activeRecord.title}`
    : activeList
      ? `${activeList.objectId} · ${activeList.total.toLocaleString()} records`
      : 'CRM Workspace'

  const runAssist = async (action: AiAssistAction, label: string, customPrompt?: string) => {
    setBusy(true)
    setToast(null)
    const userMsg: CopilotMessage = { id: `u:${Date.now()}`, role: 'user', label }
    setMessages((m) => [...m, userMsg])
    try {
      const response = await CrmApi.aiAssist({
        action,
        prompt: customPrompt,
        objectId: activeRecord?.objectId ?? activeList?.objectId,
        collection: activeRecord?.collection ?? activeList?.collection,
        recordId: activeRecord?.recordId,
        title: activeRecord?.title,
        record: activeRecord?.record,
        timeline: activeRecord?.timeline?.map((t) => ({
          kind: t.kind,
          subject: t.subject,
          body: t.body,
          at: t.at,
          status: t.status,
        })),
        records: activeList?.records,
      })
      setMessages((m) => [
        ...m,
        { id: `a:${Date.now()}`, role: 'assistant', label: response.summary, response },
      ])
    } catch (e) {
      setToast(words(e, 'Copilot request failed.'))
    } finally {
      setBusy(false)
    }
  }

  const applyPatch = async (patch: Record<string, unknown>) => {
    if (!activeRecord) return setToast('Open a record to apply field updates.')
    try {
      await CrmApi.update(activeRecord.collection, activeRecord.recordId, patch)
      bumpRecordRevision()
      setToast('Applied updates to record.')
    } catch (e) {
      setToast(words(e, 'Could not apply patch.'))
    }
  }

  const saveAsNote = async (res: AiAssistResponse) => {
    const text = [res.summary, ...(res.bullets ?? []).map((b) => `• ${b}`)].join('\n')
    const linkField = activeRecord ? LINK_MANY[activeRecord.collection] : undefined
    try {
      await CrmApi.create('notes', {
        title: activeRecord ? `Copilot: ${activeRecord.title}` : 'Copilot summary',
        body: paragraphs(text),
        ...(linkField && activeRecord ? { [linkField]: [activeRecord.recordId] } : {}),
      })
      bumpRecordRevision()
      setToast('Saved to Notes.')
    } catch (e) {
      setToast(words(e, 'Could not save note.'))
    }
  }

  const createTask = async (task: AiSuggestedTask) => {
    const linkField = activeRecord ? LINK_MANY[activeRecord.collection] : undefined
    const me = account?.email || account?.name || ''
    try {
      await CrmApi.create('tasks', {
        title: task.title,
        body: task.body ? paragraphs(task.body) : '',
        status: 'todo',
        assignee: me,
        due: task.due ? toBase('date', task.due) : '',
        ...(linkField && activeRecord ? { [linkField]: [activeRecord.recordId] } : {}),
      })
      bumpRecordRevision()
      setToast(`Created task "${task.title}".`)
    } catch (e) {
      setToast(words(e, 'Could not create task.'))
    }
  }

  const submitPrompt = () => {
    const q = prompt.trim()
    if (!q || busy) return
    setPrompt('')
    void runAssist('custom', q, q)
  }

  return (
    <YStack
      position="fixed"
      t={0}
      r={0}
      b={0}
      width={mobile ? '100%' : 380}
      maxW="100vw"
      z={900}
      bg="$background"
      borderLeftWidth={mobile ? 0 : 1}
      borderColor="$borderColor"
      style={{ boxShadow: '-8px 0 30px rgba(0,0,0,0.22)' }}
      role="complementary"
      aria-label="CRM AI Copilot"
      data-slot="crm-copilot-drawer"
    >
      <XStack items="center" justify="space-between" px="$3" py="$3" borderBottomWidth={1} borderColor="$borderColor" bg="$color2">
        <XStack items="center" gap="$2" flex={1} minW={0}>
          <Sparkles size={16} color="$blue10" />
          <YStack flex={1} minW={0}>
            <Text fontSize="$3" fontWeight="700" color="$color12">
              AI Copilot
            </Text>
            <Text fontSize="$1" color="$color10" numberOfLines={1} data-slot="crm-copilot-context">
              {contextLabel}
            </Text>
          </YStack>
        </XStack>
        <Button size="$2" chromeless px="$1.5" onPress={() => setCopilotOpen(false)} aria-label="Close AI Copilot">
          <X size={16} color="$color10" />
        </Button>
      </XStack>

      <YStack px="$3" py="$2" gap="$1.5" borderBottomWidth={1} borderColor="$borderColor">
        <Text fontSize="$1" fontWeight="700" color="$color10">
          SUGGESTED ACTIONS
        </Text>
        <XStack gap="$1.5" flexWrap="wrap">
          {ACTION_CHIPS.map((chip) => (
            <Button
              key={chip.action}
              size="$1"
              px="$2"
              py="$1"
              minH={28}
              bg="$color2"
              borderWidth={1}
              borderColor="$borderColor"
              rounded="$4"
              disabled={busy}
              onPress={() => void runAssist(chip.action, chip.label)}
              data-slot="crm-copilot-chip"
              data-action={chip.action}
            >
              <XStack items="center" gap="$1">
                <Wand2 size={11} color="$blue10" />
                <Text fontSize="$1" fontWeight="500" color="$color12">
                  {chip.label}
                </Text>
              </XStack>
            </Button>
          ))}
        </XStack>
      </YStack>

      <YStack flex={1} p="$3" gap="$2" overflow="scroll">
        {messages.length === 0 ? (
          <Card p="$3" bg="$color2" borderWidth={1} borderColor="$borderColor" gap="$1.5">
            <Text fontSize="$3" fontWeight="600" color="$color12">
              Ask Copilot anything about your CRM
            </Text>
            <Text fontSize="$2" color="$color10">
              Use a quick action above to enrich records, draft follow-ups, summarize timelines, extract next tasks, or audit stale deals.
            </Text>
          </Card>
        ) : (
          messages.map((m) => (
            <YStack key={m.id} gap="$1.5" items={m.role === 'user' ? 'flex-end' : 'stretch'}>
              {m.role === 'user' ? (
                <YStack px="$3" py="$2" rounded="$3" bg="$color4" maxW="88%">
                  <Text fontSize="$2" fontWeight="600" color="$color12">
                    {m.label}
                  </Text>
                </YStack>
              ) : (
                <Card p="$3" bg="$color2" borderWidth={1} borderColor="$borderColor" gap="$2" data-slot="crm-copilot-reply">
                  <Text fontSize="$2" fontWeight="600" color="$color12">
                    {m.response?.summary ?? m.label}
                  </Text>

                  {m.response?.bullets?.map((b, i) => (
                    <Text key={i} fontSize="$2" color="$color11">
                      {`• ${b}`}
                    </Text>
                  ))}

                  {m.response?.emailDraft ? (
                    <YStack p="$2" rounded="$2" bg="$background" borderWidth={1} borderColor="$borderColor" gap="$1">
                      <Text fontSize="$1" fontWeight="700" color="$color10">
                        {`Subject: ${m.response.emailDraft.subject}`}
                      </Text>
                      <Text fontSize="$2" color="$color11">
                        {m.response.emailDraft.body}
                      </Text>
                    </YStack>
                  ) : null}

                  {m.response ? (
                    <XStack gap="$1.5" flexWrap="wrap" pt="$1">
                      {m.response.suggestedPatch && activeRecord ? (
                        <Button size="$2" theme="blue" onPress={() => void applyPatch(m.response!.suggestedPatch!)}>
                          <XStack items="center" gap="$1">
                            <Check size={12} color="$color12" />
                            <Text fontSize="$1" color="$color12">
                              Apply to record
                            </Text>
                          </XStack>
                        </Button>
                      ) : null}

                      <Button size="$2" bg="$background" borderWidth={1} borderColor="$borderColor" onPress={() => void saveAsNote(m.response!)}>
                        <XStack items="center" gap="$1">
                          <FileText size={12} color="$color11" />
                          <Text fontSize="$1" color="$color12">
                            Save as note
                          </Text>
                        </XStack>
                      </Button>

                      {m.response.suggestedTasks?.[0] ? (
                        <Button
                          size="$2"
                          bg="$background"
                          borderWidth={1}
                          borderColor="$borderColor"
                          onPress={() => void createTask(m.response!.suggestedTasks![0])}
                        >
                          <XStack items="center" gap="$1">
                            <CheckSquare size={12} color="$color11" />
                            <Text fontSize="$1" color="$color12">
                              Create task
                            </Text>
                          </XStack>
                        </Button>
                      ) : null}

                      {m.response.emailDraft ? (
                        <Button
                          size="$2"
                          theme="blue"
                          onPress={() => {
                            openEmailDraft(m.response!.emailDraft!)
                            setToast('Loaded draft into email composer.')
                          }}
                        >
                          <XStack items="center" gap="$1">
                            <Mail size={12} color="$color12" />
                            <Text fontSize="$1" color="$color12">
                              Open in email composer
                            </Text>
                          </XStack>
                        </Button>
                      ) : null}
                    </XStack>
                  ) : null}
                </Card>
              )}
            </YStack>
          ))
        )}

        {busy ? (
          <XStack items="center" gap="$2" p="$2">
            <Spinner size="small" color="$blue10" />
            <Text fontSize="$2" color="$color10">
              Thinking…
            </Text>
          </XStack>
        ) : null}
      </YStack>

      {toast ? (
        <XStack px="$3" py="$1.5" bg="$color3" borderTopWidth={1} borderColor="$borderColor">
          <Text fontSize="$2" color="$color12" data-slot="crm-copilot-toast">
            {toast}
          </Text>
        </XStack>
      ) : null}

      <XStack p="$3" gap="$2" borderTopWidth={1} borderColor="$borderColor" bg="$color2" items="center">
        <Input
          flex={1}
          size="$3"
          value={prompt}
          onChangeText={setPrompt}
          onSubmitEditing={submitPrompt}
          placeholder="Ask Copilot…"
          aria-label="Ask AI Copilot"
          data-slot="crm-copilot-input"
        />
        <Button size="$3" theme="blue" disabled={busy || !prompt.trim()} onPress={submitPrompt} aria-label="Send prompt">
          <Send size={14} color="$color12" />
        </Button>
      </XStack>
    </YStack>
  )
}
