import { AnimatedList } from "@/registry/new-york/ui/animated-list"

const listItems = [
  {
    id: 1,
    content: (
      <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
          ✓
        </div>
        <div>
          <div className="font-semibold">Task Completed</div>
          <div className="text-sm text-muted-foreground">Project documentation updated</div>
        </div>
      </div>
    ),
  },
  {
    id: 2,
    content: (
      <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
        <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
          📧
        </div>
        <div>
          <div className="font-semibold">New Message</div>
          <div className="text-sm text-muted-foreground">You have 3 unread messages</div>
        </div>
      </div>
    ),
  },
  {
    id: 3,
    content: (
      <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
        <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
          💰
        </div>
        <div>
          <div className="font-semibold">Payment Received</div>
          <div className="text-sm text-muted-foreground">$1,234.56 deposited</div>
        </div>
      </div>
    ),
  },
]

export default function AnimatedListDemo() {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-8">
      <div className="w-full max-w-md">
        <AnimatedList items={listItems} animation="slide" />
      </div>
    </div>
  )
}
