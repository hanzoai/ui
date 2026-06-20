export async function parseStream(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  const chunks: string[] = []
  
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    
    const chunk = decoder.decode(value)
    chunks.push(chunk)
  }
  
  return chunks.join('')
}

export function* streamToGenerator<T>(stream: ReadableStream<T>) {
  const reader = stream.getReader()
  
  async function* generator() {
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        yield value
      }
    } finally {
      reader.releaseLock()
    }
  }
  
  return generator()
}