import { useState } from 'react'
import { XStack, YStack } from '@hanzo/gui'
import { Box, Gauge, LifeBuoy, Settings, Slack, Wrench } from '@hanzogui/lucide-icons-2'
import { RailBar, RailNotice, SessionRail, type RailAccount, type RailSession } from '@hanzo/ui/chat'

const RECENTS: RailSession[] = [
  { id: 's1', title: 'Rolling update and bootstrap CD', status: 'running' },
  { id: 's2', title: 'Reset to 2025 version', status: 'done' },
  { id: 's3', title: 'fix all unfixed bugs, add tests', status: 'error' },
  { id: 's4', title: 'Enterprise/OSS feature audit', status: 'idle' },
]

/** The account, and its menu: who, the organization as a choice, the account's places, and signing out. */
function account(org: string, setOrg: (o: string) => void): RailAccount {
  return {
    name: 'Dave',
    sub: org,
    email: 'dave@acme.test',
    groups: [
      {
        label: 'Organization',
        items: ['acme', 'zoo'].map((o) => ({ id: o, label: o, active: o === org, onPress: () => setOrg(o) })),
      },
      [
        { id: 'settings', label: 'Settings', icon: <Settings size={16} />, onPress: () => {} },
        { id: 'usage', label: 'Usage', icon: <Gauge size={16} />, onPress: () => {} },
        { id: 'help', label: 'Get help', icon: <LifeBuoy size={16} />, onPress: () => {} },
      ],
    ],
    onSignOut: () => {},
    signOutLabel: 'Log out',
  }
}

/** The rail — the name and a search at the head, New, the surface's places, the recents with their status, a notice, and the account with its menu. Collapse is an explicit toggle the host keeps. */
export function Default() {
  const [active, setActive] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [org, setOrg] = useState('acme')
  const [slack, setSlack] = useState(true)
  return (
    <XStack height={560}>
      <SessionRail
        brand="Hanzo Build"
        onSearch={() => {}}
        searchLabel="Search runs"
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
        notice={
          slack ? (
            <RailNotice icon={<Slack size={16} />} title="Try Hanzo in Slack" action="Set up" onAction={() => {}} onDismiss={() => setSlack(false)} />
          ) : undefined
        }
        account={account(org, setOrg)}
        collapsed={collapsed}
        onCollapse={setCollapsed}
        label="Runs"
      />
    </XStack>
  )
}

/** On a phone — narrow the window below md: the column goes, the bar over the pane opens the same rail as a drawer (menu, name, search), and anything chosen in the drawer closes it. */
export function Phone() {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<string | null>(null)
  return (
    <YStack width={390} height={560} borderWidth={1} borderColor="$borderColor">
      <RailBar onMenu={() => setOpen(true)} menuLabel="Open runs" brand="Hanzo Build" onBrand={() => setActive(null)} onSearch={() => {}} searchLabel="Search runs" />
      <SessionRail
        brand="Hanzo Build"
        onSearch={() => {}}
        onNew={() => setActive(null)}
        fresh={active === null}
        recents={RECENTS}
        active={active}
        onOpen={setActive}
        account={{ name: 'Sign in', onPress: () => {} }}
        open={open}
        onOpenChange={setOpen}
        label="Runs"
      />
    </YStack>
  )
}

/** A notice — an offer, its one action, and a way to put it away. The host remembers the dismissal. */
export function Notice() {
  return (
    <YStack width={256}>
      <RailNotice icon={<Slack size={16} />} title="Try Hanzo in Slack" action="Set up" onAction={() => {}} onDismiss={() => {}} />
    </YStack>
  )
}
