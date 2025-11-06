import { Form } from "@/registry/default/ui/form"
import { Button } from "@/registry/default/ui/button"

export default function FormDemo() {
  return (
    <div className="w-full min-h-[400px] flex items-center justify-center p-8">
      <div className="w-full max-w-md space-y-4 p-6 border rounded-lg">
        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <Button type="submit" className="w-full">
          Submit
        </Button>
      </div>
    </div>
  )
}
