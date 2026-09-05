import { useState } from "react"
import { Paragraph, Text, XStack, YStack } from "@hanzo/gui"
import {
  Button,
  Checkbox,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
  useFormField,
} from "@hanzo/ui"
import { useForm } from "react-hook-form"

/** Default — one Input with all five pieces around it; `rules` says the field is required, so pressing Save with it empty puts the message under the field and marks the control invalid. */
export function Default() {
  const form = useForm({ defaultValues: { name: "" } })
  const [saved, setSaved] = useState("")
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(({ name }) => setSaved(name))}>
        <YStack gap="$4" width="100%" maxW={320}>
          <FormField
            control={form.control}
            name="name"
            rules={{ required: "A workspace needs a name." }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Workspace name</FormLabel>
                <FormControl>
                  <Input placeholder="acme" {...field} />
                </FormControl>
                <FormDescription>
                  Shown in the sidebar and on every invite.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <XStack gap="$3" items="center">
            <Button type="submit">Save</Button>
            {saved ? (
              <Paragraph color="$color11">Saved as {saved}</Paragraph>
            ) : null}
          </XStack>
        </YStack>
      </form>
    </Form>
  )
}

/** Validation — `rules` carry each field's checks, `validate` can read the other fields, and `mode: 'onBlur'` runs them as you leave a field instead of waiting for the button. */
export function Validation() {
  const form = useForm({
    mode: "onBlur",
    defaultValues: { password: "", confirm: "" },
  })
  const [changed, setChanged] = useState(false)
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(() => {
          form.reset()
          setChanged(true)
        })}
      >
        <YStack gap="$4" width="100%" maxW={320}>
          <FormField
            control={form.control}
            name="password"
            rules={{
              required: "Enter a new password.",
              minLength: { value: 12, message: "Use at least 12 characters." },
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>New password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormDescription>
                  Twelve characters or more; a sentence works well.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirm"
            rules={{
              validate: (value, { password }) =>
                value === password || "The two passwords differ.",
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm password</FormLabel>
                <FormControl>
                  <Input type="password" reveal={false} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <XStack gap="$3" items="center">
            <Button type="submit">Change password</Button>
            {changed ? (
              <Paragraph color="$color11">Password changed.</Paragraph>
            ) : null}
          </XStack>
        </YStack>
      </form>
    </Form>
  )
}

/** Controls — a Select takes `value` and `onValueChange` from the field and a Switch or Checkbox takes `checked` and `onCheckedChange`; `FormControl` wraps whatever takes focus, which for a Select is its trigger. */
export function Controls() {
  const regions: Record<string, string> = {
    nyc1: "New York",
    fra1: "Frankfurt",
    sgp1: "Singapore",
  }
  const form = useForm({
    defaultValues: { region: "fra1", backups: true, billing: false },
  })
  const [created, setCreated] = useState("")
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(({ region, backups }) =>
          setCreated(
            `${regions[region]}${backups ? ", backed up nightly" : ""}`
          )
        )}
      >
        <YStack gap="$4" width="100%" maxW={320}>
          <FormField
            control={form.control}
            name="region"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Region</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  renderValue={(v) => regions[v]}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(regions).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Where the database and its backups live.
                </FormDescription>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="backups"
            render={({ field }) => (
              <FormItem>
                <XStack items="center" justify="space-between">
                  <FormLabel>Nightly backups</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </XStack>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="billing"
            rules={{ required: "Confirm the charge to continue." }}
            render={({ field }) => (
              <FormItem>
                <XStack gap="$2" items="center">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(next) => field.onChange(next === true)}
                    />
                  </FormControl>
                  <FormLabel>Bill $15 a month to this workspace</FormLabel>
                </XStack>
                <FormMessage />
              </FormItem>
            )}
          />
          <XStack gap="$3" items="center">
            <Button type="submit">Create database</Button>
            {created ? (
              <Paragraph color="$color11">Created in {created}.</Paragraph>
            ) : null}
          </XStack>
        </YStack>
      </form>
    </Form>
  )
}

const Unsaved = () => {
  const { isDirty } = useFormField()
  return isDirty ? (
    <Text fontSize="$1" color="$color10">
      Unsaved
    </Text>
  ) : null
}

/** Own piece — anything inside a field can call `useFormField()` for that field's ids and state; `Unsaved` is that call and a Text shown while `isDirty`, and Save stays off until some field differs from what was loaded. */
export function OwnPiece() {
  const form = useForm({
    defaultValues: {
      name: "Ada Lovelace",
      bio: "Wrote the first program for a machine that did not exist yet.",
    },
  })
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => form.reset(values))}>
        <YStack gap="$4" width="100%" maxW={320}>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <XStack gap="$2" items="center">
                  <FormLabel>Display name</FormLabel>
                  <Unsaved />
                </XStack>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <XStack gap="$2" items="center">
                  <FormLabel>Bio</FormLabel>
                  <Unsaved />
                </XStack>
                <FormControl>
                  <Textarea rows={2} {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <XStack>
            <Button type="submit" disabled={!form.formState.isDirty}>
              Save
            </Button>
          </XStack>
        </YStack>
      </form>
    </Form>
  )
}
