import {
  EvaluateAtomJob,
  Job,
  JobType,
  UpdateExternalDependentJob,
} from '../utils'
import { Ecosystem } from './Ecosystem'
import { Ghost } from './Ghost'

export class Scheduler {
  // private _runStartTime?: number
  private scheduledGhosts: Map<Ghost, true> = new Map()
  private scheduledJobs: Job[] = []
  private _ghostCleanupTimeoutId?: ReturnType<typeof setTimeout>
  private _jobTimeoutId?: ReturnType<typeof setTimeout>
  private _isRunning?: boolean

  constructor(private readonly ecosystem: Ecosystem) {}

  /**
   * scheduler.flush()
   *
   * Kill any current timeout and run all jobs immediately
   */
  public flush() {
    if (this._isRunning) return // already flushing
    if (this._jobTimeoutId) clearTimeout(this._jobTimeoutId)

    this.runJobs()
  }

  public scheduleGhostCleanup(ghost: Ghost) {
    this.scheduledGhosts.set(ghost, true)

    if (this._ghostCleanupTimeoutId) return

    this._ghostCleanupTimeoutId = setTimeout(() => {
      this._ghostCleanupTimeoutId = undefined
      this.cleanupGhosts()
    }, this.ecosystem.ghostTtlMs * 2) // ghosts can live for up to twice their ttl
  }

  public scheduleJob(newJob: Job) {
    const shouldSetTimeout = this.scheduledJobs.length === 0

    if (newJob.type === JobType.RunEffect) {
      this.scheduledJobs.push(newJob)
    } else if (newJob.type === JobType.EvaluateAtom) {
      this.insertEvaluateAtomJob(newJob)
    } else {
      this.insertUpdateExternalDependentJob(newJob)
    }

    // we just pushed the first job onto the queue
    if (shouldSetTimeout) {
      this.setTimeout()
    }
  }

  public unscheduleGhostCleanup(ghost: Ghost) {
    this.scheduledGhosts.delete(ghost)
  }

  public unscheduleJob(task: () => void) {
    this.scheduledJobs = this.scheduledJobs.filter(job => job.task !== task)
  }

  public wipe() {
    // allow external jobs to proceed. Note: AtomSelectors run as an
    // "UpdateExternalDependent" job, but with a lower flagScore (-2 - not actually
    // external). Filter those out too.
    this.scheduledJobs = this.scheduledJobs.filter(
      job => job.type === JobType.UpdateExternalDependent && job.flagScore >= 2
    )
  }

  private cleanupGhosts() {
    const now = Date.now()

    this.scheduledGhosts.forEach((_, ghost) => {
      if (ghost.edge.createdAt + this.ecosystem.ghostTtlMs > now) {
        return
      }

      ghost.destroy()
      this.scheduledGhosts.delete(ghost)
    })

    // schedule another timeout if there are still ghosts to clean up
    if (!this.scheduledGhosts.size) return

    this._ghostCleanupTimeoutId = setTimeout(() => {
      this._ghostCleanupTimeoutId = undefined
      this.cleanupGhosts()
    }, this.ecosystem.ghostTtlMs) // not * 2 like the original timeout
  }

  // An O(log n) replacement for this.scheduledJobs.findIndex()
  private findInsertionIndex(
    cb: (job: Job) => number,
    index = Math.ceil(this.scheduledJobs.length / 2) - 1,
    iteration = 1
  ): number {
    const job = this.scheduledJobs[index]
    if (typeof job === 'undefined') return index

    const direction = cb(job)
    if (!direction) return index

    const divisor = 2 ** iteration
    const isDone = divisor > this.scheduledJobs.length

    if (isDone) {
      return index + (direction === 1 ? 1 : 0)
    }

    const effectualSize = Math.round(this.scheduledJobs.length / divisor)
    const newIndex = Math.min(
      this.scheduledJobs.length - 1,
      Math.max(0, index + Math.ceil(effectualSize / 2) * direction)
    )

    return this.findInsertionIndex(cb, newIndex, iteration + 1)
  }

  // EvaluateAtom jobs go before any other job type and are sorted amongst
  // themselves by weight - lower weight evaluated first
  private insertEvaluateAtomJob(newJob: EvaluateAtomJob) {
    const { nodes } = this.ecosystem._graph
    const newJobGraphNode = nodes[newJob.keyHash]

    const index = this.findInsertionIndex(job => {
      if (job.type !== JobType.EvaluateAtom) return -1

      const thatJobGraphNode = nodes[job.keyHash]
      return newJobGraphNode.weight < thatJobGraphNode.weight
        ? -1
        : +(newJobGraphNode.weight > thatJobGraphNode.weight)
    })

    if (index === -1) {
      this.scheduledJobs.push(newJob)
      return
    }

    this.scheduledJobs.splice(index, 0, newJob)
  }

  // UpdateExternalDependent jobs go just after EvaluateAtom jobs, but before
  // anything else (there is only one other job type right now - RunEffect)
  private insertUpdateExternalDependentJob(newJob: UpdateExternalDependentJob) {
    const index = this.findInsertionIndex(job => {
      if (job.type === JobType.EvaluateAtom) return 1
      if (job.type !== JobType.UpdateExternalDependent) return -1

      return newJob.flagScore < job.flagScore
        ? -1
        : +(newJob.flagScore > job.flagScore)
    })

    if (index === -1) {
      this.scheduledJobs.push(newJob)
      return
    }

    this.scheduledJobs.splice(index, 0, newJob)
  }

  private runJobs() {
    // this._runStartTime = performance.now()
    // let counter = 0

    this._isRunning = true
    while (this.scheduledJobs.length) {
      const job = this.scheduledJobs.shift() as Job
      job.task()

      // if (!(++counter % 20) && performance.now() - this._runStartTime >= 100) {
      //   setTimeout(() => this.runJobs())
      //   break
      // }
    }
    this._isRunning = false
  }

  private setTimeout() {
    this._jobTimeoutId = setTimeout(() => {
      this._jobTimeoutId = undefined
      this.runJobs()
    })
  }
}
