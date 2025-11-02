import {
  Card3D,
  Card3DContent,
  Card3DDescription,
  Card3DFooter,
  Card3DHeader,
  Card3DTitle,
} from "@/registry/default/ui/3d-card"
import { Button } from "@/registry/default/ui/button"

export default function ThreeDCardDemo() {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-8">
      <Card3D className="w-[350px]">
        <Card3DHeader>
          <Card3DTitle>3D Card Effect</Card3DTitle>
          <Card3DDescription>
            Hover over this card to see the 3D tilt effect
          </Card3DDescription>
        </Card3DHeader>
        <Card3DContent>
          <p className="text-sm">
            This card responds to your mouse movement with a realistic 3D perspective
            transform and an interactive glare effect.
          </p>
        </Card3DContent>
        <Card3DFooter>
          <Button variant="outline">Learn More</Button>
        </Card3DFooter>
      </Card3D>
    </div>
  )
}
