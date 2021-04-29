import { createStore, effectTypes, isZeduxStore, Store } from '@zedux/core'
import { globalStore } from '../store'
import {
  ActiveState,
  AtomBaseProperties,
  AtomInstanceInternals,
  AtomValue,
  StateType,
} from '../types'
import { diContext } from '../utils/csContexts'
import { scheduleJob } from '../utils/scheduler'
import {
  AtomInjectorDescriptor,
  EvaluationReason,
  InjectorDescriptor,
  InjectorType,
  JobType,
  WhyInjectorDescriptor,
} from '../utils/types'

const getDependencies = (injectors: InjectorDescriptor[]) => {
  const depInjectors = injectors.filter(
    injector => injector.type === InjectorType.Atom
  ) as AtomInjectorDescriptor[]
  const { atoms, instances } = globalStore.getState()
  const hash: Record<string, true> = {}

  depInjectors.forEach(dep => {
    hash[atoms[instances[dep.instanceId].internals.atomInternalId].key] = true
  })

  return hash
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
    stateStore.hydrate(factoryResult as State)
  }

  return [stateType, stateStore] as const
}

const runWhyInjectors = (
  newInjectors: InjectorDescriptor[],
  evaluationReasons: EvaluationReason[]
) => {
  const whyInjectors = newInjectors.filter(
    injector => injector.type === InjectorType.Why
  ) as WhyInjectorDescriptor[]

  whyInjectors.forEach(({ callback }) => {
    callback(evaluationReasons)
  })
}

export const createAtomInstanceInternals = <State, Params extends any[]>(
  ecosystemId: string,
  atom: AtomBaseProperties<State, Params>,
  keyHash: string,
  params: Params = ([] as unknown) as Params,
  evaluate: () => AtomValue<State>,
  scheduleDestruction: () => void
) => {
  let evaluationReasons: EvaluationReason[] = []
  const scheduleEvaluation = (reason: EvaluationReason) => {
    if (evaluationReasons.length) {
      evaluationReasons.push(reason)
      return
    }

    evaluationReasons = [reason] // TODO: there may be a race condition here - with the evaluationTask not running before new scheduleEvaluations come in

    const evaluationTask = () => {
      const newInjectors: InjectorDescriptor[] = []
      let newFactoryResult: AtomValue<State>

      try {
        newFactoryResult = diContext.provide(
          {
            ecosystemId,
            atom,
            injectors: newInjectors,
            isInitializing: false,
            prevInjectors: newInternals.injectors,
            scheduleEvaluation,
          },
          evaluate
        )
      } catch (err) {
        newInjectors.forEach(injector => {
          injector.cleanup?.()
        })
        throw err
      }

      newInternals.injectors = newInjectors // TODO: dispatch an action over stateStore for this mutation
      const newStateType = getStateType(newFactoryResult)

      if (newStateType !== newInternals.stateType) {
        throw new Error(
          `Zedux Error - atom factory for atom "${atom.key}" returned a different type than the previous evaluation. This can happen if the atom returned a store initially but then returned a non-store value on a later evaluation or vice versa`
        )
      }

      if (newStateType === StateType.Store && newFactoryResult !== stateStore) {
        throw new Error(
          `Zedux Error - atom factory for atom "${atom.key}" returned a different store. Did you mean to use \`injectStore()\` or \`injectMemo(() => theStore, [])\`?`
        )
      }

      // I believe there is no way to cause a scheduleEvaluation loop when the StateType is Value
      if (newStateType === StateType.Value) {
        stateStore.setState(newFactoryResult as State)
      }

      runWhyInjectors(newInjectors, evaluationReasons)

      evaluationReasons = []
    }

    scheduleJob({
      dependencies: getDependencies(newInternals.injectors),
      key: atom.key,
      task: evaluationTask,
      type: JobType.EvaluateAtom,
    })
  }

  // Boot up the atom!
  let factoryResult: AtomValue<State>
  const injectors: InjectorDescriptor[] = []

  // TODO: error handling
  try {
    factoryResult = diContext.provide(
      {
        ecosystemId,
        atom,
        injectors,
        isInitializing: true,
        scheduleEvaluation,
      },
      evaluate
    )
  } catch (err) {
    injectors.forEach(injector => {
      injector.cleanup?.()
    })
    throw err
  }

  const [stateType, stateStore] = getStateStore(factoryResult)

  const newInternals: AtomInstanceInternals<State, Params> = {
    activeState: ActiveState.Active,
    atomInternalId: atom.internalId,
    keyHash,
    getEvaluationReasons: () => evaluationReasons,
    injectors,
    scheduleEvaluation,
    params,
    scheduleDestruction,
    stateStore,
    stateType,
  }

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
        if (newInternals.destructionTimeout) {
          clearTimeout(newInternals.destructionTimeout)
        }
      }

      if (
        effect.effectType === effectTypes.SUBSCRIBER_REMOVED &&
        store.getRefCount() === zeroRefCount
      ) {
        subscription.unsubscribe()
        newInternals.scheduleDestruction()
      }
    },
  })

  return newInternals
}
