import { useState } from "react"
import { H3, Text, XStack, YStack } from "@hanzo/gui"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
} from "@hanzo/ui"
import { Bell, Shield, Users } from "@hanzogui/lucide-icons-2"

/** Default — one section open at a time, and `collapsible` lets the open one close again. */
export function Default() {
  return (
    <Accordion type="single" collapsible defaultValue="billing" width="100%">
      <AccordionItem value="billing">
        <AccordionTrigger>How is usage billed?</AccordionTrigger>
        <AccordionContent>
          Per token, metered hourly and invoiced at the end of the month.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="plans">
        <AccordionTrigger>Can I change plans mid-cycle?</AccordionTrigger>
        <AccordionContent>
          Yes. The difference is prorated on the next invoice.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="refunds">
        <AccordionTrigger>Do you offer refunds?</AccordionTrigger>
        <AccordionContent>
          Unused prepaid credit is refunded within 30 days of purchase.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

/** Multiple — `type="multiple"` lets any number of sections stay open, so `defaultValue` takes an array. */
export function Multiple() {
  return (
    <Accordion
      type="multiple"
      defaultValue={["address", "delivery"]}
      width="100%"
    >
      <AccordionItem value="address">
        <AccordionTrigger>Address</AccordionTrigger>
        <AccordionContent>12 Mill Lane, Cambridge CB1 2AB</AccordionContent>
      </AccordionItem>
      <AccordionItem value="delivery">
        <AccordionTrigger>Delivery</AccordionTrigger>
        <AccordionContent>
          Standard, three to five working days.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="payment">
        <AccordionTrigger>Payment</AccordionTrigger>
        <AccordionContent>Visa ending 4242</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

/** Controlled — `value` and `onValueChange` keep the open set in your state, so buttons outside the accordion can expand or collapse every section. */
export function Controlled() {
  const steps = ["token", "network", "logs"]
  const [open, setOpen] = useState<string[]>([])
  return (
    <YStack gap="$3" width="100%">
      <XStack gap="$2">
        <Button size="sm" variant="outline" onClick={() => setOpen(steps)}>
          Expand all
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen([])}>
          Collapse all
        </Button>
      </XStack>
      <Accordion type="multiple" value={open} onValueChange={setOpen}>
        <AccordionItem value="token">
          <AccordionTrigger>Check the token</AccordionTrigger>
          <AccordionContent>
            An expired key answers 401. Rotate it from the API keys page.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="network">
          <AccordionTrigger>Check the network</AccordionTrigger>
          <AccordionContent>
            api.hanzo.ai must be reachable on 443 from the machine that failed.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="logs">
          <AccordionTrigger>Check the logs</AccordionTrigger>
          <AccordionContent>
            The request id in the error response finds the trace in o11y.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </YStack>
  )
}

/** Disabled — a disabled row stays shut, takes no click or key, and says so to a screen reader. */
export function Disabled() {
  return (
    <Accordion type="single" collapsible width="100%">
      <AccordionItem value="profile">
        <AccordionTrigger>Profile</AccordionTrigger>
        <AccordionContent>
          Name, avatar and the email you sign in with.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="billing" disabled>
        <AccordionTrigger>Billing (owners only)</AccordionTrigger>
        <AccordionContent>Plan, invoices and payment method.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="danger">
        <AccordionTrigger>Delete workspace</AccordionTrigger>
        <AccordionContent>
          Removes every project and member. There is no undo.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

/** With icon — an icon leads each row, `hideArrow` drops the chevron so the rows read as a list, and `headingLevel={4}` nests them under the H3 above. */
export function WithIcon() {
  return (
    <YStack gap="$2" width="100%">
      <H3 size="$5">Workspace</H3>
      <Accordion type="single" collapsible defaultValue="members">
        <AccordionItem value="members">
          <AccordionTrigger hideArrow headingLevel={4}>
            <XStack gap="$2" items="center">
              <Users size={16} />
              <Text fontSize="$3" fontWeight="500">
                Members
              </Text>
            </XStack>
          </AccordionTrigger>
          <AccordionContent>
            Eight members, two of them owners. Invite by email or by link.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="notifications">
          <AccordionTrigger hideArrow headingLevel={4}>
            <XStack gap="$2" items="center">
              <Bell size={16} />
              <Text fontSize="$3" fontWeight="500">
                Notifications
              </Text>
            </XStack>
          </AccordionTrigger>
          <AccordionContent>
            Mentions and review requests by email; everything else in the app.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="security">
          <AccordionTrigger hideArrow headingLevel={4}>
            <XStack gap="$2" items="center">
              <Shield size={16} />
              <Text fontSize="$3" fontWeight="500">
                Security
              </Text>
            </XStack>
          </AccordionTrigger>
          <AccordionContent>
            Two-factor sign-in is required for owners. Sessions expire after 30
            days.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </YStack>
  )
}
