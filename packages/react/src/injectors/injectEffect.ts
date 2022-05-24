import { EffectCallback, InjectorDeps } from '../types'
import { haveDepsChanged, split } from '../utils'
import { EffectInjectorDescriptor, InjectorType, JobType } from '../utils/types'

const getTask = (
  effect: EffectCallback,
  descriptor: EffectInjectorDescriptor
) => {
  const task = () => {
    const cleanup = effect()

    // now that the task has run, there's no need for the scheduler cleanup
    // function; replace it with the cleanup logic returned from the effect
    // (if any)
    descriptor.cleanup = cleanup || undefined
  }

  return task
}

export const injectEffect = (effect: EffectCallback, deps?: InjectorDeps) => {
  split<EffectInjectorDescriptor>(
    'injectEffect',
    InjectorType.Effect,
    ({ instance }) => {
      const descriptor: EffectInjectorDescriptor = {
        deps,
        type: InjectorType.Effect,
      }

      const task = getTask(effect, descriptor)
      descriptor.cleanup = () => {
        instance.ecosystem._scheduler.unscheduleJob(task)
        descriptor.cleanup = undefined
      }

      instance.ecosystem._scheduler.scheduleJob({
        task,
        type: JobType.RunEffect,
      })

      return descriptor
    },
    (prevDescriptor, { instance }) => {
      const depsHaveChanged = haveDepsChanged(prevDescriptor?.deps, deps)

      if (!depsHaveChanged) return prevDescriptor

      prevDescriptor.cleanup?.()

      const task = getTask(effect, prevDescriptor)
      prevDescriptor.cleanup = () => {
        instance.ecosystem._scheduler.unscheduleJob(task)
        prevDescriptor.cleanup = undefined
      }
      prevDescriptor.deps = deps

      instance.ecosystem._scheduler.scheduleJob({
        task,
        type: JobType.RunEffect,
      })

      return prevDescriptor
    }
  )
}
