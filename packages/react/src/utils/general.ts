import { isPlainObject } from '@zedux/core/utils/general'
import { AtomBaseProperties, AtomInstanceInternals, AtomType } from '../types'
import {
  DiContext,
  ExportsInjectorDescriptor,
  InjectorDescriptor,
  InjectorType,
} from './types'
import { diContext } from './csContexts'

let idCounter = 0

const generateId = () => {
  idCounter += 1
  return idCounter
}

const hashParams = (params: any): string =>
  JSON.stringify(params, (_, param) => {
    if (!isPlainObject(param)) return param

    return Object.keys(param)
      .sort()
      .reduce((result, key) => {
        result[key] = param[key]
        return result
      }, {} as Record<string, any>)
  })

export const EMPTY_CONTEXT = {}

export const generateAppId = () => `ecosystem-${generateId()}`
export const generateImplementationId = () => `im-${generateId()}`
export const generateLocalId = () => `lo-${generateId()}`
export const generateNodeId = () => `no-${generateId()}`

export const getKeyHash = (
  atom: AtomBaseProperties<any, any[]>,
  params?: any[]
) => {
  // every time a local atom is got, a new instance is created
  if (atom.type === AtomType.Local) return generateLocalId()

  const base = `${atom.key}`

  if (!params?.length) return base

  return `${base}-${hashParams(params)}`
}

export const getInstanceExports = <
  State,
  Params extends any[],
  Exports extends Record<string, any>
>(
  internals: AtomInstanceInternals<State, Params>
) => {
  const methodsInjector = internals.injectors.find(
    injector => injector.type === InjectorType.Exports
  )

  if (!methodsInjector) return {} as Exports

  return (methodsInjector as ExportsInjectorDescriptor<Exports>).exports
}

export const haveDepsChanged = (prevDeps?: any[], nextDeps?: any[]) => {
  if (!prevDeps || !nextDeps) {
    return true
  }

  return (
    prevDeps.length !== nextDeps.length ||
    prevDeps.some((dep, i) => nextDeps[i] !== dep)
  )
}

export const split = <T extends InjectorDescriptor>(
  name: string,
  type: InjectorType,
  first: (context: DiContext) => T,
  next?: (prevDescriptor: T) => T
) => {
  const context = diContext.consume()

  if (context.isInitializing) {
    const descriptor = first(context)
    context.injectors.push(descriptor)

    return descriptor
  }

  const prevDescriptor = context.prevInjectors?.[context.injectors.length] as T

  if (!prevDescriptor || prevDescriptor.type !== type) {
    throw new Error(
      `Zedux Error - ${name} in atom "${context.atom.key}" - injectors cannot be added, removed, or reordered`
    )
  }

  const descriptor = next ? next(prevDescriptor) : prevDescriptor
  context.injectors.push(descriptor)

  return descriptor
}

export const validateInjector = <T extends InjectorDescriptor>(
  name: string,
  type: InjectorType,
  context: DiContext
): T | undefined => {
  if (context.isInitializing) {
    return
  }

  const prevDescriptor = context.prevInjectors?.[context.injectors.length] as T

  if (!prevDescriptor || prevDescriptor.type !== type) {
    throw new Error(
      `Zedux Error - ${name} in atom "${context.atom.key}" - injectors cannot be added, removed, or reordered`
    )
  }

  return prevDescriptor
}
