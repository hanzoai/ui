import { useState, type ComponentProps } from "react"
import { XStack } from "@hanzo/gui"
import { Button, Spinner, toast, Toaster } from "@hanzo/ui"
import {
  CircleCheck,
  CircleX,
  Info,
  Rocket,
  TriangleAlert,
} from "@hanzogui/lucide-icons-2"

/** Default — `toast()` from anywhere puts a message in the app's one `Toaster`, mounted once near the root; on this page that mount is the Viewport example, and every example here shares it. */
export function Default() {
  return <Button onClick={() => toast("Settings saved")}>Save</Button>
}

/** Viewport — the viewport itself, mounted once near the root of an app: `position` picks the corner or edge the stack grows from, `closeButton` puts an X on every toast, and `icons` gives each kind its mark. */
export function Viewport() {
  type Position = NonNullable<ComponentProps<typeof Toaster>["position"]>
  const positions: Position[] = [
    "top-left",
    "top-center",
    "top-right",
    "bottom-left",
    "bottom-center",
    "bottom-right",
  ]
  const [position, setPosition] = useState<Position>("bottom-right")
  return (
    <XStack flexWrap="wrap" gap="$2">
      <Toaster
        position={position}
        closeButton
        icons={{
          success: <CircleCheck size={16} />,
          error: <CircleX size={16} />,
          warning: <TriangleAlert size={16} />,
          info: <Info size={16} />,
          loading: <Spinner />,
        }}
      />
      {positions.map((p) => (
        <Button
          key={p}
          size="sm"
          variant={p === position ? "primary" : "outline"}
          onClick={() => {
            setPosition(p)
            toast(`Now stacking from ${p}`)
          }}
        >
          {p}
        </Button>
      ))}
    </XStack>
  )
}

/** Types — `success`, `error`, `warning`, `info` and `loading` set the kind, which picks its icon from the `icons` map on `Toaster`; a loading toast stays until something dismisses it, and `toast.dismiss()` with no id clears them all. */
export function Types() {
  return (
    <XStack flexWrap="wrap" gap="$3" items="center">
      <Button variant="outline" onClick={() => toast("Copied to clipboard")}>
        Default
      </Button>
      <Button
        variant="outline"
        onClick={() => toast.success("Image pushed to the registry")}
      >
        Success
      </Button>
      <Button
        variant="outline"
        onClick={() => toast.error("Build failed on go vet")}
      >
        Error
      </Button>
      <Button variant="outline" onClick={() => toast.warning("Disk at 91%")}>
        Warning
      </Button>
      <Button
        variant="outline"
        onClick={() => toast.info("A new runner joined the fleet")}
      >
        Info
      </Button>
      <Button
        variant="outline"
        onClick={() => toast.loading("Restoring the cache")}
      >
        Loading
      </Button>
      <Button variant="ghost" onClick={() => toast.dismiss()}>
        Clear all
      </Button>
    </XStack>
  )
}

/** Options — the second argument is per toast: a `description` under the title, `action` and `cancel` buttons, an `icon` of your own, and a `duration` in milliseconds. */
export function Options() {
  return (
    <XStack flexWrap="wrap" gap="$3" items="center">
      <Button
        variant="outline"
        onClick={() =>
          toast("Branch deleted", {
            description: "fix/retry-on-timeout, 3 commits",
            action: {
              label: "Undo",
              onClick: () => toast.success("Branch restored"),
            },
            cancel: { label: "Dismiss" },
            duration: 8000,
          })
        }
      >
        Delete branch
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast("Release 0.9.14 is live", { icon: <Rocket size={16} /> })
        }
      >
        Announce release
      </Button>
    </XStack>
  )
}

/** Promise — `toast.promise` shows the loading message while the promise is pending, then swaps it for the success or error one. */
export function Promised() {
  const deploy = (ok: boolean) =>
    new Promise<void>((resolve, reject) =>
      setTimeout(ok ? resolve : reject, 1500)
    )
  return (
    <XStack flexWrap="wrap" gap="$3" items="center">
      <Button
        onClick={() =>
          toast.promise(deploy(true), {
            loading: "Deploying to production",
            success: "Deployed to production",
            error: "Deploy failed",
          })
        }
      >
        Deploy
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.promise(deploy(false), {
            loading: "Deploying to staging",
            success: "Deployed to staging",
            error: "Deploy failed, rolled back",
          })
        }
      >
        Deploy and fail
      </Button>
    </XStack>
  )
}
