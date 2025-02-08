import { Signal } from '../classes/Signal'
import { EventMap, InjectSignalConfig, MapEvents, None } from '../types/index'
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
 */
export const injectSignal = <State, MappedEvents extends EventMap = None>(
  state: (() => State) | State,
  config?: InjectSignalConfig<MappedEvents>
) => {
  const instance = injectSelf()

  const signal = injectMemo(() => {
    const id = instance.e._idGenerator.generateId(`@signal(${instance.id})`)

    const signal = new Signal<{
      Events: MapEvents<MappedEvents>
      State: State
    }>(
      instance.e,
      id,
      typeof state === 'function' ? untrack(state as () => State) : state, // TODO: should hydration be passed to the `state()` factory?
      config?.events
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
