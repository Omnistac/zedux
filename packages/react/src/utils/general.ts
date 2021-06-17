import { isPlainObject } from '@zedux/core/utils/general'
import { DiContext, InjectorDescriptor, InjectorType } from './types'
import { diContext } from './csContexts'
import { ActiveState } from '../types'
import { AtomInstance } from '../classes'

let idCounter = 0

const generateId = () => {
  idCounter += 1
  return idCounter
}

export const EMPTY_CONTEXT = {}

export const generateAppId = () => `ecosystem-${generateId()}`
export const generateImplementationId = () => `im-${generateId()}`
export const generateLocalId = () => `lo-${generateId()}`
export const generateNodeId = () => `no-${generateId()}`

export const hashParams = (params: any): string =>
  JSON.stringify(params, (_, param) => {
    if (param instanceof AtomInstance) return param.keyHash
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
