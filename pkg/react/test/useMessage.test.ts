import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { Message } from "../src/components/HanzoProvider"
import { useMessage } from "../src/hooks/useMessage"

const sendToAPI = vi.hoisted(() => vi.fn())

vi.mock("../src/components/HanzoProvider", () => ({
  useHanzo: () => ({
    activeThreadId: "active-thread",
    sendMessage: sendToAPI,
  }),
}))

const completedMessage: Message = {
  id: "message-1",
  role: "assistant",
  content: "done",
  timestamp: new Date(0),
  threadId: "active-thread",
}

async function expectSendFailure(send: () => Promise<unknown>) {
  await act(async () => {
    await expect(send()).rejects.toThrow("offline")
  })
}

describe("useMessage retries", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
    sendToAPI.mockReset()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it("does not retry when zero retries are allowed", async () => {
    sendToAPI.mockRejectedValue(new Error("offline"))
    const { result } = renderHook(() =>
      useMessage({ autoRetry: true, maxRetries: 0, retryDelay: 100 })
    )

    await expectSendFailure(() => result.current.sendMessage("hello"))

    expect(sendToAPI).toHaveBeenCalledTimes(1)
    expect(vi.getTimerCount()).toBe(0)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error?.message).toBe("offline")
  })

  it("uses increasing delays and stops after the retry limit", async () => {
    const callTimes: number[] = []
    sendToAPI.mockImplementation(async () => {
      callTimes.push(Date.now())
      throw new Error("offline")
    })
    const { result } = renderHook(() =>
      useMessage({ autoRetry: true, maxRetries: 2, retryDelay: 100 })
    )

    await expectSendFailure(() => result.current.sendMessage("hello"))
    expect(callTimes).toEqual([0])

    await act(async () => vi.advanceTimersByTimeAsync(99))
    expect(callTimes).toEqual([0])

    await act(async () => vi.advanceTimersByTimeAsync(1))
    expect(callTimes).toEqual([0, 100])

    await act(async () => vi.advanceTimersByTimeAsync(199))
    expect(callTimes).toEqual([0, 100])

    await act(async () => vi.advanceTimersByTimeAsync(1))
    expect(callTimes).toEqual([0, 100, 300])
    expect(sendToAPI).toHaveBeenCalledTimes(3)
    expect(vi.getTimerCount()).toBe(0)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error?.message).toBe("offline")
  })

  it("clears the error and records an eventual retry success", async () => {
    const onError = vi.fn()
    const onSuccess = vi.fn()
    sendToAPI
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(completedMessage)
    const { result } = renderHook(() =>
      useMessage({
        autoRetry: true,
        maxRetries: 2,
        retryDelay: 100,
        onError,
        onSuccess,
      })
    )

    await expectSendFailure(() => result.current.sendMessage("hello"))
    expect(result.current.error?.message).toBe("offline")

    await act(async () => vi.advanceTimersByTimeAsync(100))

    expect(sendToAPI).toHaveBeenCalledTimes(2)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.lastMessage).toEqual(completedMessage)
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onSuccess).toHaveBeenCalledWith(completedMessage)
    expect(vi.getTimerCount()).toBe(0)
  })

  it("starts a fresh bounded cycle for a manual retry", async () => {
    sendToAPI
      .mockRejectedValueOnce(new Error("offline"))
      .mockRejectedValueOnce(new Error("offline"))
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(completedMessage)
    const { result } = renderHook(() =>
      useMessage({ autoRetry: true, maxRetries: 1, retryDelay: 100 })
    )

    await expectSendFailure(() => result.current.sendMessage("hello"))
    await act(async () => vi.advanceTimersByTimeAsync(100))
    expect(sendToAPI).toHaveBeenCalledTimes(2)
    expect(vi.getTimerCount()).toBe(0)

    await expectSendFailure(() => result.current.retry())
    await act(async () => vi.advanceTimersByTimeAsync(100))

    expect(sendToAPI).toHaveBeenCalledTimes(4)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.lastMessage).toEqual(completedMessage)
    expect(result.current.error).toBeNull()
    expect(vi.getTimerCount()).toBe(0)
  })

  it("makes one attempt when automatic retry is disabled", async () => {
    sendToAPI.mockRejectedValue(new Error("offline"))
    const { result } = renderHook(() =>
      useMessage({ autoRetry: false, maxRetries: 3, retryDelay: 100 })
    )

    await expectSendFailure(() => result.current.sendMessage("hello"))
    await act(async () => vi.advanceTimersByTimeAsync(1000))

    expect(sendToAPI).toHaveBeenCalledTimes(1)
    expect(vi.getTimerCount()).toBe(0)
  })

  it("does not leak automatic retry rejections", async () => {
    const unhandledRejection = vi.fn()
    process.on("unhandledRejection", unhandledRejection)
    sendToAPI.mockRejectedValue(new Error("offline"))
    const { result } = renderHook(() =>
      useMessage({ autoRetry: true, maxRetries: 1, retryDelay: 100 })
    )

    try {
      await expectSendFailure(() => result.current.sendMessage("hello"))
      await act(async () => vi.advanceTimersByTimeAsync(100))
      await Promise.resolve()

      expect(unhandledRejection).not.toHaveBeenCalled()
      expect(sendToAPI).toHaveBeenCalledTimes(2)
      expect(vi.getTimerCount()).toBe(0)
    } finally {
      process.off("unhandledRejection", unhandledRejection)
    }
  })

  it("keeps an automatic retry bound to its original request", async () => {
    sendToAPI.mockImplementation(async (content: string) => {
      if (content === "first") {
        throw new Error("offline")
      }
      return completedMessage
    })
    const { result } = renderHook(() =>
      useMessage({ autoRetry: true, maxRetries: 1, retryDelay: 100 })
    )

    await expectSendFailure(() => result.current.sendMessage("first"))
    await act(async () => {
      await expect(result.current.sendMessage("second")).resolves.toEqual(
        completedMessage
      )
    })
    await act(async () => vi.advanceTimersByTimeAsync(100))

    expect(sendToAPI.mock.calls.map(([content]) => content)).toEqual([
      "first",
      "second",
      "first",
    ])
    expect(vi.getTimerCount()).toBe(0)
  })
})
