'use client'

/**
 * The record kit's frames in the gallery: the side panel's record frame (bar,
 * body, footer) at its 400px width (the record kit's side panel, MIT, NOTICE),
 * and the command menu on the surface that holds it.
 *
 * The frame is drawn from its parts rather than through an open DetailPane: a
 * pane opens through its API, which a server render never calls, and the parts
 * are exactly what an open docked pane draws. Every field here passes
 * `autoFocus={false}`, as the menus do, so the page is not pulled to it on load.
 */
import { Building2, Copy, Plus, Settings, Users } from '@hanzogui/lucide-icons-2'
import { YStack } from '@hanzo/gui'
import { Section } from './section'
import { Button } from '../backends/gui/button'
import { PaneBar, PaneBody, PaneFoot } from '../product/DetailPane'
import { CommandMenu, type CommandMenuGroup } from '../product/CommandMenu'
import { Text } from '../backends/gui/layout'

const NOOP = () => {}

const GROUPS: CommandMenuGroup[] = [
  {
    id: 'record',
    label: 'Record',
    items: [
      { id: 'create', label: 'Create company', icon: <Plus size={16} />, contextual: 'Companies', onSelect: NOOP },
      { id: 'copy', label: 'Copy link', icon: <Copy size={16} />, shortcut: ['Mod', 'L'], onSelect: NOOP },
    ],
  },
  {
    id: 'go',
    label: 'Go to',
    items: [
      { id: 'people', label: 'Go to People', icon: <Users size={16} />, shortcut: [['G'], ['P']], onSelect: NOOP },
      { id: 'settings', label: 'Settings', icon: <Settings size={16} />, submenu: true, onSelect: NOOP },
      { id: 'billing', label: 'Billing', icon: <Settings size={16} />, disabled: true, onSelect: NOOP },
    ],
  },
]

export function Frames() {
  return (
    <>
      <Section name="pane-record">
        <YStack width={400} height={320} bg="$background" borderLeftWidth={1} borderColor="$borderColor">
          <PaneBar
            actions={
              <Button size="icon-xs" variant="ghost" emphasis="subtle" aria-label="Copy link">
                <Copy />
              </Button>
            }
          >
            <Building2 size={16} color="$aside" />
            <Text fontSize="$2" fontWeight="500" color="$ink" numberOfLines={1}>
              Acme Corporation
            </Text>
          </PaneBar>
          <PaneBody>
            <Text fontSize="$2" color="$aside">
              The record&apos;s fields, timeline and notes.
            </Text>
          </PaneBody>
          <PaneFoot>
            <Button size="sm" variant="ghost">
              Cancel
            </Button>
            <Button size="sm" variant="primary">
              Save
            </Button>
          </PaneFoot>
        </YStack>
      </Section>
      <Section name="command-menu">
        <YStack width={400} height={360} bg="$background" borderLeftWidth={1} borderColor="$borderColor">
          <CommandMenu groups={GROUPS} autoFocus={false} />
        </YStack>
        <YStack width={400} height={160} bg="$background" borderLeftWidth={1} borderColor="$borderColor">
          <CommandMenu groups={GROUPS} query="zzzz" autoFocus={false} />
        </YStack>
      </Section>
    </>
  )
}
