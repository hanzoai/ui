import { Announcement } from "@/registry/default/ui/announcement"

export default function AnnouncementDemo() {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-8">
      <Announcement dismissible className="max-w-2xl">
        🎉 <strong>New Feature!</strong> Check out our latest component updates
        and improvements.
      </Announcement>
    </div>
  )
}
