'use client'

/**
 * SocialResource — the ONE Hanzo Social product, assembled from the pieces in this
 * folder and driven by the injected `/v1/social` client. Sibling of CommerceResource:
 * it owns the fetch → honest loading / empty / error lifecycle and the drawers, so a
 * host is a transport binding plus a mount, nothing more.
 *
 * Every host renders THIS — the console's Publish product (and its social.hanzo.ai
 * host-mode) and the dedicated Hanzo Social app. Before it existed the whole
 * orchestration lived in the console's own SocialModule, so a second app could only
 * copy-paste it.
 *
 * Host-agnostic: no router, no auth module, no app `~/lib`. States are honest —
 * loading, a BackendStateCard on a `/v1` failure, real empty states, and a publish
 * failure surfaced verbatim (a 503 carries the exact missing OAuth-app credentials).
 */
import { useCallback, useEffect, useState } from 'react'
import { Text, XStack, YStack } from '@hanzo/gui'
import { Share2, Send, Link2, Plus, RefreshCw } from '@hanzogui/lucide-icons-2'

import { BackendStateCard, classifyBackend, type BackendState } from '../BackendState'
import { DataTable, type Column } from '../DataTable'
import { EmptyState } from '../EmptyState'
import { FieldRow, FieldText, FieldSelect } from '../Field'
import { PageHeader } from '../PageHeader'
import { PrimaryButton } from '../PrimaryButton'
import { StatusTag } from '../StatusTag'
import { SlideOver } from '../SlideOver'
import { formatPostTime, postPreview } from './format'
import { PostAgenda } from './PostAgenda'
import { PostComposer, type ComposeMode, type PostDraft } from './PostComposer'
import { ProviderReadinessList } from './ProviderReadinessList'
import { SocialSummaryBar } from './SocialSummaryBar'
import { ViewToggle, type PostView } from './ViewToggle'
import {
  PROVIDERS,
  type Account,
  type Post,
  type ProviderCapability,
  type SocialApi,
  type SocialSummary,
} from './api'

type Async<T> =
  | { phase: 'loading' }
  | { phase: 'error'; error: BackendState }
  | { phase: 'ready'; data: T }

type Data = { summary: SocialSummary; posts: Post[]; accounts: Account[]; providers: ProviderCapability[] }

const POST_COLUMNS: Column<Post>[] = [
  { key: 'content', header: 'Post', render: (p) => postPreview(p.content) },
  { key: 'channel', header: 'Channel', render: (p) => p.channel || '—' },
  { key: 'status', header: 'Status', render: (p) => <StatusTag status={p.status} /> },
  { key: 'scheduleAt', header: 'Scheduled', render: (p) => formatPostTime(p.scheduleAt) },
]

const ACCOUNT_COLUMNS: Column<Account>[] = [
  { key: 'handle', header: 'Account', render: (a) => a.handle || '—' },
  { key: 'provider', header: 'Network', render: (a) => a.provider || '—' },
  { key: 'status', header: 'Status', render: (a) => <StatusTag status={a.status} /> },
]

/** The post detail drawer — full content + publish results + a real Publish action. */
function PostDetail({ api, post, onChanged }: { api: SocialApi; post: Post; onChanged: () => void }) {
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const canPublish = post.status === 'draft' || post.status === 'scheduled' || post.status === 'failed'

  const publish = async () => {
    setPublishing(true)
    setError(null)
    try {
      await api.posts.publish(post.id)
      onChanged()
    } catch (e) {
      // A 503 (not configured) carries the exact missing credentials — show it verbatim.
      setError(classifyBackend(e).message || 'Publish failed.')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <YStack gap="$3" p="$4">
      <FieldRow label="Content">
        <Text fontSize="$3">{post.content || '—'}</Text>
      </FieldRow>
      <FieldRow label="Channel">
        <Text fontSize="$3">{post.channel}</Text>
      </FieldRow>
      <FieldRow label="Status">
        <StatusTag status={post.status} />
      </FieldRow>
      {post.scheduleAt > 0 ? (
        <FieldRow label="Scheduled">
          <Text fontSize="$3">{formatPostTime(post.scheduleAt)}</Text>
        </FieldRow>
      ) : null}
      {post.media.length > 0 ? (
        <FieldRow label="Media">
          <YStack gap="$1">
            {post.media.map((m) => (
              <Text key={m} fontSize="$2" color="$quiet">
                {m}
              </Text>
            ))}
          </YStack>
        </FieldRow>
      ) : null}
      {post.externalId ? (
        <FieldRow label="External id">
          <Text fontSize="$3" className="hz-tnum">
            {post.externalId}
          </Text>
        </FieldRow>
      ) : null}
      {post.error ? (
        <FieldRow label="Last error">
          <Text fontSize="$2" color="$red10">
            {post.error}
          </Text>
        </FieldRow>
      ) : null}
      {error ? (
        <Text fontSize="$2" color="$red10">
          {error}
        </Text>
      ) : null}
      {canPublish ? (
        <PrimaryButton onPress={publish} disabled={publishing} icon={<Send size={16} />}>
          {publishing ? 'Publishing…' : 'Publish now'}
        </PrimaryButton>
      ) : null}
    </YStack>
  )
}

/** The connect drawer — LIVE per-network readiness above a real account add. */
function ConnectAccount({
  api,
  providers,
  onCreated,
}: {
  api: SocialApi
  providers: ProviderCapability[]
  onCreated: () => void
}) {
  const [provider, setProvider] = useState<string>('x')
  const [handle, setHandle] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setSaving(true)
    setError(null)
    try {
      await api.accounts.create({ provider, handle: handle.trim(), status: 'connected' })
      onCreated()
    } catch (e) {
      setError(classifyBackend(e).message || 'Failed to connect account.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <YStack gap="$4" p="$4">
      <ProviderReadinessList providers={providers} />
      <YStack gap="$3">
        <FieldRow label="Network">
          <FieldSelect value={provider} options={[...PROVIDERS]} onChange={setProvider} disabled={saving} />
        </FieldRow>
        <FieldRow label="Handle">
          <FieldText value={handle} onChange={setHandle} placeholder="@hanzo" disabled={saving} />
        </FieldRow>
        {error ? (
          <Text fontSize="$2" color="$red10">
            {error}
          </Text>
        ) : null}
        <PrimaryButton onPress={submit} disabled={saving}>
          {saving ? 'Connecting…' : 'Connect account'}
        </PrimaryButton>
      </YStack>
    </YStack>
  )
}

export function SocialResource({
  api,
  title = 'Publish',
  subtitle = 'Compose, schedule and publish your content across networks — per org, over the native /v1/social engine.',
}: {
  /** The bound `/v1/social` client — `createSocialApi(<host transport>)`. */
  api: SocialApi
  title?: string
  subtitle?: string
}) {
  const [state, setState] = useState<Async<Data>>({ phase: 'loading' })
  const [view, setView] = useState<PostView>('list')
  const [composing, setComposing] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [openPost, setOpenPost] = useState<Post | null>(null)

  const load = useCallback(async () => {
    setState({ phase: 'loading' })
    try {
      const [summary, posts, accounts, providers] = await Promise.all([
        api.summary(),
        api.posts.list(),
        api.accounts.list(),
        api.providers(),
      ])
      setState({ phase: 'ready', data: { summary, posts, accounts, providers } })
    } catch (e) {
      setState({ phase: 'error', error: classifyBackend(e) })
    }
  }, [api])

  useEffect(() => {
    void load()
  }, [load])

  const providers = state.phase === 'ready' ? state.data.providers : []
  const posts = state.phase === 'ready' ? state.data.posts : []
  const accounts = state.phase === 'ready' ? state.data.accounts : []
  const empty = state.phase === 'ready' && posts.length === 0 && accounts.length === 0

  /**
   * Persist a composed draft. Total by contract (the composer never throws): resolve
   * null when it landed, or the message to keep on screen. A publish-now whose fan-out
   * failed comes back as a `failed` post — that is a message, not a success.
   */
  const submitDraft = async (draft: PostDraft, mode: ComposeMode): Promise<string | null> => {
    try {
      const created = await api.posts.create(draft)
      if (mode === 'now' && created.status === 'failed') return created.error || 'Publish failed.'
    } catch (e) {
      return classifyBackend(e).message || 'Failed to create post.'
    }
    setComposing(false)
    void load()
    return null
  }

  return (
    <YStack gap="$4" p="$4">
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <>
            <PrimaryButton onPress={() => setComposing(true)} icon={<Plus size={16} />}>
              New post
            </PrimaryButton>
            <PrimaryButton onPress={() => setConnecting(true)} icon={<Link2 size={16} />}>
              Connect account
            </PrimaryButton>
            <PrimaryButton onPress={() => void load()} icon={<RefreshCw size={16} />}>
              Refresh
            </PrimaryButton>
          </>
        }
      />

      {state.phase === 'error' ? (
        <BackendStateCard state={state.error} onRetry={() => void load()} />
      ) : empty ? (
        <YStack gap="$4">
          {state.phase === 'ready' ? <SocialSummaryBar summary={state.data.summary} /> : null}
          <EmptyState
            icon={Share2}
            title="No posts or accounts yet"
            description="Connect a social account, then compose, schedule and publish across X, Instagram, LinkedIn, TikTok and more."
            primary={{ label: 'New post', onPress: () => setComposing(true) }}
          />
        </YStack>
      ) : (
        <YStack gap="$5">
          {state.phase === 'ready' ? <SocialSummaryBar summary={state.data.summary} /> : null}

          <YStack gap="$3">
            <XStack items="center" justify="space-between" gap="$2" flexWrap="wrap">
              <XStack items="center" gap="$2">
                <Send size={16} />
                <Text fontSize="$5" fontWeight="500">
                  Posts
                </Text>
              </XStack>
              <ViewToggle view={view} onChange={setView} />
            </XStack>

            {view === 'list' ? (
              <DataTable<Post>
                columns={POST_COLUMNS}
                rows={posts}
                loading={state.phase === 'loading'}
                empty="No posts yet."
                rowKey={(p) => p.id}
                onRowPress={(p) => setOpenPost(p)}
              />
            ) : (
              <PostAgenda posts={posts} onOpen={(p) => setOpenPost(p)} />
            )}
          </YStack>

          <YStack gap="$2">
            <XStack items="center" gap="$2">
              <Link2 size={16} />
              <Text fontSize="$5" fontWeight="500">
                Accounts
              </Text>
            </XStack>
            <DataTable<Account>
              columns={ACCOUNT_COLUMNS}
              rows={accounts}
              loading={state.phase === 'loading'}
              empty="No accounts connected yet."
              rowKey={(a) => a.id}
            />
          </YStack>
        </YStack>
      )}

      <SlideOver open={composing} onClose={() => setComposing(false)} title="New post" icon={Send} ariaLabel="New post">
        <PostComposer channels={[...PROVIDERS]} providers={providers} onSubmit={submitDraft} />
      </SlideOver>
      <SlideOver
        open={connecting}
        onClose={() => setConnecting(false)}
        title="Connect account"
        icon={Link2}
        ariaLabel="Connect account"
      >
        <ConnectAccount
          api={api}
          providers={providers}
          onCreated={() => {
            setConnecting(false)
            void load()
          }}
        />
      </SlideOver>
      <SlideOver open={openPost !== null} onClose={() => setOpenPost(null)} title="Post" icon={Send} ariaLabel="Post detail">
        {openPost ? (
          <PostDetail
            api={api}
            post={openPost}
            onChanged={() => {
              setOpenPost(null)
              void load()
            }}
          />
        ) : null}
      </SlideOver>
    </YStack>
  )
}
