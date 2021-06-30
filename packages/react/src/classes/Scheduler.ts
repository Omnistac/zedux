import {
  EvaluateAtomJob,
  Job,
  JobType,
  UpdateExternalDependentJob,
} from '../utils'
import { Ecosystem } from './Ecosystem'

export class Scheduler {
  // private _runStartTime?: number
  private scheduledJobs: Job[] = []
  private _isRunning?: boolean
  private _timeoutId?: ReturnType<typeof setTimeout>

  constructor(private readonly ecosystem: Ecosystem) {}

  /**
   * scheduler.flush()
   *
   * Kill any current timeout and run all jobs immediately
   */
  public flush() {
    if (this._isRunning) return // already flushing
    if (this._timeoutId) clearTimeout(this._timeoutId)

    this.runJobs()
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
      this._timeoutId = setTimeout(() => {
        this._timeoutId = undefined
        this.runJobs()
      })
    }
  }

  public unscheduleJob(task: () => void) {
    this.scheduledJobs = this.scheduledJobs.filter(job => job.task !== task)
  }

  public wipe() {
    // allow external jobs to proceed
    this.scheduledJobs = this.scheduledJobs.filter(
      job => job.type === JobType.UpdateExternalDependent
    )
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
}
