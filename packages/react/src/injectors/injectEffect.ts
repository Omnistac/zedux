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
    // (if any). If a promise was returned, ignore it.
    descriptor.cleanup = typeof cleanup === 'function' ? cleanup : undefined
  }

  return task
}

/**
 * Runs a deferred side effect. This is just like React's `useEffect`. When
 * `deps` change on a subsequent reevaluation, the previous effect will be
 * cleaned up and the effect will rerun.
 *
 * Return a cleanup function to clean up resources when the effect reruns or the
 * current atom instance is destroyed.
 *
 * Unlike `useEffect`, you can return a promise from `injectEffect` (e.g. by
 * passing an async function). This is only for convenience in cases where you
 * don't have anything to cleanup, as you'll be unable to clean up resources if
 * you return a promise.
 */
export const injectEffect = (effect: EffectCallback, deps?: InjectorDeps) => {
  split<EffectInjectorDescriptor>(
    'injectEffect',
    InjectorType.Effect,
    ({ instance }) => {
      const descriptor: EffectInjectorDescriptor = {
        deps,
        type: InjectorType.Effect,
      }

      if (!instance.ecosystem.ssr) {
        const task = getTask(effect, descriptor)
        descriptor.cleanup = () => {
          instance.ecosystem._scheduler.unscheduleJob(task)
          descriptor.cleanup = undefined
        }

        instance.ecosystem._scheduler.scheduleJob({
          task,
          type: JobType.RunEffect,
        })
      }

      return descriptor
    },
    (prevDescriptor, { instance }) => {
      if (instance.ecosystem.ssr) return prevDescriptor

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
