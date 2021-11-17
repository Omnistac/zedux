import {
  EffectData,
  EffectsSubscriber,
  MachineStateRepresentation,
  Reactable,
  SideEffectHandler,
  WhenBuilder,
} from '../types'
import { extractActionType, extractStateType } from '../utils/actor'
import { assertAreFunctions } from '../utils/errors'
import { DEV } from '../utils/general'
import { Store } from './createStore'
import { removeAllMeta } from './meta'

interface MachineHandler<State = any> {
  enterHooks: Record<string, SideEffectHandler[]>
  getMachine: (state: State) => string
  leaveHooks: Record<string, SideEffectHandler[]>
}

interface StateMatchHandler<State = any> {
  predicate: (state?: State) => boolean
  sideEffect: SideEffectHandler<State>
}

export const when = <State = any>(store: Store<State>) => {
  const actionHandlers: Record<string, SideEffectHandler<State>[]> = {}
  const anyActionHandlers: SideEffectHandler<State>[] = []
  const machineHandlers: MachineHandler[] = []
  const stateChangeHandlers: SideEffectHandler<State>[] = []
  const stateMatchHandlers: StateMatchHandler<State>[] = []

  const effectsSubscriber: EffectsSubscriber<State> = effectData => {
    if (effectData.action) {
      runActionHandlers(effectData)
    }

    if (effectData.newState === effectData.oldState) return

    runMachineHandlers(effectData)
    runStateChangeHandlers(effectData)
  }

  const runActionHandlers = (effectData: EffectData<State>) => {
    if (!effectData.action) return

    anyActionHandlers.forEach(handler => handler(effectData))

    const unwrappedAction = removeAllMeta(effectData.action)
    const handlers = actionHandlers[unwrappedAction.type]

    handlers?.forEach(handler => handler(effectData))
  }

  const runMachineHandlers = (effectData: EffectData<State>) => {
    machineHandlers.forEach(({ enterHooks, getMachine, leaveHooks }) => {
      const oldState =
        typeof effectData.oldState !== 'undefined' &&
        getMachine(effectData.oldState)
      const newState = getMachine(effectData.newState)

      if (newState === oldState) return

      const currentLeaveHooks =
        typeof oldState === 'string' ? leaveHooks[oldState] : null
      const currentEnterHooks = enterHooks[newState]

      currentLeaveHooks?.forEach(hook => hook(effectData))
      currentEnterHooks?.forEach(hook => hook(effectData))
    })
  }

  const runStateChangeHandlers = (effectData: EffectData<State>) => {
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
  const machine = (
    getMachine: (state: State) => string = state => (state as unknown) as string
  ) => {
    const machineHandler: MachineHandler<State> = {
      enterHooks: {},
      getMachine,
      leaveHooks: {},
    }

    machineHandlers.push(machineHandler)

    const enters = (
      stateIn: MachineStateRepresentation | MachineStateRepresentation[],
      sideEffect: SideEffectHandler<State>
    ) => {
      const states = Array.isArray(stateIn) ? stateIn : [stateIn]

      states.forEach(state => {
        const stateName = extractStateType(state)

        if (!machineHandler.enterHooks[stateName]) {
          machineHandler.enterHooks[stateName] = []
        }

        machineHandler.enterHooks[stateName].push(sideEffect)
      })

      return whenMachineBuilder
    }

    const leaves = (
      stateIn: MachineStateRepresentation | MachineStateRepresentation[],
      sideEffect: SideEffectHandler<State>
    ) => {
      const states = Array.isArray(stateIn) ? stateIn : [stateIn]

      states.forEach(state => {
        const stateName = extractStateType(state)

        if (!machineHandler.leaveHooks[stateName]) {
          machineHandler.leaveHooks[stateName] = []
        }

        machineHandler.leaveHooks[stateName].push(sideEffect)
      })

      return whenMachineBuilder
    }

    const whenMachineBuilder = {
      ...whenBuilder,
      enters,
      leaves,
    }

    return whenMachineBuilder
  }

  const receivesAction = (
    reactableOrEffectHandler: Reactable | SideEffectHandler<State>,
    sideEffect?: SideEffectHandler<State>
  ) => {
    if (typeof sideEffect === 'undefined') {
      assertAreFunctions(
        [reactableOrEffectHandler],
        'whenBuilder.receivesAction()'
      )

      anyActionHandlers.push(
        reactableOrEffectHandler as SideEffectHandler<State>
      )

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

  const stateChanges = (sideEffect: SideEffectHandler<State>) => {
    stateChangeHandlers.push(sideEffect)

    return whenBuilder
  }

  const stateMatches = (
    predicate: (state?: State) => boolean,
    sideEffect: SideEffectHandler<State>
  ) => {
    if (DEV) {
      assertAreFunctions([predicate, sideEffect], 'whenBuilder.stateMatches()')
    }

    stateMatchHandlers.push({ predicate, sideEffect })

    return whenBuilder
  }

  const subscription = store.subscribe({ effects: effectsSubscriber })

  const whenBuilder: WhenBuilder<State> = {
    machine,
    receivesAction,
    stateChanges,
    stateMatches,
    subscription,
  }

  return whenBuilder
}
