<<<<<<<< HEAD:app/app/(app)/examples/forms/page.tsx
import { Separator } from "@/registry/default/ui/separator"
========
import { Separator } from "@/registry/new-york/ui/separator"
>>>>>>>> shadcn/main:deprecated/www/app/(app)/examples/forms/page.tsx
import { ProfileForm } from "@/app/(app)/examples/forms/profile-form"

export default function SettingsProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Profile</h3>
        <p className="text-sm text-muted-foreground">
          This is how others will see you on the site.
        </p>
      </div>
      <Separator />
      <ProfileForm />
    </div>
  )
}
