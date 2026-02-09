import { useAtom } from "jotai"
import { atomWithStorage } from "jotai/utils"

type Config = {
<<<<<<<< HEAD:app/hooks/use-config.ts
  style: Style["name"]
  theme: Theme["name"]
  radius: number
  installationType?: "cli" | "manual"
}

const configAtom = atomWithStorage<Config>("config", {
  style: "default",
  theme: "neutral",
  radius: 0.5,
========
  style: "new-york-v4"
  packageManager: "npm" | "yarn" | "pnpm" | "bun"
  installationType: "cli" | "manual"
}

const configAtom = atomWithStorage<Config>("config", {
  style: "new-york-v4",
  packageManager: "pnpm",
  installationType: "cli",
>>>>>>>> shadcn/main:apps/v4/hooks/use-config.ts
})

export function useConfig() {
  return useAtom(configAtom)
}
