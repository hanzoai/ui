import { YStack } from "@hanzo/gui"
import {
  Button,
  Card3D,
  Card3DContent,
  Card3DDescription,
  Card3DFooter,
  Card3DHeader,
  Card3DTitle,
} from "@hanzo/ui"

/** Default — the card turns toward the pointer, grows a little, and a glare follows the pointer across it. */
export function Default() {
  return (
    <YStack items="center" justify="center" minH={400} p="$8">
      <Card3D width={350}>
        <Card3DHeader>
          <Card3DTitle>3D Card Effect</Card3DTitle>
          <Card3DDescription>
            Hover over this card to see the 3D tilt effect
          </Card3DDescription>
        </Card3DHeader>
        <Card3DContent>
          This card responds to your mouse movement with a realistic 3D
          perspective transform and an interactive glare effect.
        </Card3DContent>
        <Card3DFooter>
          <Button variant="outline">Learn More</Button>
        </Card3DFooter>
      </Card3D>
    </YStack>
  )
}

/** Depth — `depth` sets how far each layer stands off the surface, so a tall title parts from a flat body as the card turns. */
export function Depth() {
  return (
    <YStack items="center" justify="center" minH={400} p="$8">
      <Card3D width={350}>
        <Card3DHeader depth={0}>
          <Card3DTitle depth={80}>Parallax</Card3DTitle>
          <Card3DDescription depth={40}>
            Three layers at three depths
          </Card3DDescription>
        </Card3DHeader>
        <Card3DContent depth={0}>
          The title floats highest, the description below it, and this body
          stays on the surface.
        </Card3DContent>
      </Card3D>
    </YStack>
  )
}

/** Dramatic — a short `perspective` and a wide `maxTilt` for a hero, with a slow `speed` so it settles lazily. */
export function Dramatic() {
  return (
    <YStack items="center" justify="center" minH={400} p="$8">
      <Card3D width={350} perspective={600} maxTilt={25} scale={1.1} speed={900}>
        <Card3DHeader>
          <Card3DTitle>Launch week</Card3DTitle>
          <Card3DDescription>Five releases, one each day</Card3DDescription>
        </Card3DHeader>
        <Card3DFooter>
          <Button variant="primary">See the schedule</Button>
        </Card3DFooter>
      </Card3D>
    </YStack>
  )
}

/** Quiet — a small `maxTilt`, no growth and no glare, for a card among many in a dense list. */
export function Quiet() {
  return (
    <YStack items="center" justify="center" minH={400} p="$8">
      <Card3D width={350} maxTilt={6} scale={1} glare={false}>
        <Card3DHeader>
          <Card3DTitle>Monthly report</Card3DTitle>
          <Card3DDescription>Generated every first Monday</Card3DDescription>
        </Card3DHeader>
        <Card3DContent>
          Twelve pages, exported as a PDF and sent to every workspace admin.
        </Card3DContent>
      </Card3D>
    </YStack>
  )
}
