import { YStack } from "@hanzo/gui"
import { Alert, AlertDescription, AlertTitle } from "@hanzo/ui"

/** Default — an icon, a title and a description in a bordered callout. */
export function Default() {
  return (
    <Alert>
      <svg
        viewBox="0 0 24 24"
        width={16}
        height={16}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          d="M4 17l6-6-6-6M12 19h8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        You can add components to your app using the cli.
      </AlertDescription>
    </Alert>
  )
}

/** Destructive — `variant="destructive"` tints the border, icon, title and description red. */
export function Destructive() {
  return (
    <Alert variant="destructive">
      <svg
        viewBox="0 0 24 24"
        width={16}
        height={16}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <circle cx={12} cy={12} r={10} />
        <path
          d="M12 8v4M12 16h.01"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        Your session has expired. Please log in again.
      </AlertDescription>
    </Alert>
  )
}

/** Without an icon — the text column sits flush left when no icon child is given. */
export function NoIcon() {
  return (
    <Alert>
      <AlertTitle>Scheduled maintenance</AlertTitle>
      <AlertDescription>
        The API will be unavailable Sunday 2am–3am UTC.
      </AlertDescription>
    </Alert>
  )
}

/** Stacked — two alerts, one of each variant, laid out in a column. */
export function Stacked() {
  return (
    <YStack gap="$3">
      <Alert>
        <AlertTitle>Update available</AlertTitle>
        <AlertDescription>Version 2.4 is ready to install.</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <AlertTitle>Payment failed</AlertTitle>
        <AlertDescription>
          Update your billing details to keep your plan active.
        </AlertDescription>
      </Alert>
    </YStack>
  )
}
