import {
  Ecosystem,
  RecursivePartial,
  Signal,
  Settable,
} from '@zedux/atoms'
import { MachineStateShape } from './types'

// eslint-disable-next-line @typescript-eslint/ban-types
const signalSend = Signal.prototype.send as (...args: any[]) => void

/**
 * A low-level Signal subclass that represents a state machine. Don't create
 * this class yourself, use a helper such as @zedux/machines'
 * `injectMachineSignal()`
 */
export class MachineSignal<
  StateNames extends string = string,
  EventNames extends string = string,
  Context extends Record<string, any> | undefined = undefined
> extends Signal<{
  Events: Record<EventNames, undefined>
  Params: undefined
  State: MachineStateShape<StateNames, Context>
  Template: undefined
}> {
  #guard?: (currentState: any, nextValue: any) => boolean

  #states: Record<
    string,
    Record<string, { name: string; guard?: (context: any) => boolean }>
  >

  constructor(
    ecosystem: Ecosystem,
    id: string,
    initialState: StateNames,
    states: Record<
      StateNames,
      Record<
        EventNames,
        { name: StateNames; guard?: (context: Context) => boolean }
      >
    >,
    initialContext?: Context,
    guard?: (
      currentState: MachineStateShape<StateNames, Context>,
      nextValue: StateNames
    ) => boolean
  ) {
    super(ecosystem, id, {
      context: initialContext as Context,
      value: initialState,
    })

    this.#states = states
    this.#guard = guard

    this.on(eventMap => {
      for (const key of Object.keys(eventMap)) {
        const currentState = this.v
        const transition = this.#states[currentState.value]?.[key]

        if (
          !transition ||
          (transition.guard && !transition.guard(currentState.context)) ||
          (this.#guard && !this.#guard(currentState, transition.name))
        ) {
          continue
        }

        this.set({
          context: currentState.context,
          value: transition.name as StateNames,
        })
      }
    })
  }

  public getContext = () => this.v.context

  public getValue = () => this.v.value

  public is = (stateName: StateNames) => this.v.value === stateName

  public send = (
    eventNameOrEvents: EventNames | Partial<Record<EventNames, undefined>>
  ) => {
    signalSend.call(this, eventNameOrEvents)
  }

  public setContext = (context: Settable<Context>) =>
    this.set(state => ({
      context:
        typeof context === 'function'
          ? (context as (prev: Context) => Context)(state.context)
          : context,
      value: state.value,
    }))

  public mutateContext = (
    mutatable:
      | RecursivePartial<Context>
      | ((context: Context) => void | RecursivePartial<Context>)
  ) => {
    if (typeof mutatable === 'function') {
      this.mutate(state => {
        const result = (
          mutatable as (ctx: Context) => void | RecursivePartial<Context>
        )(state.context)

        if (result && typeof result === 'object') {
          return { context: result } as any
        }
      })
    } else {
      this.mutate({ context: mutatable } as any)
    }
  }
}
