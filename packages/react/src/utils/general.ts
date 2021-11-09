import { isPlainObject } from '@zedux/core/utils/general'
import { DiContext, InjectorDescriptor, InjectorType } from './types'
import { diContext } from './csContexts'
import { ActiveState } from '../types'
import { AtomInstanceBase } from '../classes'

let idCounter = 0

const generateId = () => {
  idCounter += 1
  return idCounter
}

export const EMPTY_CONTEXT = {}

export const generateAtomSelectorId = () => `select-${generateId()}`
export const generateEcosystemId = () => `ecosystem-${generateId()}`
export const generateImplementationId = () => `im-${generateId()}`
export const generateLocalId = () => `lo-${generateId()}`
export const generateNodeId = () => `no-${generateId()}`

export const hashParams = (params: any[]): string =>
  JSON.stringify(params, (_, param) => {
    if (is(param, AtomInstanceBase)) return param.keyHash
    if (!isPlainObject(param)) return param

    return Object.keys(param)
      .sort()
      .reduce((result, key) => {
        result[key] = param[key]
        return result
      }, {} as Record<string, any>)
  })

export const haveDepsChanged = (
  prevDeps?: any[],
  nextDeps?: any[],
  trueIfNeither = true
) => {
  if (!prevDeps || !nextDeps) {
    if (trueIfNeither) return true

    return prevDeps && nextDeps
  }

  return (
    prevDeps.length !== nextDeps.length ||
    prevDeps.some((dep, i) => nextDeps[i] !== dep)
  )
}

/**
 * is() - Checks if a value is an instance of a class
 *
 * We can't use instanceof 'cause that breaks across realms - e.g. when an atom
 * instance is shared between a parent and child window, that instance's object
 * reference will be different in both windows (since each window creates its
 * own copy of Zedux).
 *
 * The classToCheck should have a static $$typeof property whose value is a
 * symbol created with Symbol.for() (sharing the symbol reference across realms)
 *
 * @param val anything - the thing we're checking
 * @param classToCheck a class with a static $$typeof property
 * @returns boolean - whether val is an instanceof classToCheck
 */
export const is = (val: any, classToCheck: { $$typeof: symbol }) =>
  val?.constructor?.$$typeof === classToCheck.$$typeof

export const split = <T extends InjectorDescriptor>(
  operation: string,
  type: InjectorType,
  first: (context: DiContext) => T,
  next?: (prevDescriptor: T, context: DiContext) => T
) => {
  const context = diContext.consume()

  if (context.instance._activeState === ActiveState.Initializing) {
    const descriptor = first(context)
    context.injectors.push(descriptor)

    return descriptor
  }

  const prevDescriptor = context.instance._injectors?.[
    context.injectors.length
  ] as T

  if (!prevDescriptor || prevDescriptor.type !== type) {
    throw new Error(
      `Zedux Error - ${operation} in atom "${context.instance.atom.key}" - injectors cannot be added, removed, or reordered`
    )
  }

  const descriptor = next ? next(prevDescriptor, context) : prevDescriptor
  context.injectors.push(descriptor)

  return descriptor
}

export const validateInjector = <T extends InjectorDescriptor>(
  name: string,
  type: InjectorType,
  context: DiContext
): T | undefined => {
  if (context.instance._activeState === ActiveState.Initializing) {
    return
  }

  const prevDescriptor = context.instance._injectors?.[
    context.injectors.length
  ] as T

  if (!prevDescriptor || prevDescriptor.type !== type) {
    throw new Error(
      `Zedux Error - ${name} in atom "${context.instance.atom.key}" - injectors cannot be added, removed, or reordered`
    )
  }

  return prevDescriptor
}
