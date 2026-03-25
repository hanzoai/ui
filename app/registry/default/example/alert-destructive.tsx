<<<<<<<< HEAD:app/registry/default/example/alert-destructive.tsx
import { AlertCircle } from "lucide-react"
========
import { AlertCircleIcon } from "lucide-react"
>>>>>>>> shadcn/main:apps/v4/registry/new-york-v4/examples/alert-destructive.tsx

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/registry/new-york-v4/ui/alert"

export default function AlertDestructive() {
  return (
    <Alert variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        Your session has expired. Please log in again.
      </AlertDescription>
    </Alert>
  )
}
