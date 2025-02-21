import {
  injectEffect,
  injectMemo,
  injectRef,
  injectSelf,
  InjectStoreConfig,
} from '@zedux/atoms'
import { zeduxTypes } from '@zedux/core'
import { MachineStore } from './MachineStore'
import { MachineHook, MachineStateShape } from './types'

type ArrToUnion<S extends string[]> = S extends [infer K, ...infer Rest]
  ? Rest extends string[]
    ? K | ArrToUnion<Rest>
    : never
  : never

export type InjectMachineStoreParams<
  States extends MachineState[],
  Context extends Record<string, any> | undefined = undefined
> = [
  statesFactory: (
    state: <Name extends string>(stateName: Name) => MachineState<Context, Name>
  ) => [...States],
  initialContext?: Context,
  config?: {
    guard?: (
      currentState: MachineStateShape<MapStatesToStateNames<States>, Context>,
      nextValue: MapStatesToStateNames<States>
    ) => boolean
    onTransition?: MachineHook<
      MapStatesToStateNames<States>,
      MapStatesToEvents<States, Context>,
      Context
    >
  } & InjectStoreConfig
]

export interface MachineState<
  Context extends Record<string, any> | undefined = any,
  Name extends string = string,
  Events extends string[] = [],
  ChildStates extends string[] = [Name]
> {
  on: <E extends string, S extends string>(
    eventName: E,
    nextState: S,
    guard?: (context: Context) => boolean
  ) => MachineState<Context, Name, [...Events, E], [...ChildStates, S]>
  onEnter: (
    listener: MachineHook<ArrToUnion<ChildStates>, ArrToUnion<Events>, Context>
  ) => MachineState<Context, Name, Events, ChildStates>
  onLeave: (
    listener: MachineHook<ArrToUnion<ChildStates>, ArrToUnion<Events>, Context>
  ) => MachineState<Context, Name, Events, ChildStates>
  stateName: Name
}

type MapStatesToStateNames<
  States extends MachineState[],
  Context extends Record<string, any> | undefined = undefined
> = States extends [infer K, ...infer Rest]
  ? K extends MachineState
    ? Rest extends MachineState[]
      ?
          | StateNameType<K>
          | ArrToUnion<StateChildStatesType<K>>
          | MapStatesToStateNames<Rest, Context>
      : never
    : never
  : never

type MapStatesToEvents<
  States extends MachineState[],
  Context extends Record<string, any> | undefined = undefined
> = States extends [infer K, ...infer Rest]
  ? K extends MachineState
    ? Rest extends MachineState[]
      ? ArrToUnion<StateEventsType<K>> | MapStatesToEvents<Rest, Context>
      : ArrToUnion<StateEventsType<K>>
    : never
  : never

type StateChildStatesType<S extends MachineState> = S extends MachineState<
  any,
  string,
  string[],
  infer ChildStates
>
  ? ChildStates
  : never

type StateEventsType<S extends MachineState> = S extends MachineState<
  any,
  string,
  infer Events
>
  ? Events
  : never

type StateNameType<S extends MachineState> = S extends MachineState<
  any,
  infer Name
>
  ? Name
  : never

/**
 * Create a MachineStore. Pass a statesFactory
 *
 * The first state in the state list returned from your statesFactory will
 * become the initial state (`.value`) of the store.
 *
 * Registers an effect that listens to all store changes and calls the
 * configured listeners appropriately.
 *
 * ```ts
 * const store = injectMachineStore(state => [
 *   state('a')
 *     .on('next', 'b', localGuard)
 *     .onEnter(enterListener)
 *     .onLeave(leaveListener),
 *   state('b').on('next', 'a')
 * ], initialContext, { guard, onTransition })
 * ```
 *
 * Set a universal transition guard via the 3rd `config` object param. This
 * guard will be called every time a valid transition is about to occur. It will
 * be called with the current `.context` value and should return a boolean.
 * Return true to allow the transition, or any falsy value to deny it.
 *
 * Set a universal `onTransition` listener via the 3rd `config` object param.
 * This listener will be called every time the machine transitions to a new
 * state (after the state is updated). It will be called with 2 params: The
 * current MachineStore and the storeEffect of the action that transitioned the
 * store. For example, use `storeEffect.oldState.value` to see what state the
 * machine just transitioned from.
 *
 * @param statesFactory Required. A function. Use the received state factory to
 * create a list of states for the machine and specify their transitions,
 * guards, and listeners.
 * @param initialContext Optional. An object or undefined. Will be set as the
 * initial `.context` value of the machine store's state.
 * @param config Optional. An object with 2 additional properties: `guard` and
 * `onTransition`.
 */
export const injectMachineStore: <
  States extends MachineState[],
  Context extends Record<string, any> | undefined = undefined
>(
  ...[statesFactory, initialContext, config]: InjectMachineStoreParams<
    States,
    Context
  >
) => MachineStore<
  MapStatesToStateNames<States, Context>,
  MapStatesToEvents<States, Context>,
  Context
> = <
  States extends MachineState[],
  Context extends Record<string, any> | undefined = undefined
>(
  ...[statesFactory, initialContext, config]: InjectMachineStoreParams<
    States,
    Context
  >
) => {
  type EventNames = MapStatesToEvents<States, Context>
  type StateNames = MapStatesToStateNames<States, Context>

  const instance = injectSelf()

  const { enterHooks, leaveHooks, store } = injectMemo(() => {
    const enterHooks: Record<
      string,
      MachineHook<StateNames, EventNames, Context>[]
    > = {}

    const leaveHooks: Record<
      string,
      MachineHook<StateNames, EventNames, Context>[]
    > = {}

    const states = {} as Record<
      StateNames,
      Record<
        EventNames,
        { name: StateNames; guard?: (context: Context) => boolean }
      >
    >

    const createState = <Name extends string>(stateName: Name) => {
      const state = {
        on: (
          eventName: string,
          nextState: string,
          guard?: (context: Context) => boolean
        ) => {
          if (!states[stateName as StateNames]) {
            states[stateName as StateNames] = {}
          }

          if (!states[nextState as StateNames]) {
            states[nextState as StateNames] = {}
          }

          states[stateName as StateNames][eventName as EventNames] = {
            name: nextState as StateNames,
            guard,
          }

          return state
        },
        onEnter: (callback: any) => {
          if (!enterHooks[stateName]) {
            enterHooks[stateName] = []
          }

          enterHooks[stateName].push(callback)

          return state
        },
        onLeave: (callback: any) => {
          if (!leaveHooks[stateName]) {
            leaveHooks[stateName] = []
          }

          leaveHooks[stateName].push(callback)

          return state
        },
        stateName,
      }

      return state
    }

    const [initialState] = statesFactory(createState)
    const hydration = config?.hydrate && instance.e.hydration?.[instance.id]

    const store = new MachineStore<StateNames, EventNames, Context>(
      hydration?.value ?? (initialState.stateName as StateNames),
      states,
      hydration?.context ?? initialContext,
      config?.guard
    )

    return { enterHooks, leaveHooks, store }
  }, [])

  const subscribeRef = injectRef<boolean | undefined>()
  subscribeRef.current = config?.subscribe

  injectEffect(
    () => {
      const subscription = store.subscribe({
        effects: storeEffect => {
          const { action, newState, oldState } = storeEffect

          if (newState.value === oldState?.value) return

          if (oldState && leaveHooks[oldState.value]) {
            leaveHooks[oldState.value].forEach(callback =>
              callback(store, storeEffect)
            )
          }
          if (enterHooks[newState.value]) {
            enterHooks[newState.value].forEach(callback =>
              callback(store, storeEffect)
            )
          }
          if (config?.onTransition) {
            config.onTransition(store, storeEffect)
          }

          // Nothing to do if the state hasn't changed. Also ignore state updates
          // during evaluation or that are caused by `zeduxTypes.ignore` actions
          if (
            !subscribeRef.current ||
            newState === oldState ||
            instance._isEvaluating ||
            action?.meta === zeduxTypes.ignore
          ) {
            return
          }

          instance.r({ o: oldState })

          // run the scheduler synchronously after any store update
          if (action?.meta !== zeduxTypes.batch) {
            instance.e._scheduler.flush()
          }
        },
      })

      return () => subscription.unsubscribe()
    },
    [],
    { synchronous: true }
  )

  const currentState = store.getState()

  if (enterHooks[currentState.value]) {
    enterHooks[currentState.value].forEach(callback =>
      callback(store, {
        action: { type: zeduxTypes.prime },
        newState: currentState,
        store,
      })
    )
  }

  return store
}
