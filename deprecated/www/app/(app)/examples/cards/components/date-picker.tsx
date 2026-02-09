<<<<<<<< HEAD:app/app/(app)/examples/cards/components/date-picker.tsx
import DatePickerWithRange from "@/registry/default/example/date-picker-with-range"
import { Card, CardContent } from "@/registry/default/ui/card"
import { Label } from "@/registry/default/ui/label"
========
import DatePickerWithRange from "@/registry/default/examples/date-picker-with-range"
import { Card, CardContent } from "@/registry/new-york/ui/card"
import { Label } from "@/registry/new-york/ui/label"
>>>>>>>> shadcn/main:deprecated/www/app/(app)/examples/cards/components/date-picker.tsx

export function DemoDatePicker() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-2">
          <Label htmlFor="date" className="shrink-0">
            Pick a date
          </Label>
          <DatePickerWithRange className="[&>button]:w-[260px]" />
        </div>
      </CardContent>
    </Card>
  )
}
