import { MessageDock } from "@/registry/default/ui/message-dock"

export default function MessageDockDemo() {
  const messages = [
    {
      id: "1",
      type: "success" as const,
      title: "Success",
      description: "Your changes have been saved successfully.",
    },
    {
      id: "2",
      type: "info" as const,
      title: "Info",
      description: "New update available.",
    },
    {
      id: "3",
      type: "warning" as const,
      title: "Warning",
      description: "Please review your settings.",
    },
  ]

  return (
    <div className="w-full min-h-[400px] flex items-center justify-center p-8">
      <MessageDock messages={messages} />
    </div>
  )
}
