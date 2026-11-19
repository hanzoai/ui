/** Hands `content` to the reader as a file called `name`. */
export function save(content: string, name: string, type: string) {
  if (typeof document === 'undefined' || typeof URL === 'undefined' || !content) return
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
