"use client"

import { CodeEditor } from "@/registry/default/ui/code-editor"

export default function CodeEditorLanguageDemo() {
  return (
    <CodeEditor
      defaultValue={`def quicksort(arr):
    if len(arr) <= 1:
        return arr

    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]

    return quicksort(left) + middle + quicksort(right)

# Example usage
numbers = [3, 6, 8, 10, 1, 2, 1]
sorted_numbers = quicksort(numbers)
print(f"Sorted array: {sorted_numbers}")`}
      language="python"
      height="350px"
    />
  )
}
