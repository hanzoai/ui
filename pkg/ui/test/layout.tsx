// Every layout name @hanzo/ui and @hanzo/gui both claimed, on one page.
//
// Read by `scripts/layout.mjs` in Chromium. What is asserted is the RENDERED
// result — computed style plus the absence of a leaked lowercase attribute —
// because gui drops a prop it does not recognise with no throw and no type
// error, so a green build proves nothing about a style prop.
import {
  Section as GuiSection,
  Separator as GuiSeparator,
  View,
  XStack,
  YStack,
} from '@hanzo/gui'

import { Band } from '../src/backends/gui/band'
import { Card, CardContent, CardFooter, CardHeader } from '../src/backends/gui/card'
import { Separator } from '../src/backends/gui'

export const Layout = () => (
  <YStack>
    {/* --- the band: the page's vertical rhythm, on the semantic element --- */}
    <Band data-probe="band">
      <View data-probe="band-child" />
    </Band>
    <Band data-probe="band-full" measure={false} />

    {/* --- the element it is built on: a tag, and no spacing of its own --- */}
    <GuiSection data-probe="gui-section" />

    {/* --- Card --- */}
    <Card data-probe="card">
      <CardHeader data-probe="card-header" />
      <CardContent data-probe="card-content" />
      <CardFooter data-probe="card-footer" />
    </Card>

    {/* --- Separator: ui's export and gui's must now be the same component --- */}
    <Separator data-probe="sep" />
    <Separator data-probe="sep-v" vertical />
    <GuiSeparator data-probe="gui-sep" />
    <GuiSeparator data-probe="gui-sep-v" vertical />

    {/* --- can this package say `display: grid` yet, on the @hanzo/gui it
        actually resolves? That is the whole question for src/grid.tsx, and it
        is a measurement, not a version-number argument. --- */}
    <View
      data-probe="grid-attempt"
      display={'grid' as never}
      gridTemplateColumns={'repeat(3, minmax(0, 1fr))' as never}
      gridTemplateRows={'40px 80px' as never}
      gridAutoFlow={'column' as never}
    >
      <View data-probe="grid-attempt-cell" gridColumn={'span 2' as never} />
    </View>

    {/* --- the flex controls. These must not move. --- */}
    <YStack data-probe="ystack" />
    <XStack data-probe="xstack" />

    {/* --- the colour reference, so a token assertion names a token --- */}
    <View
      data-probe="token-border"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
      borderRightWidth={1}
      borderRightColor="$backgroundFocus"
    />
  </YStack>
)
