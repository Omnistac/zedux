import {
  EffectData,
  EffectsSubscriber,
  Reactable,
  SideEffectHandler,
  WhenBuilder,
  WhenMachineBuilder,
} from '../types'
import { extractActionType } from '../utils/actor'
import { assertAreFunctions } from '../utils/errors'
import { DEV } from '../utils/general'
import { MachineEffectHandler, MachineStateType } from '../utils/types'
import { Store } from './createStore'
import { MachineStore } from './MachineStore'
import { removeAllMeta } from './meta'

interface MachineEffectHandlers {
  enterHooks: Record<string, MachineEffectHandler[]>
  leaveHooks: Record<string, MachineEffectHandler[]>
}

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
  const machineHandlers: MachineEffectHandlers = {
    enterHooks: {},
    leaveHooks: {},
  }
  const stateChangeHandlers: SideEffectHandler[] = []
  const stateMatchHandlers: StateMatchHandler[] = []

  const effectsSubscriber: EffectsSubscriber = effectData => {
    if (effectData.action) {
      runActionHandlers(effectData)
    }

    if (effectData.newState === effectData.oldState) return

    runMachineHandlers(
      (effectData as unknown) as EffectData<MachineStateType, MachineStore>
    )
    runStateChangeHandlers(effectData)
  }

  const runActionHandlers = (effectData: EffectData) => {
    if (!effectData.action) return

    anyActionHandlers.forEach(handler => handler(effectData))

    const unwrappedAction = removeAllMeta(effectData.action)
    const handlers = actionHandlers[unwrappedAction.type]

    handlers?.forEach(handler => handler(effectData))
  }

  const runMachineHandlers = (
    effectData: EffectData<MachineStateType, MachineStore>
  ) => {
    const oldState =
      effectData.oldState != null &&
      ((effectData.oldState as unknown) as MachineStateType).value
    const newState = ((effectData.newState as unknown) as MachineStateType)
      .value

    if (newState === oldState) return

    const currentLeaveHooks =
      typeof oldState === 'string' ? machineHandlers.leaveHooks[oldState] : null
    const currentEnterHooks = machineHandlers.enterHooks[newState]

    currentLeaveHooks?.forEach(hook => hook(effectData))
    currentEnterHooks?.forEach(hook => hook(effectData))
  }

  const runStateChangeHandlers = (effectData: EffectData) => {
    stateChangeHandlers.forEach(handler => handler(effectData))

    stateMatchHandlers.forEach(({ predicate, sideEffect }) => {
      const oldPredicate = predicate(effectData.oldState)
      const newPredicate = predicate(effectData.newState)

      // We only run stateMatch handlers when state changes and now matches but didn't before
      if (!newPredicate || oldPredicate === newPredicate) return

      sideEffect(effectData)
    })
  }

  // Exposed methods
  const enters = (
    state: string | string[],
    sideEffect: MachineEffectHandler
  ) => {
    const states = Array.isArray(state) ? state : [state]

    states.forEach(stateName => {
      if (!machineHandlers.enterHooks[stateName]) {
        machineHandlers.enterHooks[stateName] = []
      }

      machineHandlers.enterHooks[stateName].push(sideEffect)
    })

    return whenBuilder
  }

  const leaves = (
    state: string | string[],
    sideEffect: MachineEffectHandler
  ) => {
    const states = Array.isArray(state) ? state : [state]

    states.forEach(stateName => {
      if (!machineHandlers.leaveHooks[stateName]) {
        machineHandlers.leaveHooks[stateName] = []
      }

      machineHandlers.leaveHooks[stateName].push(sideEffect)
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
