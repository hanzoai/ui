'use client'

/**
 * The record kit's feedback in the gallery: skeletons, the dot loader, both
 * progress shapes and the ring, toasts at rest in every status, banners and
 * callouts in every colour and layout, the boxed JSON tree, the metric row,
 * the command block and the headed code editor (twenty-ui, MIT — NOTICE).
 * Every variant that carries a style of its own is rendered, so its rules ship.
 */
import { Bot, Sparkles } from '@hanzogui/lucide-icons-2'
import { Section } from './section'
import { Skeleton } from '../backends/gui/skeleton'
import { Spinner } from '../backends/gui/spinner'
import { Progress } from '../backends/gui/progress'
import { ProgressRing } from '../backends/gui/progress-ring'
import { ToastCard } from '../backends/gui/toaster'
import { Banner, BannerAction } from '../backends/gui/banner'
import { Alert, AlertDescription, AlertTitle, CalloutAction } from '../backends/gui/alert'
import { JsonTree } from '../backends/gui/json-tree'
import { Snippet } from '../backends/gui/snippet'
import { CodeEditor } from '../backends/gui/code-editor'
import { Button } from '../backends/gui/button'
import { Fact } from '../product/Fact'

const NOOP = () => {}

const RUN = {
  trigger: { type: 'DATABASE_EVENT', object: 'person', fields: ['email', 'name'] },
  output: { id: 'p_42', name: 'Ada Lovelace', score: 0.97, active: true, owner: null, tags: [] },
}

const MARK = (path: string) => (path === 'output.name' ? 'blue' : path === 'output.owner' ? 'red' : path === 'output' ? 'partial-blue' : null)

export function Feedback() {
  return (
    <>
      <Section name="skeleton-record">
        <div style={{ width: 240, fontSize: 13 }}>
          Loading <Skeleton width={80} /> records
        </div>
        {(['xs', 's', 'm', 'l', 'xl'] as const).map((size) => (
          <Skeleton key={size} layout="block" size={size} width={120} />
        ))}
        <Skeleton layout="block" width={120} animated={false} />
      </Section>

      <Section name="loader">
        <Spinner variant="dot" />
        <Spinner variant="dot" color="var(--state-error)" />
        <div style={{ color: 'var(--state-success)' }}>
          <Spinner variant="dot" />
        </div>
      </Section>

      <Section name="progress-record">
        <Progress value={40} />
        <Progress value={40} variant="line" />
        <Progress value={1} variant="line" />
        <Progress value={60} variant="line" ends="round" track size="sm" />
        <Progress value={null} />
        <Progress value={null} variant="line" />
        <ProgressRing value={40}>40%</ProgressRing>
        <ProgressRing value={0} size="sm" aria-label="Not started" />
        <ProgressRing value={100} aria-label="Done" />
        <ProgressRing value={null} aria-label="Working" />
      </Section>

      <Section name="toast-record">
        <ToastCard t={{ title: 'Record created', type: 'default' }} duration={6000} paused />
        <ToastCard t={{ title: 'Link copied', type: 'info' }} duration={6000} paused />
        <ToastCard t={{ title: 'Merged 3 records', description: 'Acme, Acme Inc. and ACME', type: 'success' }} duration={6000} paused />
        <ToastCard t={{ title: '3 of 5 files imported', type: 'warning', cancel: { label: 'Cancel', onClick: NOOP } }} duration={6000} paused />
        <ToastCard t={{ title: 'Delete failed', type: 'error', action: { label: 'Retry', onClick: NOOP } }} duration={6000} paused />
        <ToastCard t={{ title: 'Importing people', type: 'info', data: { progress: 60 } }} />
        <ToastCard t={{ title: 'On a phone', type: 'success' }} phone />
      </Section>

      <Section name="banner-record">
        <Banner status="info" action={<BannerAction>Reconnect</BannerAction>}>
          Your mailbox needs reconnecting.
        </Banner>
        <Banner status="error" onClose={NOOP}>
          Sync failed for 2 accounts.
        </Banner>
        <Banner status="neutral">This is a sandbox workspace.</Banner>
        <Banner status="success" emphasis="soft">
          Everything is synced.
        </Banner>
        <Banner status="warning" layout="inline">
          This field is used by 3 workflows.
        </Banner>
        <Banner color="blue" layout="inline" embedded icon={<Sparkles size={16} />}>
          Fields can be renamed later.
        </Banner>
        <Banner status="error" layout="compact" action={<BannerAction>Restore</BannerAction>}>
          This record was deleted.
        </Banner>
        <Banner variant="warning">The legacy strip, unchanged.</Banner>
      </Section>

      <Section name="callout">
        <Alert
          status="info"
          title="Code steps run in a sandbox"
          description="They can read the trigger's output and the steps before them."
          action={<CalloutAction>Learn more</CalloutAction>}
          onDismiss={NOOP}
        />
        <Alert status="error" title="This object cannot be deleted" description="Two relations point at it." />
        <Alert status="success" title="Webhook verified" />
        <Alert status="warning" title="Rate limited" icon={<Bot size={16} />} fullWidth />
        <Alert color="gray" title="No description" icon={null} />
        <Alert>
          <AlertTitle>The legacy alert</AlertTitle>
          <AlertDescription>Unchanged when no record prop is given.</AlertDescription>
        </Alert>
      </Section>

      <Section name="json-record">
        <JsonTree data={RUN} variant="boxed" depth={3} title="Run" getNodeHighlighting={MARK} onNodeValueClick={NOOP} />
        <JsonTree
          variant="boxed"
          search={false}
          showCopyButton={false}
          entries={[
            { id: 'trigger', label: 'Trigger', value: RUN.trigger },
            { id: 'step1', label: 'Find person', value: '' },
          ]}
        />
      </Section>

      <Section name="metric">
        <div style={{ width: 260 }}>
          <Fact variant="metric" label="Context window" value="12k / 200k" progress={6} startIcon={<Bot size={14} />} />
          <Fact variant="metric" label="Usage" value="$4.20" />
          <Fact variant="metric" label="Indexing" value="" progress={null} />
        </div>
      </Section>

      <Section name="command-block">
        <Snippet variant="command" code={'npx hanzo mcp add\nhanzo login'} />
        <Snippet variant="command" code="curl https://api.hanzo.ai/v1/models" actions={<Button size="xs" variant="ghost">Run</Button>} />
      </Section>

      <Section name="code-editor-record">
        <CodeEditor title="Code step" language="json" defaultValue={'{\n  "a": 1\n}'} actions={<Button size="xs" variant="ghost">Test</Button>} />
        <CodeEditor variant="borderless" language="javascript" defaultValue="return input" showLanguageSelector={false} autoHeight />
      </Section>
    </>
  )
}
