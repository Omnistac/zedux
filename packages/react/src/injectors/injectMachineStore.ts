import { MachineStore } from '@zedux/core'
import { injectMemo } from './injectMemo'

type ArrToUnion<S extends string[]> = S extends [infer K, ...infer Rest]
  ? Rest extends string[]
    ? K | ArrToUnion<Rest>
    : never
  : never

interface MachineState<
  Name extends string = string,
  Events extends string[] = [],
  ChildStates extends string[] = []
> {
  on: <E extends string, S extends string>(
    eventName: E,
    nextState: S
  ) => MachineState<Name, [...Events, E], [...ChildStates, S]>
  stateName: Name
}

type MapStatesToStateNames<States extends MachineState[]> = States extends [
  infer K,
  ...infer Rest
]
  ? K extends MachineState
    ? Rest extends MachineState[]
      ?
          | StateNameType<K>
          | ArrToUnion<StateChildStatesType<K>>
          | MapStatesToStateNames<Rest>
      : never
    : never
  : never

type MapStatesToEvents<States extends MachineState[]> = States extends [
  infer K,
  ...infer Rest
]
  ? K extends MachineState
    ? Rest extends MachineState[]
      ? ArrToUnion<StateEventsType<K>> | MapStatesToEvents<Rest>
      : ArrToUnion<StateEventsType<K>>
    : never
  : never

type StateChildStatesType<S extends MachineState> = S extends MachineState<
  string,
  string[],
  infer ChildStates
>
  ? ChildStates
  : never

type StateEventsType<S extends MachineState> = S extends MachineState<
  string,
  infer Events
>
  ? Events
  : never

type StateNameType<S extends MachineState> = S extends MachineState<infer Name>
  ? Name
  : never

export const injectMachineStore = <
  States extends MachineState[],
  Context extends Record<string, any> | undefined = undefined
>(
  createMachine: (
    state: <Name extends string>(stateName: Name) => MachineState<Name>
  ) => [...States],
  initialContext?: Context
): MachineStore<
  MapStatesToStateNames<States>,
  MapStatesToEvents<States>,
  Context
> => {
  type EventNames = MapStatesToEvents<States>
  type StateNames = MapStatesToStateNames<States>

  const store = injectMemo(() => {
    const eventNames = new Set<EventNames>()
    const states = {} as Record<
      StateNames,
      Record<EventNames, MapStatesToStateNames<States>>
    >

    const createState = <Name extends string>(stateName: Name) => {
      const state = {
        on: (eventName: string, nextState: string) => {
          eventNames.add(eventName as EventNames)

          if (!states[stateName as StateNames]) {
            states[stateName as StateNames] = {}
          }

          states[stateName as StateNames][
            eventName as EventNames
          ] = nextState as MapStatesToStateNames<States>

          return state
        },
        stateName,
      }

      return state
    }

    const [initialState] = createMachine(createState)

    return new MachineStore<StateNames, EventNames, Context>(
      initialState.stateName as StateNames,
      states,
      eventNames,
      initialContext
    )
  }, [])

  return store
}
