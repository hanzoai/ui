import { useState } from "react"
import { Paragraph, Text, XStack, YStack } from "@hanzo/gui"
import { Badge, Button, Fill, Input, Screen } from "@hanzo/ui"
import { Send } from "@hanzogui/lucide-icons-2"

/** Default — a bar pinned at the top, a bar pinned at the bottom, and a middle that takes the rest of the height and scrolls. */
export function Default() {
  const deploys = [
    "api v1.4.2 to production",
    "console v2.9.1 to production",
    "iam v3.0.0 to staging",
    "kms v1.7.4 to production",
    "gateway v0.12.0 to staging",
    "ingress v1.1.9 to production",
    "base v0.39.1 to staging",
    "o11y v2.2.0 to production",
    "platform v1.0.7 to staging",
    "world v2.9.39 to production",
    "registry v0.4.3 to staging",
    "cd v1.3.1 to production",
  ]
  return (
    <Screen
      height={280}
      borderWidth={1}
      borderColor="$borderColor"
      rounded="$4"
    >
      <XStack
        px="$4"
        py="$3"
        borderBottomWidth={1}
        borderColor="$borderColor"
        items="center"
        justify="space-between"
      >
        <Text fontWeight="600">Deploys</Text>
        <Badge variant="secondary">{deploys.length}</Badge>
      </XStack>
      <Fill p="$4" gap="$2">
        {deploys.map((d) => (
          <Text key={d} fontSize={13}>
            {d}
          </Text>
        ))}
      </Fill>
      <XStack
        px="$4"
        py="$3"
        borderTopWidth={1}
        borderColor="$borderColor"
        items="center"
        justify="space-between"
      >
        <Text fontSize={13} color="$color11">
          Production is healthy
        </Text>
        <Button size="sm" variant="outline">
          Refresh
        </Button>
      </XStack>
    </Screen>
  )
}

/** Clipped — `scroll` is on by default; `scroll={false}` cuts the overflow off at the frame instead, for a pane that pages its content itself. */
export function Clipped() {
  const releases = Array.from({ length: 12 }, (_, i) => `api v1.4.${11 - i}`)
  const pane = (scroll: boolean) => (
    <Screen
      height={200}
      borderWidth={1}
      borderColor="$borderColor"
      rounded="$4"
    >
      <XStack px="$4" py="$3" borderBottomWidth={1} borderColor="$borderColor">
        <Text fontFamily="$mono" fontSize={13}>
          {scroll ? "scroll" : "scroll={false}"}
        </Text>
      </XStack>
      <Fill scroll={scroll} p="$4" gap="$2">
        {releases.map((r) => (
          <Text key={r} fontSize={13}>
            {r}
          </Text>
        ))}
      </Fill>
    </Screen>
  )
  return (
    <XStack width="100%" gap="$4">
      {pane(true)}
      {pane(false)}
    </XStack>
  )
}

/** Thread — turns pile up in the middle and scroll while the composer stays pinned at the bottom, the shape of every chat. */
export function Thread() {
  const [turns, setTurns] = useState([
    { from: "you", text: "Why did the api deploy roll back?" },
    {
      from: "ops",
      text: "The readiness probe failed during the schema migration.",
    },
    { from: "you", text: "Was the migration itself fine?" },
    {
      from: "ops",
      text: "Yes, it just took 90 seconds and the probe allows 60.",
    },
    { from: "you", text: "Raise the probe to 120 for the next release?" },
    { from: "ops", text: "Done. It ships with 1.4.3." },
  ])
  const [draft, setDraft] = useState("")
  const send = () => {
    if (!draft.trim()) return
    setTurns([...turns, { from: "you", text: draft.trim() }])
    setDraft("")
  }
  return (
    <Screen
      height={320}
      maxW={480}
      borderWidth={1}
      borderColor="$borderColor"
      rounded="$4"
    >
      <XStack
        px="$4"
        py="$3"
        borderBottomWidth={1}
        borderColor="$borderColor"
        items="center"
        gap="$2"
      >
        <Text fontWeight="600">Ops</Text>
        <Badge variant="outline">on call</Badge>
      </XStack>
      <Fill p="$4" gap="$3">
        {turns.map((t, i) => (
          <YStack
            key={i}
            self={t.from === "you" ? "flex-end" : "flex-start"}
            maxW="80%"
            gap={2}
          >
            <Text fontSize={11} color="$color10">
              {t.from}
            </Text>
            <Paragraph
              fontSize={13}
              px="$3"
              py="$2"
              rounded="$3"
              bg={t.from === "you" ? "$color4" : "$color3"}
            >
              {t.text}
            </Paragraph>
          </YStack>
        ))}
      </Fill>
      <XStack
        px="$3"
        py="$3"
        borderTopWidth={1}
        borderColor="$borderColor"
        items="center"
        gap="$2"
      >
        <Input
          flex={1}
          placeholder="Reply"
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={send}
        />
        <Button size="icon" aria-label="Send" onPress={send}>
          <Send size={16} />
        </Button>
      </XStack>
    </Screen>
  )
}

/** Beside a sidebar — in a row the frame takes the width that is left, and its middle still scrolls on its own. */
export function Beside() {
  const workspaces = ["hanzo.ai", "lux.network", "zoo.ngo"]
  const [workspace, setWorkspace] = useState("hanzo.ai")
  const people = [
    "ada",
    "grace",
    "linus",
    "ken",
    "dennis",
    "rob",
    "brian",
    "margaret",
  ]
  return (
    <XStack
      width="100%"
      height={260}
      borderWidth={1}
      borderColor="$borderColor"
      rounded="$4"
      overflow="hidden"
    >
      <YStack
        width={160}
        p="$2"
        gap={2}
        borderRightWidth={1}
        borderColor="$borderColor"
      >
        {workspaces.map((w) => (
          <Button
            key={w}
            size="sm"
            variant={w === workspace ? "secondary" : "ghost"}
            justify="flex-start"
            onPress={() => setWorkspace(w)}
          >
            {w}
          </Button>
        ))}
      </YStack>
      <Screen>
        <XStack
          px="$4"
          py="$3"
          borderBottomWidth={1}
          borderColor="$borderColor"
          items="center"
          justify="space-between"
        >
          <Text fontWeight="600">Members</Text>
          <Badge variant="secondary">{people.length}</Badge>
        </XStack>
        <Fill p="$4" gap="$2">
          {people.map((p) => (
            <Text key={p} fontSize={13}>
              {`${p}@${workspace}`}
            </Text>
          ))}
        </Fill>
      </Screen>
    </XStack>
  )
}
