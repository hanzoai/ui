// A minimal pub/sub with a bounded ring buffer. The engine pushes every captured
// Interaction here so a session-playback UI can subscribe to the live stream and
// read the recent history. Independent of any framework and fail-soft: one
// throwing subscriber never blocks the others or the engine.

export class Stream<T> {
  private subs = new Set<(value: T) => void>()
  private ring: T[] = []

  constructor(private readonly capacity = 500) {}

  /** Push a value: append to the bounded buffer, then notify every subscriber. */
  emit(value: T): void {
    this.ring.push(value)
    if (this.ring.length > this.capacity) this.ring.splice(0, this.ring.length - this.capacity)
    for (const fn of this.subs) {
      try {
        fn(value)
      } catch {
        /* a broken listener must not break the stream */
      }
    }
  }

  /** Subscribe to future values. Returns an unsubscribe function. */
  subscribe(fn: (value: T) => void): () => void {
    this.subs.add(fn)
    return () => {
      this.subs.delete(fn)
    }
  }

  /** A snapshot of the retained history (oldest→newest). */
  buffer(): readonly T[] {
    return this.ring.slice()
  }

  /** Drop retained history. */
  clear(): void {
    this.ring = []
  }
}
