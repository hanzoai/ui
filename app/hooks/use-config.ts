import { useAtom } from "jotai"
import { atomWithStorage } from "jotai/utils"

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
})

export function useConfig() {
  return useAtom(configAtom)
}
