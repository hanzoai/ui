// The one composer at the foot of a page, the way Chat and Dev hand it their
// slots: `?case=chat` the model, the effort, `+`, dictation and voice mode;
// `?case=dev` the three pills (where the run goes, the repository, the branch),
// a file the draft carries, the commands and the chips, the effort and the
// mode. `&forgetful` draws it for a conversation nothing keeps.
// `scripts/composer.mjs` measures it in a real browser; it is also the page to
// open by hand.
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Paragraph, YStack } from '@hanzo/gui'
import { CircleDot, Cloud, Code, FileText } from '@hanzogui/lucide-icons-2'
import type { Machine } from '@hanzo/voice'

import '../dist/theme.css'
import '../src/styles/motion.css'
import { config } from '../src/gui-config'
import { Hanzo } from '../src/root'
import { Composer, type ComposerProps } from '../src/chat/Composer'
import { EFFORTS } from '../src/chat/ways'
import { BranchSelect } from '../src/product/BranchSelect'
import { ChipSelect } from '../src/product/ChipSelect'
import { RepoSelect } from '../src/product/RepoSelect'

const query = new URLSearchParams(location.search)
const dev = query.get('case') === 'dev'
const forgetful = query.has('forgetful')

/** A microphone at rest: dictation and voice mode drawn, nothing listening. */
const IDLE: Machine = { state: 'idle', open: false, level: 0, blocked: null, reason: null, refusal: null, toggle: () => {} }

const PLACES = [{ id: 'sandbox', label: 'Cloud', icon: <Cloud size={13} color="$soft" /> }]

function Page() {
  const [draft, setDraft] = useState('')
  const [effort, setEffort] = useState(dev ? 'max' : 'auto')
  const [repo, setRepo] = useState({ owner: 'acme', name: 'universe' })
  const [branch, setBranch] = useState('main')
  const shared: ComposerProps = {
    column: true,
    value: draft,
    onChange: setDraft,
    onSend: () => setDraft(''),
    plus: { upload: () => {}, memory: { on: true, set: () => {} } },
    effort: { value: effort, set: setEffort, items: dev ? EFFORTS.filter((e) => ['auto', 'high', 'xhigh', 'max'].includes(e.id)) : EFFORTS },
    voice: IDLE,
    talk: IDLE,
    forgetful,
    mind: { model: 'opus-5.5', models: [{ id: 'opus-5.5', name: 'Opus 5.5' } as never], loading: false, error: null, note: '', free: false, pick: () => {} },
  }
  const slots: Partial<ComposerProps> = dev
    ? {
        label: 'Describe a task or ask a question',
        placeholder: 'Ask, build, or run anything…',
        pills: (
          <>
            <ChipSelect name="Where the run runs" icon={PLACES[0]!.icon} label="Cloud" chosen={PLACES[0]} items={PLACES} onChange={() => {}} placement="top-start" />
            <RepoSelect value={repo} onChange={setRepo} load={async () => ({ repos: [repo] })} placement="top-start" />
            <BranchSelect value={branch} onChange={setBranch} load={async () => ({ branches: ['main', 'dev'] })} placement="top-start" />
          </>
        ),
        carried: [{ id: 'f', label: 'notes.md', icon: <FileText size={13} color="$soft" />, onRemove: () => {} }],
        commands: [{ id: 'run', label: 'Run', run: () => {} }],
        mode: { value: 'manual', set: () => {}, items: [{ id: 'auto', label: 'Auto', note: 'Runs on its own' }, { id: 'manual', label: 'Manual', note: 'Asks first' }] },
        chips: [
          { id: 'repos', label: 'Repos', icon: <Code size={13} color="$soft" />, onPress: () => {} },
          { id: 'issues', label: 'Issues', icon: <CircleDot size={13} color="$soft" />, onPress: () => {} },
        ],
      }
    : { label: 'Message', placeholder: 'Type / for skills' }
  return (
    <YStack height="100dvh" bg="$background" justify="flex-end" gap="$3" pb={12}>
      {Array.from({ length: 4 }, (_, i) => (
        <Paragraph key={i} size="$3" color="$aside" px="$4" maxW={640} self="center">
          A page with words behind the composer, so the glass has something to soften as the conversation scrolls under the frame.
        </Paragraph>
      ))}
      <Composer {...shared} {...slots} />
    </YStack>
  )
}

// What the published `styles.css` carries and `<Hanzo>` imports, put on the
// document once off source, the way the file would be (see corner.mount.tsx).
const sheet = document.createElement('style')
sheet.textContent = config.getCSS()
document.head.appendChild(sheet)
document.documentElement.style.setProperty('--hanzo-ui-styles', '1')

createRoot(document.getElementById('root')!).render(
  <Hanzo>
    <Page />
  </Hanzo>,
)
