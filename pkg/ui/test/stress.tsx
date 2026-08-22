// Every shell that pins something, given LESS room than its content.
//
// A shell promises "the middle scrolls, the edges stay put", and that promise is
// only testable when the middle is over-filled. The gallery frames its sidebar
// at 320px and puts four rows in it, so every arrangement looks identical there
// — which is why a sidebar that pinned nothing shipped past it.
import { View } from 'react-native-web'
import { Text, XStack, YStack } from '@hanzo/gui'

import { Fill, Screen } from '../src/backends/gui/screen'
import {
  Sidebar,
  SidebarHeader,
  SidebarItem,
  SidebarScroll,
  SidebarSection,
  SidebarUser,
} from '../src/chat/Sidebar'
import { SlideOver } from '../src/product/SlideOver'
import { Workbench } from '../src/product/Workbench'

const NOOP = () => {}
const MANY = Array.from({ length: 24 }, (_, i) => `Thread number ${i + 1}`)

// One unbroken token — a request id, a hash, an address. A wrapping text's
// min-content width is its longest WORD, so this is what floors a column that
// cannot shrink.
const LONG = 'reallyquitelongunbrokenidentifier0123456789abcdefghijklmnop'

const Frame = ({
  name,
  w,
  h,
  expect,
  children,
}: {
  name: string
  w: number
  h: number
  /** `fail` marks a negative control — the gate fails if it PASSES. */
  expect?: 'fail'
  children: React.ReactNode
}) => (
  <div data-frame={name} data-expect={expect} style={{ width: w, height: h, display: 'flex' }}>
    {children}
  </div>
)

/**
 * Is the instrument switched on.
 *
 * Both style systems here register their rules from the RUNNING app, so a page
 * that renders without them looks like plain block-level HTML and every shell on
 * it "fails" containment for a reason that has nothing to do with the shell.
 * That is not hypothetical: it is what the first version of this harness did,
 * and a negative control cannot catch it, because an unstyled document fails the
 * control too — for the wrong reason, which reads as success.
 *
 * So the run asserts the styling is present BEFORE it believes a single box:
 * rnw's View base rule (`display:flex`, and the `minHeight:0` this file used to
 * make claims about) and gui's own column stack.
 */
const Probe = () => (
  <div style={{ position: 'absolute', visibility: 'hidden', pointerEvents: 'none' }}>
    {/* Wrapped rather than tagged: rnw's View forwards `dataSet`, gui forwards
        `data-*`, and a probe that depends on which is which tests the prop
        plumbing instead of the stylesheet. The child is what gets read. */}
    <div data-probe="rnw">
      <View />
    </div>
    <div data-probe="gui">
      <YStack />
    </div>
  </div>
)

export const Stress = () => (
  <YStack>
    <Probe />

    {/* The reference: Screen + Fill, the recipe as a component. If the probe
        cannot pass THIS, the probe is wrong, not the component. */}
    <Frame name="screen" w={280} h={320}>
      <Screen>
        <XStack height={36} bg="$panel">
          <Text>head</Text>
        </XStack>
        <Fill>
          {MANY.map((t) => (
            <Text key={t}>{t}</Text>
          ))}
        </Fill>
        <XStack height={44} bg="$panel">
          <Text>foot</Text>
        </XStack>
      </Screen>
    </Frame>

    {/* SidebarScroll's own docstring: "the scrolling middle, so header and user
        chip stay pinned". The user chip is what must stay inside. */}
    <Frame name="sidebar" w={260} h={320}>
      <Sidebar>
        <SidebarHeader title="Hanzo" onOpenSwitcher={NOOP} onSearch={NOOP} onCollapse={NOOP} />
        <SidebarScroll>
          <SidebarSection label="Today">
            {MANY.map((t) => (
              <SidebarItem key={t} onPress={NOOP}>
                {t}
              </SidebarItem>
            ))}
          </SidebarSection>
        </SidebarScroll>
        <SidebarUser name="z" secondary="z@hanzo.ai" onPress={NOOP} onHelp={NOOP} />
      </Sidebar>
    </Frame>

    {/* A workbench pane is a bounded box whose CALLER brings the scrolling —
        a coherent contract, and this is the shape that proves it holds. */}
    <Frame name="workbench" w={560} h={300}>
      <Workbench
        bottom={{
          tabs: [
            { id: 'console', title: 'Console', closable: false, content: <Text>console</Text> },
          ],
        }}
      >
        <Fill>
          {MANY.map((t) => (
            <Text key={t}>{t}</Text>
          ))}
        </Fill>
      </Workbench>
    </Frame>

    {/* The same question turned ninety degrees: a row item that cannot shrink
        below its content pushes its siblings out instead of ellipsizing. */}
    <Frame name="row" w={220} h={80}>
      <Sidebar width={220}>
        <SidebarUser name={LONG} secondary={`${LONG}@hanzo.ai`} onPress={NOOP} onHelp={NOOP} />
      </Sidebar>
    </Frame>

    {/* One variable each, to say which half of the folklore does the work. */}
    <Frame name="only-overflow" w={200} h={200}>
      <YStack width="100%" height="100%">
        <XStack height={30} bg="$panel">
          <Text>head</Text>
        </XStack>
        <YStack flex={1} flexBasis={0} overflowY="auto">
          {MANY.map((t) => (
            <Text key={t}>{t}</Text>
          ))}
        </YStack>
        <XStack height={30} bg="$panel">
          <Text>foot</Text>
        </XStack>
      </YStack>
    </Frame>

    {/* The negative control. A gate nobody has watched fail is not known to
        run, so one frame here is REQUIRED to fail. */}
    <Frame name="only-minh" w={200} h={200} expect="fail">
      <YStack width="100%" height="100%">
        <XStack height={30} bg="$panel">
          <Text>head</Text>
        </XStack>
        <YStack flex={1} flexBasis={0} minH={0}>
          {MANY.map((t) => (
            <Text key={t}>{t}</Text>
          ))}
        </YStack>
        <XStack height={30} bg="$panel">
          <Text>foot</Text>
        </XStack>
      </YStack>
    </Frame>

    {/* A drawer is `position: fixed; inset: 0`, so its frame is the VIEWPORT and
        no wrapper can bound it. Its docstring promises "a header + a scroll
        body"; the body is the half that has to be reachable. */}
    <div data-fixed="slideover">
      <SlideOver open title="Drawer" onClose={NOOP}>
        {Array.from({ length: 90 }, (_, i) => (
          <Text key={i}>{`Row number ${i + 1}`}</Text>
        ))}
      </SlideOver>
    </div>
  </YStack>
)
