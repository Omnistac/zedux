import { Job } from '@zedux/atoms/types/index'
import { runJobs, SchedulerBase } from './SchedulerBase'

/**
 * An O(log n) replacement for `syncScheduler.j.findIndex`. Leaving this here
 * for now since the new, non-recursive, much faster code in
 * `SyncScheduler#schedule` is impossible to understand. It's exactly the same
 * as this
 */
// const findIndex = (
//   scheduler: SyncScheduler,
//   cb: (job: Job) => number,
//   index = Math.ceil((scheduler.j.length - scheduler.c) / 2) + scheduler.c - 1,
//   divisor = 2
// ): number => {
//   const job = scheduler.j[index]
//   if (job == null) return index

//   const direction = cb(job)
//   if (direction === 0) return index

//   if (divisor > scheduler.j.length - scheduler.c) {
//     return index + (direction === 1 ? 1 : 0)
//   }

//   const effectualSize = ((scheduler.j.length - scheduler.c) / divisor) << 0
//   const newIndex = Math.min(
//     scheduler.j.length - scheduler.c + scheduler.c - 1,
//     Math.max(0, index + Math.ceil(effectualSize / 2) * direction)
//   )

//   return findIndex(scheduler, cb, newIndex, divisor * divisor)
// }

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
   * Run all jobs immediately. Does nothing if this scheduler is already running.
   */
  public flush() {
    if (!this.r) runJobs(this)
  }

  /**
   * Insert an EvaluateGraphNode (2) or UpdateExternalDependent (3) job into the
   * queue. Insertion point depends on job's type and weight.
   */
  public schedule(newJob: Job) {
    const weight = newJob.W ?? 0

    // const index = findIndex(this, job => {
    //   if (job.T !== newJob.T) return +(newJob.T - job.T > 0) || -1 // 1 or -1

    //   // EvaluateGraphNode (2) and UpdateExternalDependent (3) jobs use weight
    //   // comparison. `W` will always be defined here. TODO: use discriminated
    //   // union types to reflect this
    //   return weight < job.W! ? -1 : +(weight > job.W!) // + = 0 or 1
    // })

    let index = Math.ceil((this.j.length - this.c) / 2) + this.c - 1
    let divisor = 2
    let job

    // This impossible-to-read loop is almost twice as fast as the above,
    // commented-out `findIndex` code. Refer to that to figure out what this
    // does; it's exactly the same algorithm.
    while ((job = this.j[index])) {
      const direction =
        job.T === newJob.T
          ? weight < job.W!
            ? -1
            : +(weight > job.W!)
          : +(newJob.T - job.T > 0) || -1

      if (direction === 0) break

      if (divisor > this.j.length - this.c) {
        index += direction === 1 ? 1 : 0
        break
      }

      index = Math.min(
        this.j.length - this.c + this.c - 1,
        Math.max(
          0,
          index +
            Math.ceil((((this.j.length - this.c) / divisor + 0.5) << 0) / 2) *
              direction
        )
      )

      divisor *= divisor
    }

    if (index === -1) {
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

    this.j.splice(this.c, 0, {
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
