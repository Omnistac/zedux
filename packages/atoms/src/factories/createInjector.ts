import { readInstance } from '../classes/EvaluationStack'
import { PartialAtomInstance } from '../types/index'
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
    const { _injectors, _nextInjectors, status, template } = instance

    if (status === 'Initializing') {
      const descriptor = first(instance, ...args)
      type = descriptor.type
      _nextInjectors?.push(descriptor)

      return descriptor.result
    }

    const prevDescriptor = _injectors?.[_nextInjectors?.length as number] as T

    if (DEV && (!prevDescriptor || prevDescriptor.type !== type)) {
      throw new Error(
        `Zedux: ${operation} in atom "${template.key}" - injectors cannot be added, removed, or reordered`
      )
    }

    const descriptor = next
      ? next(prevDescriptor, instance, ...args)
      : prevDescriptor

    _nextInjectors?.push(descriptor)

    return descriptor.result
  }

  return injector
}
