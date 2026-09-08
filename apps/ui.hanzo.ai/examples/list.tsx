import { YStack } from "@hanzo/gui"
import { List, ListItem } from "@hanzo/ui"

/** Basic — four rows in a plain vertical list. */
export function Basic() {
  return (
    <List>
      <ListItem>First item in the list</ListItem>
      <ListItem>Second item in the list</ListItem>
      <ListItem>Third item in the list</ListItem>
      <ListItem>Fourth item in the list</ListItem>
    </List>
  )
}

/** Rich rows — a row can hold more than text, like any other element. */
export function RichRows() {
  const files = [
    { name: "report.pdf", size: "1.2 MB" },
    { name: "invoice.csv", size: "48 KB" },
    { name: "cover.png", size: "3.4 MB" },
  ]

  return (
    <List>
      {files.map((file) => (
        <ListItem key={file.name}>
          <YStack flexDirection="row" justify="space-between">
            <span>{file.name}</span>
            <span>{file.size}</span>
          </YStack>
        </ListItem>
      ))}
    </List>
  )
}

/** Empty state — an empty list still renders its `<ul>` frame. */
export function Empty() {
  return <List aria-label="no results" />
}
