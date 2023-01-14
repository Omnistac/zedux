import { MachineHook, MachineStore, MachineStoreConfig } from '@zedux/core'
import { injectEffect } from './injectEffect'
import { injectMemo } from './injectMemo'

type ArrToUnion<S extends string[]> = S extends [infer K, ...infer Rest]
  ? Rest extends string[]
    ? K | ArrToUnion<Rest>
    : never
  : never

interface MachineState<
  Context extends Record<string, any> | undefined = any,
  Name extends string = string,
  Events extends string[] = [],
  ChildStates extends string[] = []
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

export const injectMachineStore = <
  States extends MachineState[],
  Context extends Record<string, any> | undefined = undefined
>(
  statesFactory: (
    state: <Name extends string>(stateName: Name) => MachineState<Context, Name>
  ) => [...States],
  initialContext?: Context,
  config?: MachineStoreConfig<
    MapStatesToStateNames<States, Context>,
    MapStatesToEvents<States, Context>,
    Context
  >
): MachineStore<
  MapStatesToStateNames<States, Context>,
  MapStatesToEvents<States, Context>,
  Context
> => {
  type EventNames = MapStatesToEvents<States, Context>
  type StateNames = MapStatesToStateNames<States, Context>

  const enterHooks: Record<
    string,
    MachineHook<StateNames, EventNames, Context>[]
  > = {}
  const leaveHooks: Record<
    string,
    MachineHook<StateNames, EventNames, Context>[]
  > = {}

  const store = injectMemo(() => {
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

          states[stateName as StateNames][eventName as EventNames] = {
            name: nextState as MapStatesToStateNames<States, Context>,
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

    return new MachineStore<StateNames, EventNames, Context>(
      initialState.stateName as StateNames,
      states,
      initialContext,
      config
    )
  }, [])

  injectEffect(() => {
    const subscription = store.subscribe({
      effects: effectData => {
        const { newState, oldState } = effectData

        if (newState.value === oldState?.value) return

        if (oldState && leaveHooks[oldState.value]) {
          leaveHooks[oldState.value].forEach(callback =>
            callback(store, effectData)
          )
        }
        if (enterHooks[newState.value]) {
          enterHooks[newState.value].forEach(callback =>
            callback(store, effectData)
          )
        }
        if (config?.onTransition) {
          config.onTransition(store, effectData)
        }
      },
    })

    return () => subscription.unsubscribe()
  }, [])

  return store
}
