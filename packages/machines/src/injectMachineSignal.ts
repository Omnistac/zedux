import { injectMemo, injectRef, injectSelf } from '@zedux/atoms'
import { MachineSignal } from './MachineSignal'
import { MachineHook, MachineStateShape } from './types'
import { Eventless, EventlessStatic } from './utils'

type ArrToUnion<S extends string[]> = S extends [infer K, ...infer Rest]
  ? Rest extends string[]
    ? K | ArrToUnion<Rest>
    : never
  : never

export type InjectMachineSignalParams<
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
    hydrate?: boolean
    reactive?: boolean
  }
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
 * Create a MachineSignal. Pass a statesFactory.
 *
 * The first state in the state list returned from your statesFactory will
 * become the initial state (`.value`) of the signal.
 *
 * ```ts
 * const signal = injectMachineSignal(state => [
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
 * be called with the current state and the next state name and should return a
 * boolean. Return true to allow the transition, or any falsy value to deny it.
 *
 * Set a universal `onTransition` listener via the 3rd `config` object param.
 * This listener will be called every time the machine transitions to a new
 * state (after the state is updated). It will be called with 2 params: The
 * current MachineSignal and the change event containing `newState` and
 * `oldState`.
 *
 * @param statesFactory Required. A function. Use the received state factory to
 * create a list of states for the machine and specify their transitions,
 * guards, and listeners.
 * @param initialContext Optional. An object or undefined. Will be set as the
 * initial `.context` value of the machine signal's state.
 * @param config Optional. An object with additional properties: `guard`,
 * `onTransition`, and `hydrate`.
 */
export const injectMachineSignal: <
  States extends MachineState[],
  Context extends Record<string, any> | undefined = undefined
>(
  ...[statesFactory, initialContext, config]: InjectMachineSignalParams<
    States,
    Context
  >
) => MachineSignal<
  MapStatesToStateNames<States, Context>,
  MapStatesToEvents<States, Context>,
  Context
> = <
  States extends MachineState[],
  Context extends Record<string, any> | undefined = undefined
>(
  ...[statesFactory, initialContext, config]: InjectMachineSignalParams<
    States,
    Context
  >
) => {
  type EventNames = MapStatesToEvents<States, Context>
  type StateNames = MapStatesToStateNames<States, Context>

  const instance = injectSelf()

  const { enterHooks, signal } = injectMemo(() => {
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
    const id = instance.e.makeId('signal', instance)

    const signal = new MachineSignal<StateNames, EventNames, Context>(
      instance.e,
      id,
      hydration?.value ?? (initialState.stateName as StateNames),
      states,
      hydration?.context ?? initialContext,
      config?.guard
    )

    instance.e.n.set(id, signal)

    type State = MachineStateShape<StateNames, Context>

    signal.on('change', (changeEvent: { newState: State; oldState: State }) => {
      const { newState, oldState } = changeEvent

      if (newState.value === oldState.value) return

      if (leaveHooks[oldState.value]) {
        leaveHooks[oldState.value].forEach(callback =>
          callback(signal, { newState, oldState })
        )
      }
      if (enterHooks[newState.value]) {
        enterHooks[newState.value].forEach(callback =>
          callback(signal, { newState, oldState })
        )
      }
      if (config?.onTransition) {
        config.onTransition(signal, { newState, oldState })
      }
    })

    return { enterHooks, leaveHooks, signal }
  }, [])

  // Only fire initial onEnter hooks on the first evaluation. onEnter callbacks
  // may call setContext(), which defers a signal.set(). That triggers
  // re-evaluation, which would fire onEnter again → infinite loop.
  const initialEnterFired = injectRef(false)

  if (!initialEnterFired.current) {
    initialEnterFired.current = true
    const currentState = signal.v

    if (enterHooks[currentState.value]) {
      enterHooks[currentState.value].forEach(callback =>
        callback(signal, {
          newState: currentState,
        })
      )
    }
  }

  // Create a graph edge so the atom reacts to signal state changes
  signal.get({
    f: config?.reactive === false ? EventlessStatic : Eventless,
    op: 'injectMachineSignal',
  })

  return signal
}
