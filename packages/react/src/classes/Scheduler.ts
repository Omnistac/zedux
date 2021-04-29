import { Job } from '../utils'

export class Scheduler {
  private scheduledJobs: Job[] = []

  runJobs() {
    while (this.scheduledJobs.length) {
      const job = this.scheduledJobs.shift() as Job
      job.task()
    }
  }

  scheduleJob(newJob: Job) {
    const shouldSetTimeout = this.scheduledJobs.length === 0
    // insertJob(this.scheduledJobs, newJob)
    this.scheduledJobs.push(newJob)

    // we just pushed the first job onto the queue
    if (shouldSetTimeout) {
      setTimeout(() => this.runJobs())
    }

    return () => {
      this.scheduledJobs = this.scheduledJobs.filter(job => job !== newJob)
    }
  }
}
