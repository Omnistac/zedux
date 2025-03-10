import { Job } from '@zedux/atoms/types/index'
import { Ecosystem } from '../Ecosystem'

/**
 * Run jobs until there are none left. Jobs can add other jobs continuously.
 * They'll all run.
 */
export const runJobs = (scheduler: SchedulerBase) => {
  const jobs = scheduler.j
  let errors: any[] | undefined

  scheduler.r = true
  while (jobs.length > scheduler.c) {
    const job = jobs[scheduler.c++] as Job
    try {
      job.j()
    } catch (err) {
      errors ??= []
      errors.push(err)
    }
  }

  scheduler.j = []
  scheduler.c = 0
  scheduler.r = false
  if (errors) throw errors[0]
}

export abstract class SchedulerBase {
  public c = 0

  /**
   * `r`unning - We set this to true internally when the scheduler starts
   * flushing. We also set it to true when batching updates, to prevent anything
   * from flushing.
   */
  public r = false

  // private _runStartTime?: number

  /**
   * The dynamic list of "full" jobs to run. Full jobs are:
   *
   * - Interrupt (1)
   * - EvaluateGraphNode (2)
   * - UpdateExternalDependent (3)
   * - RunEffect (4) (includes async jobs that were upgraded to sync jobs)
   */
  public j: Job[] = []

  constructor(private readonly ecosystem: Ecosystem) {}

  /**
   * Start running jobs. Behavior depends on scheduler type.
   */
  public abstract flush(): void

  /**
   * Call after any operation that may have nested flush attempts. This in
   * itself _is_ a flush attempt so whatever calls this may also need wrapping
   * in pre+post.
   *
   * This is the counterpart to `scheduler.pre()`. Call with the value returned
   * from `.pre()`
   */
  public post(prevIsRunning: boolean) {
    this.r = prevIsRunning
    this.flush()
  }

  /**
   * Call before any operation that may have nested flush attempts. When
   * combined with `scheduler.post`, this is essentially an `ecosystem.batch()`
   * call but more performant since it doesn't involve creating a closure.
   *
   * This ensures that many of Zedux's recursive call stacks don't flush
   * multiple times - only the top-level call finally flushes when everything is
   * scheduled.
   *
   * Returns a value that should be passed to `scheduler.post()` after the
   * potentially-nested flush operation. Always combine with
   * `scheduler.post(preReturnValue)`
   *
   * IMPORTANT: If an error can possibly be thrown before calling
   * `scheduler.post`, wrap the operation in `try..finally`
   *
   * Example:
   *
   * ```ts
   * const pre = scheduler.pre()
   * try {
   *   setAtomStateOrSendSignalEventsEtc()
   * } finally {
   *   scheduler.post(pre)
   * }
   * ```
   */
  public pre() {
    const prevIsRunning = this.r
    this.r = true

    return prevIsRunning
  }

  /**
   * Insert a job into the queue. Behavior depends on scheduler type.
   */
  public abstract schedule(newJob: Job): void

  public unschedule(job: Job) {
    const index = this.j.indexOf(job, this.c)

    if (index !== -1) this.j.splice(index, 1)
  }

  public wipe() {
    // allow external jobs to proceed. TODO: should we flush here?
    this.j = this.j.filter(
      job => job.T === 3 // UpdateExternalDependent (3)
    )
  }
}
