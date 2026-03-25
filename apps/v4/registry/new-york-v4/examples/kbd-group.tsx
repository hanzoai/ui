import { Kbd, KbdGroup } from "@/registry/new-york-v4/ui/kbd"

export default function KbdGroupExample() {
  return (
    <div className="flex flex-col items-center gap-4">
<<<<<<< HEAD
      <p className="text-muted-foreground text-sm">
=======
      <p className="text-sm text-muted-foreground">
>>>>>>> shadcn/main
        Use{" "}
        <KbdGroup>
          <Kbd>Ctrl + B</Kbd>
          <Kbd>Ctrl + K</Kbd>
        </KbdGroup>{" "}
        to open the command palette
      </p>
    </div>
  )
}
