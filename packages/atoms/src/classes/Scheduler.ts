import { Job, Scheduler as SchedulerInterface } from '@zedux/core'
import { Ecosystem } from './Ecosystem'

export class Scheduler implements SchedulerInterface {
  /**
   * `I`nterrupt - currently interrupt jobs only have one use - to defer `set`
   * and `mutate` calls that happen during node evaluation. Those deferred jobs
   * need to run in the order they were called in. The easiest way to do that is
   * only add a single Interrupt job that tracks all the others. Attach it to
   * this property and clean up when all interrupts are run.
   */
  public I: (() => void)[] | undefined = undefined

  /**
   * We set this to true internally when the scheduler starts flushing. We also
   * set it to true when batching updates, to prevent anything from flushing.
   */
  public _isRunning = false
  public _isRunningNows = false

  // private _runStartTime?: number

  /**
   * The dynamic list of "full" jobs to run. Full jobs are:
   *
   * - Interrupt (1) (yes, temporarily shares the same number as
   *   InformSubscribers. These job types are added to different arrays, so
   *   there's no conflict. This will be fixed when core package has its own
   *   scheduler)
   * - EvaluateGraphNode (2)
   * - UpdateExternalDependent (3)
   */
  private jobs: Job[] = []

  /**
   * The dynamic list of "now" jobs to run. Now jobs are:
   *
   * - UpdateStore (0)
   * - InformSubscribers (1)
   */
  private nows: Job[] = []
  private _handle: ReturnType<typeof setTimeout> | undefined = undefined
  private _runAfterNows: boolean | undefined = undefined

  constructor(private readonly ecosystem: Ecosystem) {}

  /**
   * Kill any current timeout and run all jobs immediately.
   *
   * IMPORTANT: Setting and clearing timeouts is expensive. We need to always
   * pass `shouldSetTimeout: false` to scheduler.schedule() when we're going
   * to immediately flush
   */
  public flush() {
    if (this._isRunning) return // already flushing
    if (this._handle) {
      clearTimeout(this._handle)
      this._handle = undefined
    }

    this.runJobs()
  }

  /**
   * Schedule an EvaluateGraphNode (2) or UpdateExternalDependent (3) job
   */
  public insertJob(newJob: Job) {
    const weight = newJob.W ?? 0

    const index = this.findIndex(job => {
      if (job.T !== newJob.T) return +(newJob.T - job.T > 0) || -1 // 1 or -1

      // EvaluateGraphNode (2) and UpdateExternalDependent (3) jobs use weight
      // comparison. `W` will always be defined here. TODO: use discriminated
      // union types to reflect this
      return weight < job.W! ? -1 : +(weight > job.W!) // + = 0 or 1
    })

    if (index === -1) {
      this.jobs.push(newJob)
    } else {
      this.jobs.splice(index, 0, newJob)
    }
  }

  /**
   * Call after any operation that may have nested flush attempts. This in
   * itself _is_ a flush attempt so whatever calls may also need wrapping in
   * pre+post.
   *
   * This is the counterpart to `scheduler.pre()`. Call with the value returned
   * from `.pre()`
   */
  public post(prevIsRunning: boolean) {
    this._isRunning = prevIsRunning
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
    const prevIsRunning = this._isRunning
    this._isRunning = true

    return prevIsRunning
  }

  /**
   * Insert a job into the queue. Insertion point depends on job's type and
   * weight.
   *
   * IMPORTANT: Setting and clearing timeouts is expensive. We need to always
   * pass `shouldSetTimeout: false` when we're going to immediately flush
   */
  public schedule(newJob: Job) {
    this.insertJob(newJob)

    // we just pushed the first job onto the queue
    if (this.jobs.length === 1 && !this._isRunning) {
      this.setTimeout()
    }
  }

  /**
   * UpdateStore (0) jobs must run immediately but also need the scheduler to be
   * running all "now" jobs.
   *
   * InformSubscriber (1) jobs must run immediately after the current task.
   */
  public scheduleNow(newJob: Job) {
    if (this._isRunningNows && newJob.T === 0) return newJob.j()

    this.nows[newJob.T === 1 ? 'push' : 'unshift'](newJob)

    this.runJobs(true)
  }

  public unschedule(job: Job) {
    const index = this.jobs.indexOf(job)

    if (index !== -1) this.jobs.splice(index, 1)
  }

  public wipe() {
    // allow external jobs to proceed. TODO: should we flush here?
    this.jobs = this.jobs.filter(
      job => job.T === 3 // UpdateExternalDependent (3)
    )
  }

  /**
   * `i`nterrupt - add an interrupt job at the front of the queue or add a task
   * to the existing interrupt job if one is already scheduled
   */
  public i(task: () => void) {
    if (this.I) return this.I.push(task)

    const jobList = [task]

    this.jobs.unshift({
      j: () => {
        for (const job of jobList) {
          job()
        }

        this.I = undefined
      },
      T: 1,
    })

    this.I = jobList
  }

  // An O(log n) replacement for this.jobs.findIndex()
  private findIndex(
    cb: (job: Job) => number,
    index = Math.ceil(this.jobs.length / 2) - 1,
    iteration = 1
  ): number {
    const job = this.jobs[index]
    if (job == null) return index

    const direction = cb(job)
    if (!direction) return index

    const divisor = 2 ** iteration
    const isDone = divisor > this.jobs.length

    if (isDone) {
      return index + (direction === 1 ? 1 : 0)
    }

    const effectualSize = Math.round(this.jobs.length / divisor)
    const newIndex = Math.min(
      this.jobs.length - 1,
      Math.max(0, index + Math.ceil(effectualSize / 2) * direction)
    )

    return this.findIndex(cb, newIndex, iteration + 1)
  }

  /**
   * Run either all "full" jobs or all "now" jobs. Since the jobs are split, we
   * can essentially have two schedulers running at once. "Now" jobs must always
   * run before any "full" jobs, so the "full" jobs runner has to flush any
   * "now"s that come up while it's flushing "full"s.
   *
   * Don't run "full" jobs while "now"s are running. It leads to "now"s being
   * deferred until after "full"s finish. This is backwards and can lead to
   * reevaluation loops.
   */
  private runJobs(isNows?: boolean) {
    // we prevent this function from running at all if no "full" jobs are
    // scheduled
    if (this._isRunningNows) {
      // schedule a "full" jobs run after "now"s finish
      this._runAfterNows = !isNows
      return
    }

    const jobs = isNows ? this.nows : this.jobs
    const runningKey: keyof Pick<this, '_isRunning' | '_isRunningNows'> = isNows
      ? '_isRunningNows'
      : '_isRunning'

    const nows = this.nows
    let errors: any[] | undefined

    this[runningKey] = true
    while (jobs.length) {
      const job = (nows.length ? nows : jobs).shift() as Job
      try {
        job.j()
      } catch (err) {
        errors ??= []
        errors.push(err)
      }
    }

    this[runningKey] = false
    if (errors) throw errors[0]

    if (this._runAfterNows) {
      this._runAfterNows = false
      this.runJobs()
    }
  }

  private setTimeout() {
    if (this._isRunning) return

    this._handle = setTimeout(() => {
      this._handle = undefined
      this.runJobs()
    })
  }
}
