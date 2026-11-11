import { createElement, type PropsWithChildren } from "react"
import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { HanzoProvider, type Message } from "../src/components/HanzoProvider"
import { useStreaming } from "../src/hooks/useStreaming"

const streamFromAPI = vi.hoisted(() => vi.fn())
const useRealHanzo = vi.hoisted(() => ({ current: false }))

vi.mock("../src/components/HanzoProvider", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../src/components/HanzoProvider")>()

  return {
    ...actual,
    useHanzo: () =>
      useRealHanzo.current
        ? actual.useHanzo()
        : {
            activeThreadId: "active-thread",
            isStreaming: true,
            streamMessage: streamFromAPI,
          },
  }
})

function message(
  content: string,
  role: Message["role"] = "assistant"
): Message {
  return {
    id: `${role}-${content}`,
    role,
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

async function* providerMessages(prompt: string, ...snapshots: string[]) {
  yield message(prompt, "user")
  yield* chunks(...snapshots)
}

function sseResponse(...content: string[]): Response {
  const encodedChunks = content.map((chunk) =>
    new TextEncoder().encode(
      `data: ${JSON.stringify({ choices: [{ delta: { content: chunk } }] })}\n`
    )
  )
  let index = 0

  return {
    ok: true,
    statusText: "OK",
    body: {
      getReader: () => ({
        read: vi.fn(async () =>
          index < encodedChunks.length
            ? { done: false, value: encodedChunks[index++] }
            : { done: true, value: undefined }
        ),
      }),
    },
  } as unknown as Response
}

function realProviderWrapper({ children }: PropsWithChildren) {
  return createElement(
    HanzoProvider,
    { apiKey: "test-key", apiUrl: "https://local.invalid/v1" },
    children
  )
}

describe("useStreaming completion content", () => {
  beforeEach(() => {
    streamFromAPI.mockReset()
    useRealHanzo.current = false
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it("completes with only the final cumulative assistant response", async () => {
    const onChunk = vi.fn()
    const onComplete = vi.fn()
    streamFromAPI.mockReturnValue(
      (async function* () {
        yield message("prompt", "user")
        yield message("Hel")
        yield message("Hello")
      })()
    )
    const { result } = renderHook(() => useStreaming({ onChunk, onComplete }))

    await act(async () => {
      await result.current.streamMessage("prompt")
    })

    expect(result.current.currentMessage).toBe("Hello")
    expect(onChunk.mock.calls.map(([chunk]) => chunk)).toEqual(["Hel", "lo"])
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "assistant",
        content: "Hello",
        threadId: "active-thread",
      })
    )
  })

  it("honors the real HanzoProvider user and cumulative assistant contract", async () => {
    useRealHanzo.current = true
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(sseResponse("Hel", "lo"))
      .mockResolvedValueOnce(sseResponse("By", "e"))
    vi.stubGlobal("fetch", fetchMock)
    const onChunk = vi.fn()
    const onComplete = vi.fn()
    const { result } = renderHook(() => useStreaming({ onChunk, onComplete }), {
      wrapper: realProviderWrapper,
    })

    await act(async () => {
      await result.current.streamMessage("prompt")
    })

    expect(result.current.currentMessage).toBe("Hello")

    await act(async () => {
      await result.current.streamMessage("second")
    })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(result.current.currentMessage).toBe("Bye")
    expect(onChunk.mock.calls.map(([chunk]) => chunk)).toEqual([
      "Hel",
      "lo",
      "By",
      "e",
    ])
    expect(
      onComplete.mock.calls.map(([completed]) => completed.content)
    ).toEqual(["Hello", "Bye"])
  })

  it("completes the first and later streams with their own content", async () => {
    const onComplete = vi.fn()
    streamFromAPI.mockImplementation((content: string) =>
      content === "first"
        ? providerMessages("first", "Hel", "Hello")
        : providerMessages("second", "By", "Bye")
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

  it("ignores non-assistant and wrong-thread messages", async () => {
    const onChunk = vi.fn()
    const onComplete = vi.fn()
    streamFromAPI.mockReturnValue(
      (async function* () {
        yield message("system note", "system")
        yield message("tool result", "tool")
        yield { ...message("wrong thread"), threadId: "other-thread" }
        yield message("Hel")
        yield message("Hello")
      })()
    )
    const { result } = renderHook(() => useStreaming({ onChunk, onComplete }))

    await act(async () => {
      await result.current.streamMessage("filtered")
    })

    expect(onChunk.mock.calls.map(([chunk]) => chunk)).toEqual(["Hel", "lo"])
    expect(result.current.currentMessage).toBe("Hello")
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({ content: "Hello", threadId: "active-thread" })
    )
  })

  it("completes an empty response without emitting chunks", async () => {
    const onChunk = vi.fn()
    const onComplete = vi.fn()
    streamFromAPI.mockReturnValue(providerMessages("empty"))
    const { result } = renderHook(() => useStreaming({ onChunk, onComplete }))

    await act(async () => {
      await result.current.streamMessage("empty")
    })

    expect(onChunk).not.toHaveBeenCalled()
    expect(result.current.currentMessage).toBe("")
    expect(result.current.progress).toBe(100)
    expect(result.current.isStreaming).toBe(false)
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({ content: "", threadId: "active-thread" })
    )
  })

  it("includes content flushed from a partial final buffer", async () => {
    const onChunk = vi.fn()
    const onComplete = vi.fn()
    streamFromAPI.mockReturnValue(chunks("Hel", "Hello"))
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
      yield message("Hello")
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
      yield message("AB")
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
