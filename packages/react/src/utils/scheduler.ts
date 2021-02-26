import { Job } from './types'

let scheduledJobs: Job[] = []

export const scheduleJob = (type: string, task: Job['task']) => {
  const newJob = { type, task }
  scheduledJobs.push(newJob)

  // we just pushed the first job onto the queue
  if (scheduledJobs.length === 1) {
    setTimeout(() => {
      // clone the array in case of mutation mid-iteration
      const clonedJobs = [...scheduledJobs]
      scheduledJobs = []

      clonedJobs.forEach(job => job.task())
    })
  }

  return () => {
    scheduledJobs = scheduledJobs.filter(job => job !== newJob)
  }
}
