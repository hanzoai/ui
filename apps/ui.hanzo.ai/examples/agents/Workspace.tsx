import { useState } from 'react'
import { YStack } from '@hanzo/gui'
import { History, PanelLeft, RefreshCw, Share2 } from '@hanzogui/lucide-icons-2'
import { Button } from '@hanzo/ui'
import { Thread, Message } from '@hanzo/ui/chat'
import {
  CHAT,
  Console,
  DEVICES,
  PageSelect,
  PreviewFrame,
  ProjectChip,
  Suggestions,
  SUGGESTIONS,
  VIEWS,
  Views,
  Workspace,
} from '@hanzo/ui/agents'

/** Builder — the whole frame: the bar, the chat beside the work, the preview, and the console under it. */
export function Builder() {
  const [view, setView] = useState('preview')
  const [device, setDevice] = useState('desktop')
  const [collapsed, setCollapsed] = useState(false)
  const [dock, setDock] = useState(36)
  return (
    <YStack width="100%" height={560} borderWidth={1} borderColor="$borderColor" rounded="$4" overflow="hidden">
      <Workspace
        collapsed={collapsed}
        pane={view === 'chat' ? 'chat' : 'view'}
        start={
          <>
            <ProjectChip name="MEGA Shop" />
            <Button variant="ghost" size="icon-sm" aria-label="History">
              <History size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Chat panel"
              aria-expanded={!collapsed}
              onClick={() => setCollapsed((c) => !c)}
            >
              <PanelLeft size={16} />
            </Button>
          </>
        }
        middle={
          <>
            <Views views={[...VIEWS, CHAT]} value={view} onChange={setView} label="Editor view" />
            <Views views={DEVICES} value={device} onChange={setDevice} label="Device" labels="none" />
            <Button variant="ghost" size="icon-sm" aria-label="Reload preview">
              <RefreshCw size={15} />
            </Button>
            <PageSelect pages={[{ id: '/', label: 'Homepage' }, { id: '/about', label: 'About' }]} value="/" onChange={() => {}} />
          </>
        }
        end={
          <>
            <Button variant="secondary" size="sm">
              <Share2 size={14} />
              Share
            </Button>
            <Button variant="primary" size="sm">
              Publish
            </Button>
          </>
        }
        chat={
          <YStack flex={1} gap="$2" p="$3">
            <Thread maxWidth={0}>
              <Message role="assistant">MEGA Shop is loaded. Tell me what to change and I will build it.</Message>
            </Thread>
            <Suggestions items={SUGGESTIONS} onPick={() => {}} />
          </YStack>
        }
        dock={<Console lines={[{ id: 1, level: 'log', text: 'ready on :3000', source: 'run' }]} height={dock} onHeight={setDock} />}
      >
        <PreviewFrame src="https://hanzo.ai/" device={device === 'mobile' ? 'mobile' : 'desktop'} />
      </Workspace>
    </YStack>
  )
}

/** Views — the segmented control the bar switches with: only the chosen view wears its label. */
export function ViewTabs() {
  const [view, setView] = useState('preview')
  return <Views views={VIEWS} value={view} onChange={setView} label="Editor view" />
}

/** Project chip — the switcher's trigger; the square is the name's initial unless a mark is given. */
export function Project() {
  return <ProjectChip name="MEGA Shop" />
}
