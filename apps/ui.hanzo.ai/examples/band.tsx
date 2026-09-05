import { H3, Paragraph, Text, XStack, YStack } from "@hanzo/gui"
import { Band, Button } from "@hanzo/ui"

/** Default — the page's vertical rhythm and side gutter from the space scale, around content centred in a column up to 1200 wide; a background set on the band reaches both edges. */
export function Default() {
  return (
    <Band bg="$panel">
      <H3>Status</H3>
      <Paragraph color="$quiet">
        All systems operational. Time to first token is under 200 ms in every
        region.
      </Paragraph>
    </Band>
  )
}

/** Measure — `measure` is the width of the centred column, 1200 unless you say otherwise: 480 holds a notice to a readable line, and `false` lets a row of regions run to the gutter. */
export function Measure() {
  const regions = [
    { city: "Frankfurt", latency: "12 ms" },
    { city: "San Francisco", latency: "48 ms" },
    { city: "Singapore", latency: "91 ms" },
    { city: "Tokyo", latency: "104 ms" },
  ]
  return (
    <YStack width="100%">
      <Band bg="$panel" measure={480}>
        <YStack p="$4" gap="$2" rounded="$3" bg="$color3">
          <Text fontWeight="600">Scheduled maintenance</Text>
          <Paragraph color="$quiet">
            The EU region is read-only on Sunday from 02:00 to 02:30 UTC while
            its primary database moves to new hardware.
          </Paragraph>
        </YStack>
      </Band>
      <Band measure={false}>
        <XStack gap="$3" flexWrap="wrap">
          {regions.map((r) => (
            <YStack
              key={r.city}
              flex={1}
              minW={140}
              p="$3"
              gap="$1"
              rounded="$3"
              bg="$color3"
            >
              <Text fontWeight="600">{r.city}</Text>
              <Text color="$quiet">{r.latency}</Text>
            </YStack>
          ))}
        </XStack>
      </Band>
    </YStack>
  )
}

/** Inner — `inner` reaches the centred column itself, so a hero centres its lines and spaces them without a wrapper of its own. */
export function Inner() {
  return (
    <Band bg="$panel" measure={640} inner={{ gap: "$3", items: "center" }}>
      <H3 text="center">Ship on one API</H3>
      <Paragraph color="$quiet" text="center">
        Every model behind one key, with streaming, tools and files that behave
        the same across all of them.
      </Paragraph>
      <XStack gap="$2">
        <Button variant="primary">Get started</Button>
        <Button variant="outline">Read the docs</Button>
      </XStack>
    </Band>
  )
}

/** Page — bands stacked in a column are the page, each one a section element; the space between them is each band's own padding, so no section knows about its neighbours. */
export function Page() {
  return (
    <YStack width="100%">
      <Band bg="$panel">
        <H3>Models</H3>
        <Paragraph color="$quiet">
          Chat, embeddings, images and speech, behind one key.
        </Paragraph>
      </Band>
      <Band>
        <H3>Pricing</H3>
        <Paragraph color="$quiet">
          Billed by the token, on every model. No seats and no minimum.
        </Paragraph>
      </Band>
      <Band bg="$panel">
        <H3>Changelog</H3>
        <Paragraph color="$quiet">
          Streaming tool calls shipped this week; batch jobs are next.
        </Paragraph>
      </Band>
    </YStack>
  )
}
