"use client"

import * as React from "react"
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Code,
  Rocket,
  Trophy,
} from "lucide-react"

import { Badge } from "@/registry/default/ui/badge"
import { Button } from "@/registry/default/ui/button"
import { Card } from "@/registry/default/ui/card"
import { Progress } from "@/registry/default/ui/progress"
import { Timeline } from "@/registry/default/ui/timeline"
import type { TimelineItem } from "@/registry/default/ui/timeline"

export default function TimelineDemo() {
  const [variant, setVariant] = React.useState<
    "default" | "alternate" | "compact" | "simple"
  >("default")
  const [orientation, setOrientation] = React.useState<
    "vertical" | "horizontal"
  >("vertical")
  const [animated, setAnimated] = React.useState(true)

  const basicItems: TimelineItem[] = [
    {
      id: "1",
      title: "Project Kickoff",
      description: "Initial planning and team formation",
      date: "January 1, 2024",
      time: "9:00 AM",
      status: "completed",
      icon: <Rocket className="h-4 w-4" />,
    },
    {
      id: "2",
      title: "Development Sprint 1",
      description: "Core features implementation",
      date: "January 15, 2024",
      time: "2:00 PM",
      status: "completed",
      icon: <Code className="h-4 w-4" />,
    },
    {
      id: "3",
      title: "User Testing",
      description: "Gathering feedback from beta users",
      date: "February 1, 2024",
      status: "active",
      icon: <AlertCircle className="h-4 w-4" />,
    },
    {
      id: "4",
      title: "Product Launch",
      description: "Public release and marketing campaign",
      date: "March 1, 2024",
      status: "pending",
      icon: <Trophy className="h-4 w-4" />,
    },
  ]

  const richItems: TimelineItem[] = [
    {
      id: "1",
      title: "Version 1.0 Released",
      description: "Initial release with core features",
      date: "Jan 1, 2024",
      status: "completed",
      icon: <CheckCircle className="h-4 w-4" />,
      content: (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Badge>React 18</Badge>
            <Badge>TypeScript</Badge>
            <Badge>Tailwind CSS</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Successfully deployed to production with 99.9% uptime
          </p>
        </div>
      ),
    },
    {
      id: "2",
      title: "Version 2.0 Beta",
      description: "Major update with new features in testing",
      date: "Feb 15, 2024",
      status: "active",
      icon: <Clock className="h-4 w-4" />,
      content: (
        <div className="space-y-2">
          <Progress value={75} className="h-2" />
          <p className="text-xs text-muted-foreground">75% Complete</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              View Changes
            </Button>
            <Button size="sm">Test Beta</Button>
          </div>
        </div>
      ),
    },
    {
      id: "3",
      title: "Version 3.0 Planning",
      description: "Next major release roadmap",
      date: "Apr 1, 2024",
      status: "pending",
      content: (
        <Card className="p-3">
          <h4 className="text-sm font-semibold mb-2">Planned Features:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• AI-powered suggestions</li>
            <li>• Real-time collaboration</li>
            <li>• Advanced analytics dashboard</li>
            <li>• Mobile app support</li>
          </ul>
        </Card>
      ),
    },
  ]

  const items =
    variant === "compact" || variant === "simple" ? basicItems : richItems

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="flex flex-wrap gap-4">
        <div className="flex gap-2">
          <Button
            variant={variant === "default" ? "default" : "outline"}
            size="sm"
            onClick={() => setVariant("default")}
          >
            Default
          </Button>
          <Button
            variant={variant === "alternate" ? "default" : "outline"}
            size="sm"
            onClick={() => setVariant("alternate")}
          >
            Alternate
          </Button>
          <Button
            variant={variant === "compact" ? "default" : "outline"}
            size="sm"
            onClick={() => setVariant("compact")}
          >
            Compact
          </Button>
          <Button
            variant={variant === "simple" ? "default" : "outline"}
            size="sm"
            onClick={() => setVariant("simple")}
          >
            Simple
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant={orientation === "vertical" ? "default" : "outline"}
            size="sm"
            onClick={() => setOrientation("vertical")}
            disabled={
              variant === "alternate" ||
              variant === "compact" ||
              variant === "simple"
            }
          >
            Vertical
          </Button>
          <Button
            variant={orientation === "horizontal" ? "default" : "outline"}
            size="sm"
            onClick={() => setOrientation("horizontal")}
            disabled={
              variant === "alternate" ||
              variant === "compact" ||
              variant === "simple"
            }
          >
            Horizontal
          </Button>
        </div>

        <Button
          variant={animated ? "default" : "outline"}
          size="sm"
          onClick={() => setAnimated(!animated)}
        >
          {animated ? "Animated" : "Static"}
        </Button>
      </div>

      {/* Timeline */}
      <Timeline
        items={items}
        variant={variant}
        orientation={orientation}
        animated={animated}
      />
    </div>
  )
}
