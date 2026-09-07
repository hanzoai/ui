import { useState } from "react"
import { Paragraph, YStack } from "@hanzo/gui"
import { Dropzone } from "@hanzo/ui"

/** Default — drag files onto the region, or click it to browse; each drop is added to the list below it. */
export function Default() {
  return <Dropzone />
}

/** Images only — `accept` narrows what a drop or the file picker will take; anything else is rejected. */
export function ImagesOnly() {
  const [rejected, setRejected] = useState(0)
  return (
    <YStack gap="$2" width="100%">
      <Dropzone
        accept={{ "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"] }}
        onFilesRejected={(files) => setRejected((n) => n + files.length)}
      />
      {rejected > 0 ? (
        <Paragraph color="$color11">
          {rejected} file{rejected === 1 ? "" : "s"} rejected — only images are accepted here.
        </Paragraph>
      ) : null}
    </YStack>
  )
}

/** Single file — `maxFiles={1}` keeps the list to the most recent drop. */
export function SingleFile() {
  return <Dropzone maxFiles={1} />
}

/** Disabled — the region takes no drop and the picker will not open. */
export function Disabled() {
  return <Dropzone disabled />
}
