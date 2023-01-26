import {
  StoreEffect,
  EffectsSubscriber,
  Reactable,
  SideEffectHandler,
  WhenBuilder,
  WhenMachineBuilder,
} from '../types'
import { extractActionType } from '../utils/actions'
import { assertAreFunctions } from '../utils/errors'
import { MachineEffectHandler, MachineStateType } from '../utils/types'
import { Store } from './createStore'
import { MachineStore } from './MachineStore'
import { removeAllMeta } from './meta'

interface StateMatchHandler<
  State = any,
  S extends Store<State> = Store<State>
> {
  predicate: (state?: State) => boolean
  sideEffect: SideEffectHandler<State, S>
}

export const when: {
  <
    StateNames extends string = string,
    EventNames extends string = string,
    Context extends Record<string, any> | undefined = undefined
  >(
    store: MachineStore<StateNames, EventNames, Context>
  ): WhenMachineBuilder<StateNames, EventNames, Context>
  <State = any, S extends Store<State> = Store<State>>(store: S): WhenBuilder<
    State,
    S
  >
} = (store: Store) => {
  const actionHandlers: Record<string, SideEffectHandler[]> = {}
  const anyActionHandlers: SideEffectHandler[] = []
  const enterHooks: Record<string, MachineEffectHandler[]> = {}
  const leaveHooks: Record<string, MachineEffectHandler[]> = {}
  const stateChangeHandlers: SideEffectHandler[] = []
  const stateMatchHandlers: StateMatchHandler[] = []

  const effectsSubscriber: EffectsSubscriber = storeEffect => {
    if (storeEffect.action) {
      runActionHandlers(storeEffect)
    }

    if (storeEffect.newState === storeEffect.oldState) return

    runMachineHandlers(
      (storeEffect as unknown) as StoreEffect<MachineStateType, MachineStore>
    )
    runStateChangeHandlers(storeEffect)
  }

  const runActionHandlers = (storeEffect: StoreEffect) => {
    if (!storeEffect.action) return

    anyActionHandlers.forEach(handler => handler(storeEffect))

    const unwrappedAction = removeAllMeta(storeEffect.action)
    const handlers = actionHandlers[unwrappedAction.type]

    handlers?.forEach(handler => handler(storeEffect))
  }

  const runMachineHandlers = (
    storeEffect: StoreEffect<MachineStateType, MachineStore>
  ) => {
    const oldState =
      storeEffect.oldState != null &&
      ((storeEffect.oldState as unknown) as MachineStateType).value
    const newState = ((storeEffect.newState as unknown) as MachineStateType)
      .value

    if (newState === oldState) return

    const currentLeaveHooks =
      typeof oldState === 'string' ? leaveHooks[oldState] : null
    const currentEnterHooks = enterHooks[newState]

    currentLeaveHooks?.forEach(hook => hook(storeEffect))
    currentEnterHooks?.forEach(hook => hook(storeEffect))
  }

  const runStateChangeHandlers = (storeEffect: StoreEffect) => {
    stateChangeHandlers.forEach(handler => handler(storeEffect))

    stateMatchHandlers.forEach(({ predicate, sideEffect }) => {
      const oldPredicate = predicate(storeEffect.oldState)
      const newPredicate = predicate(storeEffect.newState)

      // We only run stateMatch handlers when state changes and now matches but didn't before
      if (!newPredicate || oldPredicate === newPredicate) return

      sideEffect(storeEffect)
    })
  }

  // Exposed methods
  const enters = (
    state: string | string[],
    sideEffect: MachineEffectHandler
  ) => {
    const states = Array.isArray(state) ? state : [state]

    states.forEach(stateName => {
      if (!enterHooks[stateName]) {
        enterHooks[stateName] = []
      }

      enterHooks[stateName].push(sideEffect)
    })

    return whenBuilder
  }

  const leaves = (
    state: string | string[],
    sideEffect: MachineEffectHandler
  ) => {
    const states = Array.isArray(state) ? state : [state]

    states.forEach(stateName => {
      if (!leaveHooks[stateName]) {
        leaveHooks[stateName] = []
      }

      leaveHooks[stateName].push(sideEffect)
    })

    return whenBuilder
  }

  const receivesAction = (
    reactableOrEffectHandler: Reactable | any,
    sideEffect?: any
  ) => {
    if (typeof sideEffect === 'undefined') {
      assertAreFunctions(
        [reactableOrEffectHandler],
        'whenBuilder.receivesAction()'
      )

      anyActionHandlers.push(reactableOrEffectHandler as SideEffectHandler)

      return whenBuilder
    }

    if (DEV) {
      assertAreFunctions([sideEffect], 'whenBuilder.receivesEffect()')
    }

    const reactable = reactableOrEffectHandler as Reactable
    const actionType = extractActionType(
      reactable,
      'whenBuilder.receivesAction()'
    )

    if (!actionHandlers[actionType]) {
      actionHandlers[actionType] = []
    }

    actionHandlers[actionType].push(sideEffect)

    return whenBuilder
  }

  const stateChanges = (sideEffect: any) => {
    stateChangeHandlers.push(sideEffect)

    return whenBuilder
  }

  const stateMatches = (
    predicate: (state?: any) => boolean,
    sideEffect: any
  ) => {
    if (DEV) {
      assertAreFunctions([predicate, sideEffect], 'whenBuilder.stateMatches()')
    }

    stateMatchHandlers.push({ predicate, sideEffect })

    return whenBuilder
  }

  const subscription = store.subscribe({ effects: effectsSubscriber })

  const whenBuilder: WhenMachineBuilder = {
    enters,
    leaves,
    receivesAction,
    stateChanges,
    stateMatches,
    subscription,
  }

  return whenBuilder
}
