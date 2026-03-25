import { useAtom } from "jotai"
import { atomWithStorage } from "jotai/utils"

<<<<<<<< HEAD:app/hooks/use-config.ts
import type { Style } from "@/registry/styles"
import type { Theme } from "@/registry/themes"

type Config = {
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
type Config = {
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
