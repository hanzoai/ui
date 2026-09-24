import { useState } from 'react'
import { XStack } from '@hanzo/gui'
import { Box, Wrench } from '@hanzogui/lucide-icons-2'
import { SessionRail, type RailSession } from '@hanzo/ui/chat'

const RECENTS: RailSession[] = [
  { id: 's1', title: 'Rolling update and bootstrap CD', status: 'running' },
  { id: 's2', title: 'Reset to 2025 version', status: 'done' },
  { id: 's3', title: 'fix all unfixed bugs, add tests', status: 'error' },
  { id: 's4', title: 'Enterprise/OSS feature audit', status: 'idle' },
]

/** The rail — New, the surface's places, the recents with their status, and the account. Collapse is an explicit toggle the host keeps. */
export function Default() {
  const [active, setActive] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  return (
    <XStack height={440}>
      <SessionRail
        onNew={() => setActive(null)}
        fresh={active === null}
        links={[
          { id: 'artifacts', label: 'Artifacts', icon: <Box size={16} /> },
          { id: 'customize', label: 'Customize', icon: <Wrench size={16} /> },
        ]}
        more={[{ id: 'projects', label: 'Projects', icon: <Box size={16} /> }]}
        recents={RECENTS}
        active={active}
        onOpen={setActive}
        onSort={() => {}}
        account={{ name: 'z@hanzo.ai', onPress: () => {} }}
        onSettings={() => {}}
        onSearch={() => {}}
        collapsed={collapsed}
        onCollapse={setCollapsed}
      />
    </XStack>
  )
}
