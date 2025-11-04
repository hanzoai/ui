import { List, ListItem } from "@/registry/default/ui/list"

export default function ListDemo() {
  return (
    <div className="w-full min-h-[400px] flex items-center justify-center">
      <List>
        <ListItem>First item in the list</ListItem>
        <ListItem>Second item in the list</ListItem>
        <ListItem>Third item in the list</ListItem>
        <ListItem>Fourth item in the list</ListItem>
      </List>
    </div>
  )
}
