import { useState } from "react"
import { Text, XStack } from "@hanzo/gui"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
} from "@hanzo/ui"
import { TriangleAlert } from "@hanzogui/lucide-icons-2"

/** Default — a button opens a decision that has to be answered: Escape, Cancel or the action closes it, and a click outside does not. */
export function Default() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline">Restart to update</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Restart to finish updating?</AlertDialogTitle>
          <AlertDialogDescription>
            Version 2.4.0 installs when the app restarts. Open documents are
            restored.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Later</AlertDialogCancel>
          <AlertDialogAction>Restart now</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/** Destructive — Action and Cancel are the Button, so an irreversible confirm takes `variant="destructive"` and a quieter Cancel takes `ghost`. */
export function Destructive() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete database</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete staging-eu?</AlertDialogTitle>
          <AlertDialogDescription>
            Every table in staging-eu is dropped. Backups taken before today are
            kept.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="ghost">Keep database</AlertDialogCancel>
          <AlertDialogAction variant="destructive">
            Delete database
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/** Controlled — `open` and `onOpenChange` keep the state outside the dialog; the Action's `onPress` runs, then the dialog closes itself. */
export function Controlled() {
  const [open, setOpen] = useState(false)
  const [archived, setArchived] = useState(false)
  return (
    <XStack gap="$3" items="center">
      <Text>{archived ? "Q3 report · archived" : "Q3 report · active"}</Text>
      <Button
        variant="outline"
        size="sm"
        disabled={archived}
        onPress={() => setOpen(true)}
      >
        Archive
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive the Q3 report?</AlertDialogTitle>
            <AlertDialogDescription>
              Readers keep their link, but the report leaves the shared folder
              and stops taking comments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onPress={() => setArchived(true)}>
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </XStack>
  )
}

/** With icon — the header is a plain stack, so a row with a glyph beside the title marks the weight of the decision. */
export function WithIcon() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline">Revoke API key</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <XStack gap="$2" items="center">
            <TriangleAlert size={18} color="$red10" />
            <AlertDialogTitle>Revoke key ending in 4f2a?</AlertDialogTitle>
          </XStack>
          <AlertDialogDescription>
            Requests signed with this key fail from the moment you confirm.
            Issue a new key first if a service still uses it.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep key</AlertDialogCancel>
          <AlertDialogAction variant="destructive">
            Revoke key
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
