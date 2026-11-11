import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { Message } from "../src/components/HanzoProvider"
import { useStreaming } from "../src/hooks/useStreaming"

const streamFromAPI = vi.hoisted(() => vi.fn())

vi.mock("../src/components/HanzoProvider", () => ({
  useHanzo: () => ({
    activeThreadId: "active-thread",
    isStreaming: true,
    streamMessage: streamFromAPI,
  }),
}))

function message(content: string): Message {
  return {
    id: `message-${content}`,
    role: "assistant",
    content,
    timestamp: new Date(0),
    threadId: "active-thread",
  }
}

async function* chunks(...content: string[]) {
  for (const chunk of content) {
    yield message(chunk)
  }
}

describe("useStreaming completion content", () => {
  beforeEach(() => {
    streamFromAPI.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("completes the first and later streams with their own content", async () => {
    const onComplete = vi.fn()
    streamFromAPI.mockImplementation((content: string) =>
      content === "first" ? chunks("Hel", "lo") : chunks("By", "e")
    )
    const { result } = renderHook(() => useStreaming({ onComplete }))

    await act(async () => {
      await result.current.streamMessage("first")
    })
    expect(result.current.currentMessage).toBe("Hello")

    await act(async () => {
      await result.current.streamMessage("second")
    })

    expect(result.current.currentMessage).toBe("Bye")
    expect(
      onComplete.mock.calls.map(([completed]) => completed.content)
    ).toEqual(["Hello", "Bye"])
  })

  it("includes content flushed from a partial final buffer", async () => {
    const onChunk = vi.fn()
    const onComplete = vi.fn()
    streamFromAPI.mockReturnValue(chunks("Hel", "lo"))
    const { result } = renderHook(() =>
      useStreaming({ bufferSize: 3, onChunk, onComplete })
    )

    await act(async () => {
      await result.current.streamMessage("buffered")
    })

    expect(onChunk).toHaveBeenCalledTimes(1)
    expect(onChunk).toHaveBeenCalledWith("Hello")
    expect(result.current.currentMessage).toBe("Hello")
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({ content: "Hello" })
    )
  })

  it("completes with all content when throttling flushes buffered chunks", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
    const onChunk = vi.fn()
    const onComplete = vi.fn()
    streamFromAPI.mockImplementation(async function* () {
      yield message("Hel")
      vi.setSystemTime(100)
      yield message("lo")
    })
    const { result } = renderHook(() =>
      useStreaming({ bufferSize: 10, throttleMs: 100, onChunk, onComplete })
    )

    await act(async () => {
      await result.current.streamMessage("throttled")
    })

    expect(onChunk).toHaveBeenCalledTimes(1)
    expect(onChunk).toHaveBeenCalledWith("Hello")
    expect(result.current.currentMessage).toBe("Hello")
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({ content: "Hello" })
    )
  })

  it("keeps streamMessage stable while chunks update currentMessage", async () => {
    let releaseSecondChunk: (() => void) | undefined
    const secondChunkReady = new Promise<void>((resolve) => {
      releaseSecondChunk = resolve
    })
    streamFromAPI.mockImplementation(async function* () {
      yield message("A")
      await secondChunkReady
      yield message("B")
    })
    const { result } = renderHook(() => useStreaming())
    const initialStreamMessage = result.current.streamMessage
    let pendingStream: Promise<void>

    act(() => {
      pendingStream = result.current.streamMessage("identity")
    })
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(result.current.currentMessage).toBe("A")
    expect(result.current.streamMessage).toBe(initialStreamMessage)

    await act(async () => {
      releaseSecondChunk?.()
      await pendingStream
    })

    expect(result.current.currentMessage).toBe("AB")
    expect(result.current.streamMessage).toBe(initialStreamMessage)
  })

  it("preserves stream errors without completing a failed response", async () => {
    const onComplete = vi.fn()
    const onError = vi.fn()
    streamFromAPI.mockImplementation(async function* () {
      yield message("partial")
      throw new Error("stream failed")
    })
    const { result } = renderHook(() => useStreaming({ onComplete, onError }))

    await act(async () => {
      await result.current.streamMessage("failing")
    })

    expect(result.current.isStreaming).toBe(false)
    expect(result.current.error?.message).toBe("stream failed")
    expect(onError).toHaveBeenCalledWith(expect.any(Error))
    expect(onComplete).not.toHaveBeenCalled()
  })
})
