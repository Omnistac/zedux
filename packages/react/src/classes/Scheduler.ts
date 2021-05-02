import {
  EvaluateAtomJob,
  Job,
  JobType,
  UpdateExternalDependentJob,
} from '../utils'
import { Ecosystem } from './Ecosystem'

export class Scheduler {
  private scheduledJobs: Job[] = []

  constructor(private readonly ecosystem: Ecosystem) {}

  public scheduleJob(newJob: Job) {
    const shouldSetTimeout = this.scheduledJobs.length === 0

    // insertJob(this.scheduledJobs, newJob)
    if (newJob.type === JobType.RunEffect) {
      this.scheduledJobs.push(newJob)
    } else if (newJob.type === JobType.EvaluateAtom) {
      this.insertEvaluateAtomJob(newJob)
    } else {
      this.insertUpdateExternalDependentJob(newJob)
    }

    // we just pushed the first job onto the queue
    if (shouldSetTimeout) {
      setTimeout(() => this.runJobs())
    }

    return () => {
      this.scheduledJobs = this.scheduledJobs.filter(job => job !== newJob)
    }
  }

  private insertEvaluateAtomJob(newJob: EvaluateAtomJob) {
    const { nodes } = this.ecosystem.graph
    const newJobGraphNode = nodes[newJob.keyHash]

    const index = this.scheduledJobs.findIndex(job => {
      if (job.type !== JobType.EvaluateAtom) return true

      const thatJobGraphNode = nodes[job.keyHash]
      return newJobGraphNode.weight <= thatJobGraphNode.weight
    })

    if (index === -1) {
      this.scheduledJobs.push(newJob)
      return
    }

    this.scheduledJobs.splice(index, 0, newJob)
  }

  private insertUpdateExternalDependentJob(newJob: UpdateExternalDependentJob) {
    const index = this.scheduledJobs.findIndex(job => {
      if (job.type === JobType.EvaluateAtom) return false
      if (job.type !== JobType.UpdateExternalDependent) return true

      return newJob.flagScore <= job.flagScore
    })

    if (index === -1) {
      this.scheduledJobs.push(newJob)
      return
    }

    this.scheduledJobs.splice(index, 0, newJob)
  }

  private runJobs() {
    while (this.scheduledJobs.length) {
      const job = this.scheduledJobs.shift() as Job
      job.task()
    }
  }
}
