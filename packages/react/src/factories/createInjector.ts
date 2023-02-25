import { readInstance } from '../classes/EvaluationStack'
import { PartialAtomInstance } from '../types'
import { InjectorDescriptor } from '../utils/types'

export const createInjector = <
  A extends [...any],
  T extends InjectorDescriptor
>(
  operation: string,
  first: (instance: PartialAtomInstance, ...args: A) => T,
  next?: (prevDescriptor: T, instance: PartialAtomInstance, ...args: A) => T
) => {
  let type: string

  const injector = (...args: A) => {
    const instance = readInstance()

    if (instance.activeState === 'Initializing') {
      const descriptor = first(instance, ...args)
      type = descriptor.type
      instance._nextInjectors?.push(descriptor)

      return descriptor.result
    }

    const prevDescriptor = instance._injectors?.[
      instance._nextInjectors?.length as number
    ] as T

    if (DEV && (!prevDescriptor || prevDescriptor.type !== type)) {
      throw new Error(
        `Zedux: ${operation} in atom "${instance.atom.key}" - injectors cannot be added, removed, or reordered`
      )
    }

    const descriptor = next
      ? next(prevDescriptor, instance, ...args)
      : prevDescriptor

    instance._nextInjectors?.push(descriptor)

    return descriptor.result
  }

  return injector
}
