import { Job } from '@zedux/atoms/types/index'
import { SchedulerBase } from './SchedulerBase'
import { resolveWeight } from '../../utils/graph'
import { ZeduxNode } from '../ZeduxNode'

export class SyncScheduler extends SchedulerBase {
  /**
   * `I`nterrupt - currently interrupt jobs only have one use - to defer `set`
   * and `mutate` calls that happen during node evaluation. Those deferred jobs
   * need to run in the order they were called in. The easiest way to do that is
   * only add a single Interrupt job that tracks all the others. Attach it to
   * this property and clean up when all interrupts are run.
   */
  public I: (() => void)[] | undefined = undefined

  /**
   * Insert an EvaluateZeduxNode (2) or UpdateExternalDependent (3) job into the
   * queue. Insertion point depends on job's type and weight.
   */
  public schedule(newJob: Job) {
    // For ZeduxNode jobs, ensure weight is calculated if needed
    if (newJob.R) resolveWeight(newJob as ZeduxNode)

    const weight = newJob.W ?? 0
    const numJobs = this.j.length

    let index = ((numJobs - this.r) / 2 + this.r) << 0
    let divisor = 2
    let job

    // An O(log n) quicksort replacement for `syncScheduler.j.findIndex`
    while ((job = this.j[index])) {
      const direction =
        job.T === newJob.T
          ? weight < job.W!
            ? -1
            : +(weight > job.W!)
          : +(newJob.T - job.T > 0) || -1

      if (direction === 0) break

      if (divisor > numJobs - this.r) {
        index += direction === 1 ? 1 : 0
        break
      }

      divisor *= 2

      index = Math.min(
        numJobs - 1,
        Math.max(
          this.r,
          index + Math.ceil((numJobs - this.r) / divisor) * direction
        )
      )
    }

    if (index === numJobs) {
      // push if we can 'cause it's faster
      this.j.push(newJob)
    } else {
      this.j.splice(index, 0, newJob)
    }

    // the sync scheduler never automatically flushes after adding jobs. Zedux
    // APIs that can possibly add jobs should either flush manually (not
    // recommended) or use `sheduler.pre` + `scheduler.post` to flush once after
    // all operations are queued.
  }

  /**
   * `i`nterrupt - add an interrupt job at the front of the queue or add a task
   * to the existing interrupt job if one is already scheduled
   */
  public i(task: () => void) {
    if (this.I) return this.I.push(task)

    const jobList = [task]

    this.j.splice(this.r, 0, {
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
}
