import { useState } from "react"
import { XStack, YStack } from "@hanzo/gui"
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@hanzo/ui"

/** Default — a row of triggers above one panel; `defaultValue` picks the starting tab, and each `TabsContent` is mounted only while its `value` is the chosen one. */
export function Default() {
  return (
    <Tabs defaultValue="overview" width={400}>
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="deployments">Deployments</TabsTrigger>
        <TabsTrigger value="logs">Logs</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        Three replicas in Frankfurt, all healthy since the last deploy.
      </TabsContent>
      <TabsContent value="deployments">
        v2.9.4 went live at 14:02; the two builds before it are kept for
        rollback.
      </TabsContent>
      <TabsContent value="logs">
        The last hour holds 1,204 lines and no errors.
      </TabsContent>
    </Tabs>
  )
}

/** Disabled — a disabled trigger takes no click or key and the arrow keys skip it, while the rest of the row stays live. */
export function Disabled() {
  return (
    <Tabs defaultValue="members" width={400}>
      <TabsList>
        <TabsTrigger value="members">Members</TabsTrigger>
        <TabsTrigger value="roles">Roles</TabsTrigger>
        <TabsTrigger value="audit" disabled>
          Audit log
        </TabsTrigger>
      </TabsList>
      <TabsContent value="members">
        Eight members, two of them owners.
      </TabsContent>
      <TabsContent value="roles">
        Owner, admin and member; custom roles come with the Team plan.
      </TabsContent>
      <TabsContent value="audit">
        Every sign-in and permission change, kept for a year.
      </TabsContent>
    </Tabs>
  )
}

/** Controlled — `value` and `onValueChange` keep the chosen tab in React state, so the buttons under the panel can step through the tabs in order. */
export function Controlled() {
  const steps = ["source", "build", "deploy"]
  const [step, setStep] = useState("source")
  const at = steps.indexOf(step)
  return (
    <YStack gap="$3" width={400}>
      <Tabs value={step} onValueChange={setStep}>
        <TabsList>
          <TabsTrigger value="source">Source</TabsTrigger>
          <TabsTrigger value="build">Build</TabsTrigger>
          <TabsTrigger value="deploy">Deploy</TabsTrigger>
        </TabsList>
        <TabsContent value="source">
          Connect the repository and choose the branch to build from.
        </TabsContent>
        <TabsContent value="build">
          Pick a base image; a Dockerfile at the root is used when there is one.
        </TabsContent>
        <TabsContent value="deploy">
          Choose a region and how many replicas to start with.
        </TabsContent>
      </Tabs>
      <XStack gap="$2">
        <Button
          size="sm"
          variant="outline"
          disabled={at === 0}
          onClick={() => setStep(steps[at - 1])}
        >
          Back
        </Button>
        <Button
          size="sm"
          disabled={at === steps.length - 1}
          onClick={() => setStep(steps[at + 1])}
        >
          Next
        </Button>
      </XStack>
    </YStack>
  )
}

/** Vertical — `orientation="vertical"` stacks the triggers and moves arrow-key focus onto up and down; `flexDirection="row"` puts the panel beside them, and `activationMode="automatic"` chooses a tab as soon as it is focused. */
export function Vertical() {
  return (
    <Tabs
      defaultValue="general"
      orientation="vertical"
      activationMode="automatic"
      flexDirection="row"
      gap="$4"
      width={400}
    >
      <TabsList height="auto" items="stretch">
        <TabsTrigger value="general" height={30} justify="flex-start">
          General
        </TabsTrigger>
        <TabsTrigger value="domains" height={30} justify="flex-start">
          Domains
        </TabsTrigger>
        <TabsTrigger value="env" height={30} justify="flex-start">
          Environment
        </TabsTrigger>
      </TabsList>
      <TabsContent value="general">
        The project name, its slug and the team that owns it.
      </TabsContent>
      <TabsContent value="domains">
        app.acme.com is verified and its certificate renews itself.
      </TabsContent>
      <TabsContent value="env">
        Twelve variables, four of them secrets held in KMS.
      </TabsContent>
    </Tabs>
  )
}

/** With cards — each panel holds a card of fields, the shape of a settings page where the tabs split one form into sections. */
export function WithCards() {
  return (
    <Tabs defaultValue="account" width={400}>
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Your name and the email you sign in with.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <YStack gap="$3">
              <YStack gap="$2">
                <Label htmlFor="account-name">Name</Label>
                <Input id="account-name" defaultValue="Mara Okafor" />
              </YStack>
              <YStack gap="$2">
                <Label htmlFor="account-email">Email</Label>
                <Input
                  id="account-email"
                  type="email"
                  defaultValue="mara@acme.com"
                />
              </YStack>
            </YStack>
          </CardContent>
          <CardFooter justify="flex-end">
            <Button variant="primary">Save</Button>
          </CardFooter>
        </Card>
      </TabsContent>
      <TabsContent value="password">
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>
              Every other session is signed out once it changes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <YStack gap="$3">
              <YStack gap="$2">
                <Label htmlFor="password-current">Current password</Label>
                <Input id="password-current" type="password" />
              </YStack>
              <YStack gap="$2">
                <Label htmlFor="password-new">New password</Label>
                <Input id="password-new" type="password" />
              </YStack>
            </YStack>
          </CardContent>
          <CardFooter justify="flex-end">
            <Button variant="primary">Change password</Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
