'use client'

import { useEffect, useRef, useState, type ComponentType, type FormEvent, type ReactNode } from 'react'
import { useI18n } from '@hanzo/i18n/react'
import { Binoculars, Calendar, ChartLine, Clock, Code, Dna, EyeOff, FileText, Gavel, GraduationCap, HeartHandshake, LayoutGrid, Library, Lightbulb, MessageSquare, Palette, Pencil, Presentation, User } from '@hanzogui/lucide-icons-2'
import { Button } from '../backends/gui/button'
import { Field } from '../backends/gui/field'
import { Input } from '../backends/gui/input'
import { Anchor, Paragraph, XStack, YStack } from '../backends/gui/layout'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../backends/gui/select'
import { Switch } from '../backends/gui/switch'
import { API } from './api'
import { Page, Panel } from './frame'
import { Primary } from './screens'
import { useSession, type Track } from './hooks'
import { OWN_TOPIC, ROLES, ROLES_PLACEHOLDER, ROLES_SUBTITLE, ROLES_TITLE, type Glyph } from './roles'
import { chatStep } from './state'

/**
 * Before a person's first chat: what to know, then a name, then a role with
 * three starter prompts. ONE component for every chat surface (hanzo.chat,
 * hanzo.ai/chat, hanzo.app, the desktop app); each finished step is saved on the
 * IAM user, so nobody sees a step twice.
 *
 * `onDone` receives what the person chose to open the chat with: a starter's full
 * prompt, or nothing for an empty chat. Its words are the reader's language
 * (@hanzo/i18n `t`); a starter's prompt is the one in the words pressed, while
 * the role it saves and the events it sends stay in English.
 */

export interface ChatOnboardingProps {
  site?: string
  api?: string
  track?: Track
  onDone: (start: { prompt?: string; role?: string }) => void
  /** Where "Learn more" about training goes. */
  privacyPath?: string
  /** Show the safeguards row. Only a host whose router really runs a guard on chats may say so. */
  safeguards?: boolean
}

const ICONS: Record<Glyph, ComponentType<{ size?: number }>> = {
  binoculars: Binoculars,
  books: Library,
  bulb: Lightbulb,
  calendar: Calendar,
  cap: GraduationCap,
  chart: ChartLine,
  chat: MessageSquare,
  clock: Clock,
  code: Code,
  dna: Dna,
  doc: FileText,
  gavel: Gavel,
  grid: LayoutGrid,
  palette: Palette,
  pencil: Pencil,
  person: User,
  slides: Presentation,
}

export function ChatOnboarding({ site = 'Hanzo', api = API, track, onDone, privacyPath = '/settings/privacy', safeguards = false }: ChatOnboardingProps) {
  const { t } = useI18n()
  const session = useSession(api)
  const [role, setRole] = useState('')
  const [name, setName] = useState('')
  const [train, setTrain] = useState(true)
  const [busy, setBusy] = useState(false)
  const announced = useRef(false)

  const at = session.loading ? null : chatStep(session.progress, Boolean(session.name))

  useEffect(() => {
    if (at !== 'done' || announced.current) return
    announced.current = true
    // A person who finished every step opens the chat as they left it.
    onDone({ role: session.progress.role })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [at])

  if (!at || at === 'done') return <Page site={site} title="" busy />

  if (at === 'notice') {
    return (
      <Page site={site} title={t('Before your first chat')} lede={t('A few things to know, plus one setting to review')} center width={512}>
        <Panel label={t('Before your first chat')}>
          <Row icon={<EyeOff size={20} />}>
            <b>{t('Ad-free chats:')}</b>
            {` ${t('We won’t show you ads or let advertisers influence what {site} says.', { site })}`}
          </Row>
          {safeguards ? (
            <Row icon={<HeartHandshake size={20} />}>
              <b>{t('Built to help, not harm:')}</b>
              {` ${t('Automated safeguards protect your chats from violent, abusive, or deceptive content.')}`}
            </Row>
          ) : null}
          <Row icon={<Switch checked={train} onCheckedChange={setTrain} aria-label={t('Help improve our AI models')} />}>
            <b>{t('Help improve our AI models:')}</b>
            {` ${t('Allow the use of your chats and coding sessions to train and improve Zen models.')} ${t('Change anytime in privacy settings.')} `}
            <Anchor href={privacyPath} color="$ink" textDecorationLine="underline">
              {t('Learn more')}
            </Anchor>
          </Row>
        </Panel>
        <Primary
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            await session.setTrain(train).catch(() => undefined)
            track?.('first_chat_notice_accepted', { train_opt_in: train })
            await session.save({ notice: true })
            setBusy(false)
          }}
        >
          {t('Continue')}
        </Primary>
      </Page>
    )
  }

  if (at === 'name') {
    const submit = async (e?: FormEvent) => {
      e?.preventDefault()
      if (!name.trim() || busy) return
      setBusy(true)
      try {
        await session.setName(name.trim())
        track?.('name_set', {})
      } finally {
        setBusy(false)
      }
    }
    return (
      <Page site={site} title={t('What’s your name?')} lede={t('So {site} knows what to call you.', { site })} center>
        <YStack render={<form onSubmit={submit} noValidate />} gap="$4" items="stretch">
          <Field gap="$2">
            <Input name="name" autoComplete="name" aria-label={t('Your name')} value={name} onChangeText={setName} placeholder={t('Your name')} height={48} autoFocus />
          </Field>
          <Primary type="submit" disabled={!name.trim() || busy}>
            {t('Continue')}
          </Primary>
        </YStack>
      </Page>
    )
  }

  const chosen = ROLES.find((r) => r.role === role)
  const pick = async (prompt?: string) => {
    if (busy || !chosen) return
    setBusy(true)
    track?.('usage_selected', { use: session.progress.use ?? 'personal', role: chosen.role })
    await session.save({ role: chosen.role })
    onDone({ prompt, role: chosen.role })
  }
  return (
    <Page site={site} title={t(ROLES_TITLE)} lede={t(ROLES_SUBTITLE)} center width={450}>
      <Select
        value={role}
        onValueChange={(v: string) => {
          setRole(v)
          track?.('role_selected', { role: v })
        }}
      >
        <SelectTrigger aria-label={t('Your role')} height={48}>
          <SelectValue placeholder={t(ROLES_PLACEHOLDER)} />
        </SelectTrigger>
        <SelectContent>
          {ROLES.map((r) => (
            <SelectItem key={r.role} value={r.role}>
              {t(r.role)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {chosen ? (
        <YStack gap="$3">
          {chosen.prompts.map((p) => {
            const Icon = ICONS[p.icon]
            return (
              <Button
                key={p.label}
                type="button"
                variant="secondary"
                disabled={busy}
                minH={68}
                px="$5"
                rounded="$3"
                justify="flex-start"
                gap="$4"
                onClick={() => {
                  track?.('starter_prompt_used', { role: chosen.role, prompt: p.label })
                  void pick(t(p.prompt))
                }}
              >
                <Icon size={20} />
                {t(p.label)}
              </Button>
            )
          })}
          <Button
            type="button"
            variant="link"
            size="lg"
            disabled={busy}
            self="center"
            onClick={() => {
              track?.('own_topic_chosen', { role: chosen.role })
              void pick(undefined)
            }}
          >
            {t(OWN_TOPIC)}
          </Button>
        </YStack>
      ) : null}
    </Page>
  )
}

/** One line of the notice: a mark or a switch, then the words. */
function Row({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <XStack gap="$4" items="flex-start">
      <XStack width={40} justify="center" pt="$0.5">
        {icon}
      </XStack>
      <Paragraph size="$2" color="$ink" flex={1} m={0}>
        {children}
      </Paragraph>
    </XStack>
  )
}
