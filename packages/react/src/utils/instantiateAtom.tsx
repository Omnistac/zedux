import { createStore, effectTypes, isZeduxStore, Store } from '@zedux/core'
import React, { FC } from 'react'
import {
  ActiveState,
  AppAtomInstance,
  AtomBaseProperties,
  AtomInstance,
  AtomInstanceBase,
  AtomValue,
  GlobalAtomInstance,
  LocalAtomInstance,
  ReadonlyAppAtomInstance,
  ReadonlyGlobalAtomInstance,
  ReadonlyLocalAtomInstance,
  Scope,
  StateType,
} from '../types'
import { generateInstanceId } from '../utils'
import { addAtomInstance, globalStore, removeAtomInstance } from '../store'
import { diContext } from './csContexts'
import { EvaluationReason, InjectorDescriptor } from './types'
import { scheduleJob } from './scheduler'
import { getInstanceMethods } from './general'

const createAppAtomInstance = <
  State extends any = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
>(
  atom: AtomBaseProperties<State, Params, Methods>,
  newAtomInstance: AppAtomInstance<State, Params>,
  factoryResult: AtomValue<State>
) => {}

const createReadonlyAppAtomInstance = <
  State extends any = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
>(
  atom: AtomBaseProperties<State, Params, Methods>,
  newAtomInstance: ReadonlyAppAtomInstance<State, Params>,
  factoryResult: AtomValue<State>
) => {}

const createGlobalAtomInstance = <
  State extends any = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
>(
  atom: AtomBaseProperties<State, Params, Methods>,
  newAtomInstance: GlobalAtomInstance<State, Params>,
  factoryResult: AtomValue<State>
) => {}

const createReadonlyGlobalAtomInstance = <
  State extends any = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
>(
  atom: AtomBaseProperties<State, Params, Methods>,
  newAtomInstance: ReadonlyGlobalAtomInstance<State, Params>,
  factoryResult: AtomValue<State>
) => {}

const createLocalAtomInstance = <
  State extends any = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
>(
  atom: AtomBaseProperties<State, Params, Methods>,
  newAtomInstance: LocalAtomInstance<State, Params>,
  factoryResult: AtomValue<State>
) => {}

const createReadonlyLocalAtomInstance = <
  State extends any = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
>(
  atom: AtomBaseProperties<State, Params, Methods>,
  newAtomInstance: ReadonlyLocalAtomInstance<State, Params>,
  factoryResult: AtomValue<State>
) => {}

const createAtomInstance = <
  State,
  Params extends any[],
  Methods extends Record<string, () => any>
>(
  atom: AtomBaseProperties<State, Params, Methods>,
  newAtomInstance: AtomInstanceBase<State, Params, Methods>,
  factoryResult: AtomValue<State>
) => {
  switch (atom.scope) {
    case Scope.App:
      return atom.readonly
        ? createReadonlyAppAtomInstance(
            atom,
            newAtomInstance as ReadonlyAppAtomInstance<State, Params>,
            factoryResult
          )
        : createAppAtomInstance(atom, newAtomInstance, factoryResult)
    case Scope.Global:
      return atom.readonly
        ? createReadonlyGlobalAtomInstance(atom, newAtomInstance, factoryResult)
        : createGlobalAtomInstance(atom, newAtomInstance, factoryResult)
    case Scope.Local:
      return atom.readonly
        ? createReadonlyLocalAtomInstance(atom, newAtomInstance, factoryResult)
        : createLocalAtomInstance(atom, newAtomInstance, factoryResult)
  }
}

const getStateType = (val: any) => {
  if (isZeduxStore(val)) return StateType.Store

  return StateType.Value
}

const getStateStore = <State extends any = any>(
  factoryResult: AtomValue<State>
) => {
  const stateType = getStateType(factoryResult)

  const stateStore =
    stateType === StateType.Store
      ? (factoryResult as Store<State>)
      : createStore<State>()

  // define how we populate our store (doesn't apply to user-supplied stores)
  if (stateType === StateType.Value) {
    stateStore.setState(factoryResult as State)
  }

  return [stateType, stateStore] as const
}

export const instantiateAtom = <
  State,
  Params extends any[],
  Methods extends Record<string, () => any>
>(
  appId: string,
  atom: AtomBaseProperties<State, Params, Methods>,
  keyHash: string,
  params: Params = ([] as unknown) as Params
): AtomInstanceBase<State, Params, Methods> => {
  const destroy = () => {
    // TODO: dispatch an action over stateStore for this mutation
    newAtomInstance.activeState = ActiveState.Destroyed

    globalStore.dispatch(
      removeAtomInstance({
        appId,
        keyHash,
        internalId: atom.internalId,
        key: atom.key,
      })
    )

    newAtomInstance.injectors.forEach(injector => {
      injector.cleanup?.()
    })

    // TODO: any other cleanup items? (subscriptions to remove, timeouts to cancel, etc)
  }

  const scheduleDestruction = () => {
    // local atoms always die when refCount hits 0
    if (atom.scope === Scope.Local) return destroy()

    const { ttl } = atom

    // By default, atoms live forever.
    if (ttl == null) return

    if (ttl === 0) {
      return destroy()
    }

    // schedule destruction (if ttl is > 0)
    if (typeof ttl === 'number') {
      const timeoutId = setTimeout(destroy, ttl)
      // TODO: dispatch an action over stateStore for these mutations
      newAtomInstance.destructionTimeout = timeoutId
      newAtomInstance.activeState = ActiveState.Destroying
    }
  }

  let hasScheduledEvaluation = false
  const scheduleEvaluation = (reason: EvaluationReason) => {
    if (hasScheduledEvaluation) return
    hasScheduledEvaluation = true // TODO: there may be a race condition here - with the evaluationTask not running before new scheduleEvaluations come in

    const evaluationTask = () => {
      // can't schedule job if value isn't a function, but whatever
      if (typeof atom.value !== 'function') return

      const newInjectors: InjectorDescriptor[] = []
      const newFactoryResult: AtomValue<State> = diContext.provide(
        {
          appId,
          atom,
          dependencies,
          injectors: newInjectors,
          isInitializing: false,
          prevInjectors: newAtomInstance.injectors,
          scheduleEvaluation,
        },
        () => (atom as any).value(...params)
      )

      newAtomInstance.injectors = newInjectors // TODO: dispatch an action over stateStore for this mutation
      const newStateType = getStateType(newFactoryResult)

      if (newStateType !== newAtomInstance.stateType) {
        throw new Error(
          `Zedux Error - atom factory for atom "${atom.key}" returned a different type than the previous evaluation. This can happen if the atom returned a store initially but then returned a non-store value on a later evaluation or vice versa`
        )
      }

      if (newStateType === StateType.Store && newFactoryResult !== stateStore) {
        throw new Error(
          `Zedux Error - atom factory for atom "${atom.key}" returned a different store. Did you mean to use \`injectStore()\` or \`injectMemo(() => theStore, [])\`?`
        )
      }

      if (newStateType === StateType.Value) {
        stateStore.setState(newFactoryResult as State)
      }

      hasScheduledEvaluation = false
    }

    scheduleJob('evaluate atom', evaluationTask)
  }

  // Boot up the atom!
  let factoryResult: AtomValue<State>
  const dependencies: Record<string, string> = {}
  const injectors: InjectorDescriptor[] = []

  if (typeof atom.value !== 'function') {
    factoryResult = atom.value
  } else {
    // TODO: error handling
    factoryResult = diContext.provide(
      {
        appId,
        atom,
        dependencies,
        injectors,
        isInitializing: true,
        scheduleEvaluation,
      },
      () => (atom as any).value(...params)
    )
  }

  const [stateType, stateStore] = getStateStore(factoryResult)

  const injectMethods = () => getInstanceMethods(newAtomInstance)
  const injectValue = () => newAtomInstance.stateStore.getState()

  const Provider: FC = ({ children }) => {
    const atomContext = atom.getReactContext()
    console.log('got atom context!', atomContext)

    return (
      <atomContext.Provider value={newAtomInstance}>
        {children}
      </atomContext.Provider>
    )
  }

  const useMethods = injectMethods
  const useValue = injectValue

  const newAtomInstance: AtomInstanceBase<State, Params, Methods> = {
    activeState: ActiveState.Active,
    dependencies,
    keyHash,
    implementationId: atom.internalId,
    injectMethods,
    injectValue,
    injectors,
    internalId: generateInstanceId(),
    invalidate: scheduleEvaluation,
    key: atom.key,
    Provider,
    params,
    stateStore,
    stateType,
    useMethods,
    useValue,
  }
  createAtomInstance(atom, newAtomInstance, factoryResult)

  // handle detaching this atom instance from the global store and all destruction stuff
  let zeroRefCount: number
  const subscription = stateStore.subscribe({
    effects: ({ effect, store }) => {
      // only interested in non-inherited effects
      if (!effect || !('effectType' in effect)) return

      if (effect.effectType === effectTypes.SUBSCRIBER_ADDED) {
        // Subscribers can be added to the store before this runs - if so, ignore those subscribers
        if (typeof zeroRefCount === 'undefined') {
          zeroRefCount = store.getRefCount()
        }

        // unschedule destruction of this atom
        clearTimeout(newAtomInstance.destructionTimeout)
      }

      if (
        effect.effectType === effectTypes.SUBSCRIBER_REMOVED &&
        store.getRefCount() === zeroRefCount
      ) {
        subscription.unsubscribe()
        scheduleDestruction()
      }
    },
  })

  // handle attaching this atom instance to the global store
  globalStore.dispatch(
    addAtomInstance({ appId, atomInstance: newAtomInstance })
  )

  // const map = new WeakMap();
  // map.set(newAtomInstance, true);
  // map.set({ control: true }, true);
  // console.log({ key: atom.key, map });

  return newAtomInstance as AtomInstance<State, Params, Methods>
}
