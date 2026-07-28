'use client'

/**
 * CollectionsBrowser — the app-lane home: the DocTypes of a `module` (a CMS
 * "collection", an ERP document type, a Helpdesk ticket type are all just a
 * framework DocType tagged with that lane's module). It lists them, offers a
 * first-run "Set up" that installs the lane's fixtures
 * (`POST /v1/framework/modules/:module/install`), and a "New collection" that
 * opens the on-page content-type builder.
 *
 * Generic over the lane by construction: `module`, `label` and the first-run copy
 * are props, and where copy is unset it is DERIVED FROM THE LANE rather than
 * borrowed from one — the old default was the CMS's words, so an ERP org read
 * about Pages and Posts. CMS, ERP, Helpdesk and anything later render this same
 * component.
 *
 * Honest by construction — an org with the lane not yet installed sees the setup
 * call to action, never a fabricated collection.
 */
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Text, XStack, YStack } from '@hanzo/gui'
import { Boxes, Plus } from '@hanzogui/lucide-icons-2'

import { PageHeader } from '../product/PageHeader'
import { EmptyState } from '../product/EmptyState'
import { BackendStateCard, classifyBackend, type BackendState } from '../product/BackendState'
import type { IconLike } from '../product/color'
import type { FrameworkClient } from './client'
import type { DocType } from './types'
import { moduleDoctypes } from './fields'
import { CollectionBuilder } from './CollectionBuilder'
import { Action, ErrorBar, Loading, Meta } from './parts'
import { useContainerLayout } from './responsive'

export interface CollectionsBrowserProps {
  client: FrameworkClient
  /** The app lane: 'cms' | 'erp' | 'help' | 'crm' | … */
  module: string
  /** Human label for the lane (e.g. "Content"). */
  label: string
  subtitle: string
  /** Open a collection's records. */
  onOpen: (doctype: string) => void
  /**
   * First-run (pre-install) copy. The defect this fixes was not "there is a
   * default" — it was that the default was ONE LANE'S copy (the CMS's), so an ERP
   * org read about Pages and Posts. Unset now falls back to copy derived from the
   * lane's own `label`, which is true for every lane; a host that has better words
   * passes them.
   */
  setupDescription?: string
  setupBullets?: string[]
  /**
   * Schema AUTHORING injected. The library ships a real `CollectionBuilder`, so a
   * host that omits this still gets one; a host that wants its own (or wants the
   * affordance withheld from a read-only surface) supplies or suppresses it.
   */
  renderBuilder?: (p: { onSaved: (doctype: string) => void; onCancel: () => void }) => ReactNode
  /** Lane icon (defaults to the generic collection glyph). */
  icon?: IconLike
}

type LoadState =
  | { phase: 'loading' }
  | { phase: 'error'; error: BackendState }
  | { phase: 'ready'; collections: DocType[]; registered: boolean }

export function CollectionsBrowser({
  client,
  module,
  label,
  subtitle,
  onOpen,
  setupDescription,
  setupBullets,
  renderBuilder,
  icon = Boxes,
}: CollectionsBrowserProps) {
  const [state, setState] = useState<LoadState>({ phase: 'loading' })
  const [busy, setBusy] = useState(false)
  const [creating, setCreating] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const { phone, onLayout } = useContainerLayout()

  const load = useCallback(
    async (signal: { cancelled: boolean }) => {
      setState({ phase: 'loading' })
      try {
        const [dts, mod] = await Promise.all([
          client.doctypes.list(),
          client.modules.get(module).catch(() => null), // lane may not be registered on an older engine
        ])
        if (signal.cancelled) return
        setState({
          phase: 'ready',
          collections: moduleDoctypes(dts, module),
          registered: Boolean(mod && mod.doctypes.length),
        })
      } catch (e) {
        if (!signal.cancelled) setState({ phase: 'error', error: classifyBackend(e) })
      }
    },
    [client, module],
  )

  useEffect(() => {
    const signal = { cancelled: false }
    void load(signal)
    return () => {
      signal.cancelled = true
    }
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

  if (state.phase === 'loading') {
    return (
      <YStack onLayout={onLayout} width="100%">
        <Loading label={`Loading ${label}…`} />
      </YStack>
    )
  }

  if (state.phase === 'error') {
    return (
      <YStack onLayout={onLayout} gap="$3" width="100%">
        <PageHeader title={label} subtitle={subtitle} />
        <BackendStateCard state={state.error} onRetry={reload} hint="framework · GET /v1/framework/doctypes" />
      </YStack>
    )
  }

  const { collections } = state
  return (
    <YStack onLayout={onLayout} gap="$3" width="100%">
      <PageHeader
        title={label}
        subtitle={subtitle}
        actions={
          collections.length && !creating ? (
            <Action
              phone={phone}
              primary
              icon={<Plus size={15} />}
              onPress={() => {
                setCreating(true)
                setActionError(null)
              }}
            >
              New collection
            </Action>
          ) : undefined
        }
      />

      {actionError ? <ErrorBar message={actionError} /> : null}

      {creating ? (
        (renderBuilder ?? ((p) => <CollectionBuilder client={client} module={module} {...p} />))({
          onSaved: (name: string) => {
            setCreating(false)
            onOpen(name)
          },
          onCancel: () => setCreating(false),
        })
      ) : null}

      {collections.length === 0 && !creating ? (
        <EmptyState
          icon={icon}
          title={`Set up ${label}`}
          description={
            setupDescription ??
            `${label} is a set of collections on the Hanzo Framework — typed documents, per organization.`
          }
          bullets={
            setupBullets ?? [
              `Installs the default ${label} collections into your organization`,
              'Every record is a document on the framework — versioned, permissioned, per-org',
              'Add your own collections and fields any time',
            ]
          }
          primary={state.registered ? { label: busy ? 'Setting up…' : `Set up ${label}`, onPress: install } : undefined}
          secondary={{ label: 'New collection', onPress: () => setCreating(true) }}
        />
      ) : !creating ? (
        // A fixed 240px card is a 240px column on a 390px phone with dead space
        // beside it. `flexBasis` + `flexGrow` makes each card fill the row on a
        // phone and settle back to a 240px tile once the box can hold several.
        <XStack gap="$3" flexWrap="wrap" width="100%">
          {collections.map((dt) => (
            <YStack
              key={dt.name}
              onPress={() => onOpen(dt.name)}
              hoverStyle={{ borderColor: '$color8' }}
              pressStyle={{ bg: '$color3' }}
              cursor="pointer"
              borderWidth={1}
              borderColor="$borderColor"
              rounded="$4"
              p="$4"
              gap="$2"
              minH={88}
              grow={phone ? 1 : 0}
              flexBasis={phone ? '100%' : 240}
              maxW={phone ? undefined : 240}
            >
              <XStack gap="$2" items="center">
                <Boxes size={16} />
                <Text fontSize="$4" fontWeight="700" flex={1} minW={0} numberOfLines={1}>
                  {dt.name}
                </Text>
              </XStack>
              <Meta>
                {dt.fields?.length ?? 0} field{(dt.fields?.length ?? 0) === 1 ? '' : 's'}
                {dt.isSubmittable ? ' · submittable' : ''}
              </Meta>
            </YStack>
          ))}
        </XStack>
      ) : null}
    </YStack>
  )
}
