/**
 * Latest-wins serialisation for an async task.
 *
 * Pure module — no DOM, no Lit, no `hass` — so the scheduling rule that
 * decides which frame the card ends up showing can be unit-tested without
 * mounting a card.
 *
 * The problem this exists for: the frame swap owns two shared `<img>`
 * elements, so it must never run twice at once, but the obvious fix —
 * chaining every request onto a promise — makes the queue GROW with user
 * input. A drag across a fortnight lands a hundred requests, each one a
 * network fetch plus a decode, and the card then walks through all
 * hundred positions in order before it reaches the one the thumb actually
 * stopped on. It reads as "the slider does not update the picture".
 *
 * Every intermediate request is dead the moment a newer one arrives: the
 * task always reads the CURRENT playhead, so running it twice in a row
 * with no request in between paints the same frame twice. So requests
 * collapse: at most one run in flight, and at most one more queued behind
 * it, no matter how many arrive.
 *
 * The contract callers rely on is "resolves once a run that saw MY
 * request has finished" — a request arriving mid-run waits for the NEXT
 * run, never the one already in flight, which cannot have seen it. That
 * is what lets the playback loop await a swap and trust the frame is on
 * screen before it starts timing the next one.
 */
export class Coalescer {
  private running = false;
  /** A request arrived mid-run; drain once more when this one finishes. */
  private queued = false;
  /** Resolvers waiting for a run that starts after they were added. */
  private waiters: Array<() => void> = [];

  constructor(private readonly task: () => Promise<void>) {}

  /**
   * Ask for a run, collapsing into whatever is already scheduled.
   *
   * Resolves when a run that started after this call has finished — or
   * immediately after the current one when nothing else intervenes.
   */
  request(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.waiters.push(resolve);
      if (this.running) {
        this.queued = true;
        return;
      }
      void this.drain();
    });
  }

  /** Whether a run is in flight or queued. Diagnostics and tests. */
  get busy(): boolean {
    return this.running;
  }

  private async drain(): Promise<void> {
    // Set before the first await so a `request()` made synchronously
    // after this one sees a run in flight and queues instead of starting
    // a second, concurrent drain.
    this.running = true;
    try {
      do {
        this.queued = false;
        // Snapshot before awaiting: these are the callers this run
        // satisfies. Anything that arrives while the task runs lands in a
        // fresh array and is answered by the next iteration.
        const waiters = this.waiters;
        this.waiters = [];
        try {
          await this.task();
        } catch {
          // Contained on purpose. A chained promise would stay rejected
          // for the lifetime of the card, silently skipping every future
          // run — one bad frame and the picture never updates again.
        }
        for (const waiter of waiters) {
          waiter();
        }
      } while (this.queued);
    } finally {
      this.running = false;
    }
  }
}
