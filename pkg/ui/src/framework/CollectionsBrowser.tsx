'use client'

/**
 * CollectionsBrowser — the app-lane home: the DocTypes of a `module` (a CMS
 * "collection" IS a framework DocType tagged with the lane's module). It lists
 * them as cards, offers a first-run "Set up" that installs the lane's fixtures
 * (POST /v1/framework/modules/:module/install), and a "New collection" that opens
 * the dynamic content-type builder (name + typed fields, on-page). Everything is
 * per-org and honest — an org with the lane not yet installed sees the setup CTA,
 * never a fabricated collection.
 *
 * This is generic over `module`, so CMS (`cms`), ERP (`erp`), and Helpdesk
 * (`help`) all reuse it — the ONE collections home for every lane.
 */
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Card, Text, XStack, YStack } from '@hanzo/gui'
import { Boxes, Plus, TriangleAlert } from '@hanzogui/lucide-icons-2'

import { PageHeader } from '../product'
import { PrimaryButton } from '../product'
import { EmptyState } from '../product'
import { Loader } from './Loader'
import { BackendStateCard, classifyBackend, type BackendState } from '../product'
import type { FrameworkClient } from './client'
import type { DocType } from './types'
import { moduleDoctypes } from './fields'

export interface CollectionsBrowserProps {
  client: FrameworkClient
  /** The app lane: 'cms' | 'erp' | 'help' | … */
  module: string
  /** Human label for the lane (e.g. "Content"). */
  label: string
  subtitle: string
  /** Open a collection's records. */
  onOpen: (doctype: string) => void
  /**
   * Lane-appropriate copy for the first-run (pre-install) empty state. Optional and
   * defaulted to the CMS wording, so this component stays generic over the lane: a
   * CMS caller renders identically, while ERP/Help pass their own description +
   * bullets. Additive only — no behavior/permission/proxy change.
   */
  setupDescription?: string
  setupBullets?: string[]
  /**
   * Schema AUTHORING is a separate concern from schema USE, so it is injected
   * rather than imported: a host that can define collections (the console's
   * CollectionBuilder) supplies this; a host that only consumes them (a site
   * shell) omits it and the "New collection" affordance is simply not offered.
   * Nothing is faked either way.
   */
  renderBuilder?: (p: { onSaved: (doctype: string) => void; onCancel: () => void }) => ReactNode
}

type LoadState =
  | { phase: 'loading' }
  | { phase: 'error'; error: BackendState }
  | { phase: 'ready'; collections: DocType[]; registered: boolean }

export function CollectionsBrowser({ client, module, label, subtitle, onOpen, setupDescription, setupBullets, renderBuilder }: CollectionsBrowserProps) {
  const [state, setState] = useState<LoadState>({ phase: 'loading' })
  const [busy, setBusy] = useState(false)
  const [creating, setCreating] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback(
    async (signal: { cancelled: boolean }) => {
      setState({ phase: 'loading' })
      try {
        const [dts, mod] = await Promise.all([
          client.doctypes.list(),
          client.modules.get(module).catch(() => null), // module may not be registered on older cloud
        ])
        if (signal.cancelled) return
        setState({ phase: 'ready', collections: moduleDoctypes(dts, module), registered: Boolean(mod && mod.doctypes.length) })
      } catch (e) {
        if (!signal.cancelled) setState({ phase: 'error', error: classifyBackend(e) })
      }
    },
    [client, module],
  )

  useEffect(() => {
    const signal = { cancelled: false }
    void load(signal)
    return () => { signal.cancelled = true }
  }, [load])

  const reload = useCallback(() => void load({ cancelled: false }), [load])

  const install = useCallback(async () => {
    setBusy(true)
    setActionError(null)
    try {
      await client.modules.install(module)
      reload()
    } catch (e) {
      setActionError(classifyBackend(e).message)
    } finally {
      setBusy(false)
    }
  }, [client, module, reload])

  if (state.phase === 'loading') return <Loader label={`Loading ${label}…`} />
  if (state.phase === 'error') {
    return (
      <>
        <PageHeader title={label} subtitle={subtitle} />
        <BackendStateCard state={state.error} onRetry={reload} hint="framework · GET /v1/framework/doctypes" />
      </>
    )
  }

  const { collections } = state
  return (
    <>
      <PageHeader
        title={label}
        subtitle={subtitle}
        actions={
          renderBuilder && collections.length && !creating ? (
            <PrimaryButton size="$2" icon={<Plus size={15} />} onPress={() => { setCreating(true); setActionError(null) }}>New collection</PrimaryButton>
          ) : undefined
        }
      />

      {actionError ? (
        <Card borderWidth={1} borderColor="$red7" bg="$red2" p="$3" mb="$3" maxWidth={620}>
          <XStack gap="$2" items="center"><TriangleAlert size={15} /><Text fontSize="$3" color="$red11">{actionError}</Text></XStack>
        </Card>
      ) : null}

      {creating && renderBuilder ? (
        <YStack mb="$3">
          {renderBuilder({
            onSaved: (name) => { setCreating(false); onOpen(name) },
            onCancel: () => setCreating(false),
          })}
        </YStack>
      ) : null}

      {collections.length === 0 && !creating ? (
        <EmptyState
          icon={Boxes}
          title={`Set up ${label}`}
          description={setupDescription ?? `${label} is a set of content collections — Pages, Posts, Articles, Media, and Navigation — as DocTypes on the Hanzo Framework, per organization.`}
          bullets={setupBullets ?? [
            'Installs the default collections into your organization',
            'Content is documents on the framework — versioned, permissioned, per-org',
            'Add your own collections and fields any time',
          ]}
          primary={state.registered ? { label: busy ? 'Setting up…' : `Set up ${label}`, onPress: install } : undefined}
          secondary={renderBuilder ? { label: 'New collection', onPress: () => setCreating(true) } : undefined}
        />
      ) : !creating ? (
        <XStack gap="$3" flexWrap="wrap">
          {collections.map((dt) => (
            <YStack
              key={dt.name}
              onPress={() => onOpen(dt.name)}
              hoverStyle={{ borderColor: '$color8' }}
              cursor="pointer"
              borderWidth={1}
              borderColor="$borderColor"
              rounded="$4"
              p="$4"
              gap="$2"
              // Mobile first: fill the column on a phone, settle into a grid of
              // ~260px cards as the viewport allows. A fixed width would leave a
              // dead gutter at 390px, which is the width that has to work.
              flex={1}
              flexBasis={240}
              minW={200}
              maxW={340}
            >
              <XStack gap="$2" items="center">
                <Boxes size={16} />
                <Text fontSize="$4" fontWeight="700" numberOfLines={1}>{dt.name}</Text>
              </XStack>
              <Text fontSize="$2" color="$color10">
                {(dt.fields?.length ?? 0)} field{(dt.fields?.length ?? 0) === 1 ? '' : 's'}
                {dt.isSubmittable ? ' · submittable' : ''}
              </Text>
            </YStack>
          ))}
        </XStack>
      ) : null}
    </>
  )
}

