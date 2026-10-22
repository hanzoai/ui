// Every code surface the package draws, on one page, the way a host mounts them:
// under `<Hanzo>`, at their defaults, plus a CodeBlock pinned to each scheme and
// a shiki block in `codeTheme`. `scripts/code.mjs` reads every colour a browser
// computes here; it is also the page to open by hand.
import { createRoot } from 'react-dom/client'
import { Paragraph, SizableText, YStack } from '@hanzo/gui'

import '../dist/theme.css'
import '../src/styles/motion.css'
import { config } from '../src/gui-config'
import { Hanzo } from '../src/root'
import { CodeBlock } from '../src/backends/gui/code-block'
import { CodeEditor } from '../src/backends/gui/code-editor'
import { JsonTree } from '../src/backends/gui/json-tree'
import { InlineCode, Snippet } from '../src/backends/gui/snippet'
import { Terminal } from '../src/backends/gui/terminal'

const SOURCE = `// one client, every model
import { Hanzo } from '@hanzo/ai'

const ai = new Hanzo({ apiKey: process.env.HANZO_API_KEY })
const reply = await ai.chat({ model: 'zen', messages })
if (!reply.ok) return null`

const LINES = [
  { id: '1', input: 'hanzo login --device', output: 'Signed in as z@hanzo.ai', timestamp: new Date(0), type: 'success' as const },
  { id: '2', input: 'echo "zen" 42 true', output: 'zen 42 true', timestamp: new Date(0), type: 'success' as const },
  { id: '3', input: 'deploy', output: 'Command not found: deploy', timestamp: new Date(0), type: 'error' as const },
  { id: '4', input: 'help', output: 'Type a command, or help for the list', timestamp: new Date(0), type: 'info' as const },
]

const Case = ({ name, children }: { name: string; children: React.ReactNode }) => (
  <YStack data-code-case={name} gap="$2" maxW={760} width="100%">
    <SizableText size="$2" color="$aside">
      {name}
    </SizableText>
    {children}
  </YStack>
)

declare global {
  interface Window {
    __shiki?: string
  }
}

function Page() {
  return (
    <YStack minH="100vh" bg="$background" p="$6" gap="$5" items="center">
      <Case name="code-block">
        <CodeBlock code={SOURCE} language="typescript" filename="chat.ts" highlightLines={[4]} diff={{ added: [5], removed: [6] }} />
      </Case>
      <Case name="terminal">
        <Terminal initialCommands={LINES} height={300} />
      </Case>
      <Case name="snippet">
        <Snippet code={SOURCE} language="typescript" filename="chat.ts" showLineNumbers highlightLines={[2]} />
        <Snippet variant="command" code={'curl -fsSL hanzo.sh | sh\nhanzo login'} />
        <Paragraph size="$3" color="$ink">
          Install with <InlineCode>{'npm i @hanzo/ai'}</InlineCode>, then sign in.
        </Paragraph>
      </Case>
      <Case name="editor">
        <CodeEditor language="json" defaultValue={'{\n  "model": "zen",\n  "n": 1,\n  "stream": true,\n  "stop": null\n}'} />
        <JsonTree data={{ model: 'zen', n: 1, stream: true, stop: null }} depth={2} />
      </Case>
      <Case name="shiki">
        <div className="code-host" dangerouslySetInnerHTML={{ __html: window.__shiki ?? '' }} />
      </Case>
      <Case name="pinned-light">
        <CodeBlock code={SOURCE} language="typescript" theme="light" highlightLines={[1]} />
      </Case>
      <Case name="pinned-dark">
        <CodeBlock code={SOURCE} language="typescript" theme="dark" highlightLines={[1]} />
      </Case>
    </YStack>
  )
}

// What the published `styles.css` carries and `<Hanzo>` imports: the config's
// theme and token sheet. Off source there is no built sheet, so it is put on the
// document here, once, the way the file would be.
const sheet = document.createElement('style')
sheet.textContent = config.getCSS()
document.head.appendChild(sheet)
document.documentElement.style.setProperty('--hanzo-ui-styles', '1')

createRoot(document.getElementById('root')!).render(
  <Hanzo>
    <Page />
  </Hanzo>,
)
