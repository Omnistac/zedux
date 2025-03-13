import { Job } from '@zedux/atoms/types/index'
import { Ecosystem } from '../Ecosystem'

/**
 * Run jobs until there are none left. Jobs can add other jobs continuously.
 * They'll all run.
 */
export const runJobs = (scheduler: SchedulerBase) => {
  const jobs = scheduler.j
  let errors: any[] | undefined

  while (jobs.length > scheduler.r) {
    const job = jobs[scheduler.r++]
    try {
      job.j()
    } catch (err) {
      errors ??= []
      errors.push(err)
    }
  }

  scheduler.r = 0
  scheduler.j = []
  if (errors) throw errors[0]
}

export abstract class SchedulerBase {
  /**
   * `r`unCounter - We increment this as the scheduler is running to prevent
   * expensive array resizing from `.shift()` calls. This is always a non-zero
   * value if the scheduler is running, so we use it to detect that too.
   */
  public r = 0

  /**
   * `f`lushCounter - `scheduler.pre` and `scheduler.post` work by
   * incrementing/decrementing this counter. When it hits 0 in `scheduler.post`
   * after having been incremented by previous `scheduler.pre` calls, we flush.
   */
  public f = 0

  // private _runStartTime?: number

  /**
   * The dynamic list of "full" jobs to run. Full jobs are:
   *
   * - Interrupt (1)
   * - EvaluateZeduxNode (2)
   * - UpdateExternalDependent (3)
   * - RunEffect (4) (includes async jobs that were upgraded to sync jobs)
   */
  public j: Job[] = []

  constructor(private readonly ecosystem: Ecosystem) {}

  /**
   * Run all jobs immediately. Does nothing if this scheduler is already
   * running.
   */
  public flush() {
    if (this.r === 0) runJobs(this)
  }

  /**
   * Call after any operation that may have nested flush attempts. This in
   * itself _is_ a flush attempt so whatever calls this may also need wrapping
   * in pre+post.
   *
   * This is the counterpart to `scheduler.pre()`. Call with the value returned
   * from `.pre()`
   */
  public post() {
    if (--this.f === 0) this.flush()
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
   * IMPORTANT: Always combine with `scheduler.post()`. If an error can possibly
   * be thrown before calling `scheduler.post`, wrap the operation in
   * `try..finally`
   *
   * Example:
   *
   * ```ts
   * scheduler.pre()
   * try {
   *   setAtomStateOrSendSignalEventsEtc()
   * } finally {
   *   scheduler.post()
   * }
   * ```
   */
  public pre() {
    this.f++
  }

  /**
   * Insert a job into the queue. Behavior depends on scheduler type.
   */
  public abstract schedule(newJob: Job): void

  public unschedule(job: Job) {
    const index = this.j.indexOf(job, this.r)

    if (index !== -1) this.j.splice(index, 1)
  }

  public wipe() {
    // allow external jobs to proceed. TODO: should we flush here?
    this.j = this.j.filter(
      job => job.T === 3 // UpdateExternalDependent (3)
    )
  }
}
