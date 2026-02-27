import { MachineSignal } from './MachineSignal'

export type MachineHook<
  StateNames extends string = string,
  EventNames extends string = string,
  Context extends Record<string, any> | undefined = undefined
> = (
  signal: MachineSignal<any, any, Context>,
  event: {
    newState: MachineStateShape<StateNames, Context>
    oldState?: MachineStateShape<StateNames, Context>
  }
) => void

export interface MachineStateShape<
  StateNames extends string = string,
  Context extends Record<string, any> | undefined = undefined
> {
  value: StateNames
  context: Context
}

export type ContextOf<M extends MachineSignal<any, any, any>> =
  M extends MachineSignal<any, any, infer C> ? C : never

export type EventNamesOf<M extends MachineSignal<any, any, any>> =
  M extends MachineSignal<any, infer E, any> ? E : never

export type StateNamesOf<M extends MachineSignal<any, any, any>> =
  M extends MachineSignal<infer S, any, any> ? S : never
