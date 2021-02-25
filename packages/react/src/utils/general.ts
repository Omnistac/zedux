import { isPlainObject } from '@zedux/core/utils/general'
import { AtomBaseProperties, AtomInstance, Scope } from '../types'
import {
  DepsInjectorDescriptor,
  DiContext,
  InjectorType,
  MethodsInjectorDescriptor,
} from './types'

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

export const generateAppId = () => `app-${generateId()}`
export const generateImplementationId = () => `im-${generateId()}`
export const generateInstanceId = () => `in-${generateId()}`
export const generateLocalId = () => `lo-${generateId()}`

export const getKeyHash = (
  atom: AtomBaseProperties<any, any, any>,
  params?: any[]
) => {
  // every time a local atom is got, a new instance is created
  if (atom.scope === Scope.Local) return generateLocalId()

  if (!params?.length) return atom.key

  return `${atom.key}---${hashParams(params)}`
}

export const getInstanceMethods = <
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
>(
  atomInstance: AtomInstance<State, Params, Methods>
) => {
  const methodsInjector = atomInstance.injectors.find(
    injector => injector.type === InjectorType.Methods
  )

  if (!methodsInjector) return {} as Methods

  return (methodsInjector as MethodsInjectorDescriptor<Methods>).methods
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

export const validateInjector = <T extends DepsInjectorDescriptor>(
  name: string,
  type: string,
  context: DiContext
): T | undefined => {
  if (context.isInitializing) {
    return
  }

  const prevDescriptor = context.prevInjectors[context.injectors.length] as T

  if (!prevDescriptor || prevDescriptor.type !== type) {
    throw new Error(
      `Zedux Error - ${name} in atom "${context.atom.key}" - injectors cannot be added, removed, or reordered`
    )
  }

  return prevDescriptor
}
