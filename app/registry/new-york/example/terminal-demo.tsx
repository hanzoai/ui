import { Terminal } from "@/registry/default/ui/terminal"

export default function TerminalDemo() {
  const handleCommand = async (command: string) => {
    // Simulate async command processing
    await new Promise((resolve) => setTimeout(resolve, 500))

    const [cmd, ...args] = command.toLowerCase().split(" ")

    switch (cmd) {
      case "about":
        return (
          <div className="space-y-1">
            <div>Terminal Component v1.0.0</div>
            <div className="text-muted-foreground">
              A feature-rich terminal emulator with syntax highlighting and
              auto-completion.
            </div>
          </div>
        )

      case "ls":
        return (
          <div className="grid grid-cols-3 gap-4">
            <span>Documents</span>
            <span>Downloads</span>
            <span>Desktop</span>
            <span>Pictures</span>
            <span>Videos</span>
            <span>Music</span>
          </div>
        )

      case "pwd":
        return "/home/user"

      case "whoami":
        return "guest"

      case "calc":
        if (args.length === 0) {
          return "Usage: calc <expression>"
        }
        try {
          const result = eval(args.join(" "))
          return `= ${result}`
        } catch {
          return "Error: Invalid expression"
        }

      case "weather":
        return (
          <div className="space-y-1">
            <div>Current Weather:</div>
            <div className="ml-4">
              <div>Temperature: 72°F</div>
              <div>Condition: Partly Cloudy</div>
              <div>Humidity: 65%</div>
              <div>Wind: 5 mph</div>
            </div>
          </div>
        )

      case "time":
        return new Date().toLocaleTimeString()

      case "date":
        return new Date().toLocaleDateString()

      default:
        return `Command not found: ${cmd}. Type 'help' for available commands.`
    }
  }

  const initialCommands = [
    {
      id: "welcome",
      input: "echo Welcome to the Terminal Component",
      output: "Welcome to the Terminal Component",
      timestamp: new Date(),
      type: "success" as const,
    },
    {
      id: "hint",
      input: "echo Type 'help' to see available commands",
      output: "Type 'help' to see available commands",
      timestamp: new Date(),
      type: "info" as const,
    },
  ]

  return (
    <div className="w-full">
      <Terminal
        prompt="$"
        initialCommands={initialCommands}
        onCommand={handleCommand}
        theme="dark"
        autoCompleteCommands={[
          "help",
          "clear",
          "echo",
          "date",
          "time",
          "about",
          "ls",
          "pwd",
          "whoami",
          "calc",
          "weather",
        ]}
      />
    </div>
  )
}
