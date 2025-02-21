import { StoreEffect } from '@zedux/core'
import { MachineStore } from './MachineStore'

export type MachineHook<
  StateNames extends string,
  EventNames extends string,
  Context extends Record<string, any> | undefined
> = (
  store: MachineStore<StateNames, EventNames, Context>,
  storeEffect: StoreEffect<
    MachineStateShape<StateNames, Context>,
    MachineStore<StateNames, EventNames, Context>
  >
) => void

export interface MachineStateShape<
  StateNames extends string = string,
  Context extends Record<string, any> | undefined = undefined
> {
  value: StateNames
  context: Context
}

export type MachineStoreContextType<M extends MachineStore> =
  M extends MachineStore<any, any, infer C> ? C : never

export type MachineStoreEventNamesType<M extends MachineStore> =
  M extends MachineStore<any, infer E, any> ? E : never

export type MachineStoreStateType<M extends MachineStore> =
  M extends MachineStore<infer S, any, infer C>
    ? MachineStateShape<S, C>
    : never

export type MachineStoreStateNamesType<M extends MachineStore> =
  M extends MachineStore<infer S, any, any> ? S : never
