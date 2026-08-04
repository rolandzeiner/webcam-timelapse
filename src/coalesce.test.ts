import { describe, expect, it } from "vitest";

import { Coalescer } from "./coalesce";

/** A task whose completion the test controls, one run at a time. */
function deferredTask() {
  const releases: Array<() => void> = [];
  let runs = 0;
  const task = (): Promise<void> => {
    runs += 1;
    return new Promise<void>((resolve) => releases.push(resolve));
  };
  return {
    task,
    get runs() {
      return runs;
    },
    /** Finish the oldest unfinished run. */
    release(): void {
      const next = releases.shift();
      if (!next) throw new Error("no run in flight");
      next();
    },
  };
}

/** Let queued microtasks settle. */
const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

describe("Coalescer", () => {
  it("runs the task once for a single request", async () => {
    const t = deferredTask();
    const c = new Coalescer(t.task);

    const done = c.request();
    expect(t.runs).toBe(1);

    t.release();
    await done;
    expect(t.runs).toBe(1);
  });

  it("never runs two tasks concurrently", async () => {
    const t = deferredTask();
    const c = new Coalescer(t.task);

    void c.request();
    void c.request();
    void c.request();
    await flush();

    // Three requests, one run: the shared <img> elements are only ever
    // touched by one swap at a time.
    expect(t.runs).toBe(1);
  });

  it("collapses a burst into exactly one follow-up run", async () => {
    const t = deferredTask();
    const c = new Coalescer(t.task);

    void c.request();
    await flush();
    // A drag's worth of positions arriving while the first frame loads.
    for (let i = 0; i < 50; i++) void c.request();

    t.release();
    await flush();
    // Not 51 sequential fetches — one, and it reads the latest playhead.
    expect(t.runs).toBe(2);

    t.release();
    await flush();
    expect(t.runs).toBe(2);
  });

  it("resolves a mid-run request only after the NEXT run", async () => {
    const t = deferredTask();
    const c = new Coalescer(t.task);

    void c.request();
    await flush();

    let settled = false;
    void c.request().then(() => {
      settled = true;
    });

    // Finishing the run that was already in flight cannot satisfy a
    // request it never saw.
    t.release();
    await flush();
    expect(settled).toBe(false);

    t.release();
    await flush();
    expect(settled).toBe(true);
  });

  it("keeps working after the task throws", async () => {
    let calls = 0;
    const c = new Coalescer(async () => {
      calls += 1;
      if (calls === 1) throw new Error("decode blew up");
    });

    await c.request();
    await c.request();

    // A chained promise would have stayed rejected and skipped this.
    expect(calls).toBe(2);
  });

  it("reports idle once the queue drains", async () => {
    const t = deferredTask();
    const c = new Coalescer(t.task);

    const done = c.request();
    expect(c.busy).toBe(true);

    t.release();
    await done;
    await flush();
    expect(c.busy).toBe(false);
  });

  it("starts a fresh run for a request made after it went idle", async () => {
    const t = deferredTask();
    const c = new Coalescer(t.task);

    const first = c.request();
    t.release();
    await first;

    void c.request();
    await flush();
    expect(t.runs).toBe(2);
  });
});
