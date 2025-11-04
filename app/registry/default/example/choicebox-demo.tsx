import { Choicebox } from "@/registry/default/ui/choicebox"

export default function ChoiceboxDemo() {
  const options = [
    {
      value: "option1",
      label: "Option 1",
      description: "This is the first option",
    },
    {
      value: "option2",
      label: "Option 2",
      description: "This is the second option",
    },
    {
      value: "option3",
      label: "Option 3",
      description: "This is the third option",
    },
  ]

  return (
    <div className="w-full min-h-[400px] flex items-center justify-center">
      <Choicebox options={options} />
    </div>
  )
}
