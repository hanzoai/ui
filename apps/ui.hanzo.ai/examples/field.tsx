import { useState } from "react"
import { XStack, YStack } from "@hanzo/gui"
import {
  Checkbox,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
  Input,
  Switch,
} from "@hanzo/ui"

/** Profile — a fieldset with a name field, an invalid username showing FieldError, and a horizontal switch row. */
export function Profile() {
  return (
    <FieldSet>
      <FieldLegend>Profile</FieldLegend>
      <FieldDescription>This appears on invoices and emails.</FieldDescription>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="field-demo-name">Full name</FieldLabel>
          <Input id="field-demo-name" placeholder="Evil Rabbit" />
          <FieldDescription>This appears on invoices and emails.</FieldDescription>
        </Field>
        <Field data-invalid>
          <FieldLabel htmlFor="field-demo-username">Username</FieldLabel>
          <Input id="field-demo-username" aria-invalid />
          <FieldError>Choose another username.</FieldError>
        </Field>
        <Field orientation="horizontal">
          <Switch id="field-demo-newsletter" />
          <FieldLabel htmlFor="field-demo-newsletter">
            Subscribe to the newsletter
          </FieldLabel>
        </Field>
      </FieldGroup>
    </FieldSet>
  )
}

/** Choice cards — wrapping a Field in a FieldLabel turns a checkbox row into a bordered, selectable card. */
export function ChoiceCards() {
  return (
    <FieldGroup>
      <FieldLabel htmlFor="field-demo-email-updates">
        <Field orientation="horizontal">
          <Checkbox id="field-demo-email-updates" defaultChecked />
          <FieldContent>
            <FieldTitle>Email updates</FieldTitle>
            <FieldDescription>Product news, at most weekly.</FieldDescription>
          </FieldContent>
        </Field>
      </FieldLabel>
      <FieldLabel htmlFor="field-demo-sms-updates">
        <Field orientation="horizontal">
          <Checkbox id="field-demo-sms-updates" />
          <FieldContent>
            <FieldTitle>SMS updates</FieldTitle>
            <FieldDescription>Order status only.</FieldDescription>
          </FieldContent>
        </Field>
      </FieldLabel>
    </FieldGroup>
  )
}

/** Separated groups — FieldSeparator divides two FieldGroups, with a label centered in the rule. */
export function SeparatedGroups() {
  return (
    <YStack gap="$6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="field-demo-email">Email</FieldLabel>
          <Input id="field-demo-email" placeholder="ada@example.com" />
        </Field>
      </FieldGroup>
      <FieldSeparator>Or continue with</FieldSeparator>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="field-demo-provider">Provider</FieldLabel>
          <Input id="field-demo-provider" placeholder="GitHub" />
        </Field>
      </FieldGroup>
    </YStack>
  )
}

/** Responsive — orientation="responsive" stacks the label above the control on a narrow view and sets them side by side once there is room. */
export function Responsive() {
  const [remember, setRemember] = useState(false)
  return (
    <FieldGroup>
      <Field orientation="responsive">
        <FieldLabel htmlFor="field-demo-remember">Remember me</FieldLabel>
        <XStack items="center" gap="$2">
          <Switch id="field-demo-remember" checked={remember} onCheckedChange={setRemember} />
        </XStack>
      </Field>
    </FieldGroup>
  )
}
