import { Job } from '@zedux/atoms/types/index'
import { runJobs, SchedulerBase } from './SchedulerBase'

// it's fine if we "leak" microtasks by queueing one then flushing
// synchronously. The microtask will just be a noop. And it's a microtask, so
// not a real leak unlike with `setTimeout`
const queueMicrotask =
  globalThis.queueMicrotask || (cb => Promise.resolve().then(cb))

export class AsyncScheduler extends SchedulerBase {
  /**
   * Insert a job at the end of the queue. Schedule a flush if this scheduler is
   * not currently running and not scheduled yet.
   *
   * Zedux internals shouldn't use this directly. Async jobs can be upgraded to
   * sync when scheduled in a "safe" context (basically not during React
   * render). We use the `scheduleAsync` helper instead.
   */
  public schedule(newJob: Job) {
    // schedule if we just pushed the first job onto the queue
    this.j.push(newJob) === 1 && queueMicrotask(() => runJobs(this))
  }
}
