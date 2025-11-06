import { Gantt } from "@/registry/default/ui/gantt"

export default function GanttDemo() {
  const sampleTasks = [
    {
      id: "1",
      name: "Project Planning",
      start: new Date(2024, 0, 1),
      end: new Date(2024, 0, 15),
      progress: 100,
    },
    {
      id: "2",
      name: "Design Phase",
      start: new Date(2024, 0, 10),
      end: new Date(2024, 1, 5),
      progress: 75,
    },
    {
      id: "3",
      name: "Development",
      start: new Date(2024, 1, 1),
      end: new Date(2024, 3, 30),
      progress: 45,
    },
    {
      id: "4",
      name: "Testing",
      start: new Date(2024, 3, 15),
      end: new Date(2024, 4, 15),
      progress: 0,
    },
  ]

  return (
    <div className="w-full max-w-3xl">
      <Gantt tasks={sampleTasks} />
    </div>
  )
}
