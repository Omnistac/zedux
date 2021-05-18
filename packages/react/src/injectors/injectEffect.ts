import { EffectCallback } from '../types'
import { haveDepsChanged, validateInjector } from '../utils'
import { diContext } from '../utils/csContexts'
import { EffectInjectorDescriptor, InjectorType, JobType } from '../utils/types'

export const injectEffect = (effect: EffectCallback, deps?: any[]) => {
  const context = diContext.consume()
  const {
    injectors,
    instance: { ecosystem },
  } = context

  const prevDescriptor = validateInjector<EffectInjectorDescriptor>(
    'injectEffect',
    InjectorType.Effect,
    context
  )

  const depsHaveChanged = haveDepsChanged(prevDescriptor?.deps, deps)

  const descriptor: EffectInjectorDescriptor = {
    deps,
    type: InjectorType.Effect,
  }

  if (depsHaveChanged) {
    const task = () => {
      if (prevDescriptor) {
        prevDescriptor.cleanup?.()
        prevDescriptor.isCleanedUp = true
      }

      // There is an edge case where an effect could be cleaned up before it
      // even runs. I _think_ it's fine to not even run the effect in this case.
      if (descriptor.isCleanedUp) return

      const cleanup = effect()

      // now that the task has run, there's no need for the scheduler cleanup
      // function; replace it with the cleanup logic returned from the effect
      // (if any)
      descriptor.cleanup = cleanup || undefined
    }

    ecosystem._scheduler.scheduleJob({
      task,
      type: JobType.RunEffect,
    })

    descriptor.cleanup = () => ecosystem._scheduler.unscheduleJob(task)
  }

  injectors.push(descriptor)
}
