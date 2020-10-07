import {
  EffectsSubscriber,
  MachineHooksBuilder,
  Reactable,
  Store,
} from '../types'
import { extractActionType } from '../utils/actor'

type SubscribersHash = Record<string, Map<EffectsSubscriber, true>>

export const applyMachineHooks = <T = any>(
  store: Store<T>,
  getMachineState: (state: T) => string
) => {
  const enterSubscribers: SubscribersHash = {}
  const leaveSubscribers: SubscribersHash = {}

  const subscription = store.subscribe({
    effects: meta => {
      const { newState, oldState } = meta
      const newMachineState = getMachineState(newState)
      const oldMachineState = getMachineState(oldState)

      if (newMachineState === oldMachineState) return

      const leaveSubs = leaveSubscribers[oldMachineState]
      const enterSubs = enterSubscribers[newMachineState]

      if (leaveSubs) {
        ;[...leaveSubs.keys()].forEach(subscriber => subscriber(meta))
      }
      if (enterSubs) {
        ;[...enterSubs.keys()].forEach(subscriber => subscriber(meta))
      }
    },
  })

  const getSubscription = () => subscription

  const onEnter = (action: Reactable, subscriber: EffectsSubscriber) => {
    const actionType = extractActionType('withMachineHooks.onEnter')(action)

    if (!enterSubscribers[actionType]) {
      enterSubscribers[actionType] = new Map<EffectsSubscriber, true>()
    }

    enterSubscribers[actionType].set(subscriber, true)

    return builder // for chaining
  }

  const onLeave = (action: Reactable, subscriber: EffectsSubscriber) => {
    const actionType = extractActionType('withMachineHooks.onLeave')(action)

    if (!leaveSubscribers[actionType]) {
      leaveSubscribers[actionType] = new Map<EffectsSubscriber, true>()
    }

    leaveSubscribers[actionType].set(subscriber, true)

    return builder // for chaining
  }

  const builder: MachineHooksBuilder<T> = { getSubscription, onEnter, onLeave }

  return builder
}
