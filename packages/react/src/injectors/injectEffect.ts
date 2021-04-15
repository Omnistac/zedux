import { EffectCallback } from 'react'
import { haveDepsChanged, scheduleJob, validateInjector } from '../utils'
import { diContext } from '../utils/csContexts'
import { EffectInjectorDescriptor, InjectorType } from '../utils/types'

export const injectEffect = (effect: EffectCallback, deps?: any[]) => {
  const context = diContext.consume()
  const { injectors } = context

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
    descriptor.cleanup = scheduleJob('run effect', () => {
      if (prevDescriptor) {
        prevDescriptor.cleanup?.()
        prevDescriptor.isCleanedUp = true
      }

      // There is an edge case where an effect could be cleaned up before it
      // even runs. I _think_ it's fine to not even run the effect in this case.
      if (descriptor.isCleanedUp) return

      const cleanup = effect()

      if (typeof cleanup === 'function') {
        descriptor.cleanup = cleanup
      }
    })
  }

  injectors.push(descriptor)
}
