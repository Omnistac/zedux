import { Job, JobType } from './types'

let scheduledJobs: Job[] = []
let intermediaryJobs: Job[] = []
let isIterating = false

const runJobs = (jobs: Job[]) => {
  for (const job of jobs) {
    job.task()
  }
}

export const scheduleJob = (type: JobType, task: Job['task']) => {
  const newJob = { type, task }
  const isIntermediaryJob = type === JobType.EvaluateAtom && isIterating

  if (isIntermediaryJob) {
    // with the intermediary jobs, we want mutation mid-iteration
    intermediaryJobs.push(newJob)
  } else {
    scheduledJobs.push(newJob)
  }

  // we just pushed the first job onto the queue
  if (scheduledJobs.length === 1) {
    setTimeout(() => {
      isIterating = true
      console.log('running..', scheduledJobs)

      const clonedJobs = [...scheduledJobs]
      scheduledJobs = []
      runJobs(clonedJobs)

      runJobs(intermediaryJobs)
      intermediaryJobs = []

      isIterating = false
    })
  }

  return () => {
    if (isIntermediaryJob) {
      intermediaryJobs = intermediaryJobs.filter(job => job !== newJob)
    } else {
      scheduledJobs = scheduledJobs.filter(job => job !== newJob)
    }
  }
}
