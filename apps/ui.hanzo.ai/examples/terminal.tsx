import { YStack } from "@hanzo/gui"
import { Terminal } from "@hanzo/ui"

/** Default — a bare shell with the built-ins (`help`, `clear`, `date`, `echo …`) and nothing else wired up. */
export function Default() {
  return <Terminal prompt=">" />
}

/** With history — commands rendered up front, as `initialCommands` would carry over from a previous session. */
export function WithHistory() {
  return (
    <Terminal
      initialCommands={[
        {
          id: "1",
          input: "echo Welcome to Terminal",
          output: "Welcome to Terminal",
          timestamp: new Date(),
          type: "success",
        },
        {
          id: "2",
          input: "help",
          output: "Available commands: help, clear, echo, date",
          timestamp: new Date(),
          type: "info",
        },
      ]}
    />
  )
}

/** Themes — the same terminal in each of the four built-in palettes. */
export function Themes() {
  return (
    <YStack gap="$4">
      <Terminal theme="dark" />
      <Terminal theme="matrix" />
      <Terminal theme="dracula" />
      <Terminal theme="light" />
    </YStack>
  )
}

/** Custom command handler — `onCommand` answers anything the built-ins don't, and `autoCompleteCommands` offers those names on Tab. */
export function CustomCommands() {
  const handleCommand = async (command: string) => {
    const [cmd, ...args] = command.split(" ")
    switch (cmd) {
      case "time":
        return new Date().toLocaleTimeString()
      case "greet":
        return `Hello, ${args.join(" ") || "stranger"}!`
      default:
        return `Command not found: ${cmd}`
    }
  }

  return (
    <Terminal
      prompt="$"
      onCommand={handleCommand}
      autoCompleteCommands={["time", "greet", "help", "clear"]}
    />
  )
}
