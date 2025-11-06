import {
  Sidebar,
  SidebarProvider,
} from "@/registry/default/ui/sidebar"

export default function SidebarDemo() {
  return (
    <SidebarProvider>
      <div className="w-full min-h-[400px] flex items-center justify-center">
        <Sidebar />
      </div>
    </SidebarProvider>
  )
}
