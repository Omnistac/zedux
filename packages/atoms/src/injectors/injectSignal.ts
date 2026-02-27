import { Signal } from '../classes/Signal'
import { InjectSignalConfig, None } from '../types/index'
import { untrack } from '../utils/evaluationContext'
import { Eventless, EventlessStatic } from '../utils/general'
import { injectMemo } from './injectMemo'
import { injectSelf } from './injectSelf'

/**
 * A TS utility for typing custom events.
 *
 * ```ts
 * const signal = injectSignal('state', {
 *   events: {
 *     customEvent: As<{ customPayload: string }>
 *   }
 * })
 * ```
 */
export const As = <T>() => 0 as unknown as T

/**
 * The main API for creating signals in Zedux. Returns a stable instance of the
 * Signal class.
 *
 * By default, this makes the current atom react to state updates in the
 * injected signal. Pass `{ reactive: false }` as the second argument to disable
 * this.
 *
 * For TS users: Configure custom events for this signal by either passing the
 * `EventMap` generic manually or the `events` config option. Use the `As`
 * helper to type each event's payload:
 *
 * ```ts
 * // these are functionally equivalent:
 * injectSignal<typeof myState, { myEvent: MyType }>(myState)
 * injectSignal(myState, { events: { myEvent: As<MyType> } })
 * ```
 */
export const injectSignal = <
  State,
  EventMap extends Record<string, any> = None
>(
  state: (() => State) | State,
  config?: InjectSignalConfig<EventMap>
) => {
  const instance = injectSelf()

  const signal = injectMemo(() => {
    const id = instance.e.makeId('signal', instance)

    const signal = new Signal<{
      Events: EventMap
      Params: undefined
      State: State
      Template: undefined
    }>(
      instance.e,
      id,
      typeof state === 'function' ? untrack(state as () => State) : state
    )

    instance.e.n.set(id, signal)

    return signal
  }, [])

  // create a graph edge between the current atom and the new signal
  signal.get({
    f: config?.reactive === false ? EventlessStatic : Eventless,
    op: 'injectSignal',
  })

  return signal
}
