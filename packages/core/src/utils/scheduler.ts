import { Job } from './types'

/**
 * Run jobs until there are none left. Jobs can add other jobs continuously -
 * that's how composed stores work.
 */
const runJobs = (scheduler: Scheduler) => {
  if (scheduler.i) return

  const jobs = scheduler.j
  let errors: any[] | undefined
  scheduler.i = true

  while (jobs.length) {
    const job = jobs.shift() as Job
    try {
      job.j()
    } catch (err) {
      errors ??= []
      errors.push(err)
    }
  }

  scheduler.i = false
  if (errors) throw errors[0]
}

export class Scheduler {
  /**
   * `i`sRunning - tracks whether the scheduler is currently flushing.
   */
  public i = false

  /**
   * `j`obs - the dynamic list of jobs to run. Jobs are:
   *
   * - UpdateStore (0)
   * - InformSubscribers (1)
   */
  public j: Job[] = []

  /**
   * `s`chedule - add a job to the queue. Starts running jobs if we're not
   * already running.
   *
   * UpdateStore (0) jobs must run immediately but also need the scheduler to be
   * running.
   *
   * InformSubscriber (1) jobs must run immediately after the current task.
   */
  public s(newJob: Job) {
    if (this.i && newJob.T === 0) return newJob.j()

    this.j[newJob.T === 1 ? 'push' : 'unshift'](newJob)

    runJobs(this)
  }
}

let schedulerInstance: Scheduler

export const getScheduler = () => (schedulerInstance ??= new Scheduler())

export const setScheduler = (scheduler: Scheduler) =>
  (schedulerInstance = scheduler)
