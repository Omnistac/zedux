import { Job } from '@zedux/atoms/types/index'
import { runJobs, SchedulerBase } from './SchedulerBase'

const queueMicrotask =
  globalThis.queueMicrotask || (cb => Promise.resolve().then(cb))

const schedule = (scheduler: AsyncScheduler) => {
  if (scheduler.r) return

  queueMicrotask(() => {
    runJobs(scheduler)
  })
}

export class AsyncScheduler extends SchedulerBase {
  /**
   * Kill any current timeout and run all jobs immediately.
   */
  public flush() {
    if (this.r) return // already flushing

    runJobs(this)
  }

  /**
   * Insert a job at the end of the queue. Schedule a flush if this scheduler is
   * not currently running and not scheduled yet.
   *
   * Zedux internals shouldn't use this directly. Async jobs can be upgraded to
   * sync when scheduled in a "safe" context (basically not during React
   * render). We use the `scheduleAsync` helper instead.
   */
  public schedule(newJob: Job) {
    // schedule if we just pushed the first job onto the queue and aren't
    // already running (can happen if an effect immediately triggers the sync
    // scheduler which schedules more async jobs).
    this.j.push(newJob) === 1 && !this.r && schedule(this)
  }
}
