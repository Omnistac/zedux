import { Job, Scheduler as SchedulerInterface } from '@zedux/core'
import { Ecosystem } from './Ecosystem'

export class Scheduler implements SchedulerInterface {
  // private _runStartTime?: number
  private jobs: Job[] = []
  private _jobTimeoutId?: ReturnType<typeof setTimeout>
  private _isRunning?: boolean

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
    if (this._jobTimeoutId) clearTimeout(this._jobTimeoutId)

    this.runJobs()
  }

  /**
   * Insert a job into the queue. Insertion point depends on job's type and
   * weight.
   *
   * IMPORTANT: Setting and clearing timeouts is expensive. We need to always
   * pass `shouldSetTimeout: false` when we're going to immediately flush
   */
  public schedule(newJob: Job, shouldSetTimeout = true) {
    if (newJob.type === 4) {
      // RunEffect (4) jobs run in any order, after everything else
      this.jobs.push(newJob)
    } else {
      const { nodes } = this.ecosystem._graph
      const flags = newJob.flags ?? 0
      const weight = newJob.keyHash ? nodes[newJob.keyHash].weight : 0

      const index = this.findIndex(job => {
        if (job.type !== newJob.type) return +(newJob.type - job.type > 0) || -1 // 1 or -1

        // a job type can use either weight or flags comparison or neither
        if (job.keyHash) {
          const jobWeight = nodes[job.keyHash].weight

          return weight < jobWeight ? -1 : +(weight > jobWeight) // + = 0 or 1
        } else if (job.flags != null) {
          return flags < job.flags ? -1 : +(flags > job.flags)
        }

        return 0
      })

      if (index === -1) {
        this.jobs.push(newJob)
      } else {
        this.jobs.splice(index, 0, newJob)
      }
    }

    // we just pushed the first job onto the queue
    if (shouldSetTimeout && this.jobs.length === 1) {
      this.setTimeout()
    }
  }

  /**
   * Some jobs (update store jobs) must run immediately but also need the
   * scheduler to be running.
   *
   * Other jobs (inform subscriber jobs) must run immediately after the current
   * task. This is done by passing `false` for the 2nd param.
   */
  public scheduleNow(newJob: Job, runIfRunning = true) {
    if (this._isRunning === runIfRunning) return newJob.task()
    this.jobs.unshift(newJob)
    this.flush()
  }

  public unschedule(task: () => void) {
    const index = this.jobs.findIndex(job => job.task === task)

    if (index !== -1) this.jobs.splice(index, 1)
  }

  public wipe() {
    // allow external jobs to proceed. TODO: should we flush here?
    this.jobs = this.jobs.filter(
      job => job.type === 3 // UpdateExternalDependent (3)
    )
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

  private runJobs() {
    this._jobTimeoutId = undefined
    // this._runStartTime = performance.now()
    // let counter = 0

    this._isRunning = true
    while (this.jobs.length) {
      const job = this.jobs.shift() as Job
      job.task()

      // this "break" idea would need to only break if the next job is
      // interruptible (store updates - the highest-prio tasks - are not
      // interruptible)
      // if (!(++counter % 20) && performance.now() - this._runStartTime >= 100) {
      //   setTimeout(() => this.runJobs())
      //   break
      // }
    }
    this._isRunning = false
  }

  private setTimeout() {
    if (this._isRunning) return

    this._jobTimeoutId = setTimeout(() => {
      this.runJobs()
    })
  }
}
