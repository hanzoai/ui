import { DialogStack } from "@/registry/default/ui/dialog-stack"

export default function DialogStackDemo() {
  const dialogs = [
    {
      id: "1",
      title: "Welcome",
      content: "Welcome to the dialog stack demo. This is the first dialog.",
    },
    {
      id: "2",
      title: "Settings",
      content: "Configure your application settings here.",
    },
    {
      id: "3",
      title: "Confirmation",
      content: "Are you sure you want to proceed with this action?",
    },
  ]

  return (
    <div className="w-full min-h-[400px] flex items-center justify-center">
      <DialogStack dialogs={dialogs} />
    </div>
  )
}
