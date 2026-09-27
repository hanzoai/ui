import { useState } from 'react'
import { YStack } from '@hanzo/gui'
import { Button, Input, Switch } from '@hanzo/ui'
import { Card, Field, Group, Heading, Note, Once, Row, Soft } from '@hanzo/ui/settings'

/** A section — its heading and action, a group over a bordered card of rows, a field, and the note the last action left. */
export function Default() {
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  return (
    <YStack gap="$6" width="100%" maxW={760}>
      <Heading title="General" detail="How this surface looks and listens." action={<Button size="sm" onPress={() => setNote('Saved.')}>Save</Button>} />
      <Group title="Appearance" detail="Kept in this browser.">
        <Card>
          <Row first title="Theme" detail="Follows the system." trailing={<Switch aria-label="Dark" />} />
          <Row title="hk-live-3f9a" detail="Made Sep 27, 2026" mono trailing={<Button size="sm" variant="outline">Revoke</Button>} />
        </Card>
      </Group>
      <Field label="What should Hanzo call you?" hint="The home page greets you by it.">
        <Input value={name} onChangeText={setName} placeholder="Name" aria-label="What should Hanzo call you?" />
      </Field>
      <Note>{note}</Note>
    </YStack>
  )
}

/** The quiet lines — empty, signed out — and a credential the platform shows once. */
export function Quiet() {
  return (
    <YStack gap="$4" width="100%" maxW={760}>
      <Card>
        <Soft>No keys yet.</Soft>
      </Card>
      <Soft action={<Button size="sm">Sign in</Button>}>Sign in to see your keys.</Soft>
      <Once value="hk-live-3f9a0c71d2" label="API key" />
    </YStack>
  )
}
