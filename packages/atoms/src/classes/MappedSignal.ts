import { Settable } from '@zedux/core'
import {
  AtomGenerics,
  ExplicitEvents,
  InternalEvaluationReason,
  Mutatable,
  SendableEvents,
  Transaction,
} from '../types/index'
import {
  destroyBuffer,
  flushBuffer,
  getEvaluationContext,
  startBuffer,
} from '../utils/evaluationContext'
import { Ecosystem } from './Ecosystem'
import { SignalInstance } from './SignalInstance'
import { recursivelyMutate, recursivelyProxy } from './proxies'

export type SignalMap = Record<string, SignalInstance>

export class MappedSignal<
  G extends Pick<AtomGenerics, 'Events' | 'State'> & {
    Params?: any
    Template?: any
  } = {
    Events: any
    State: any
  }
> extends SignalInstance<G> {
  /**
   * `I`dsToKeys - maps wrapped signal ids to the keys they control in this
   * wrapper signal's state.
   */
  public I: Record<string, string> = {}

  /**
   * `N`extState - tracks changes in wrapped signals as they cause updates in
   * this signal so we can efficiently set the new state when this signal
   * evaluates.
   */
  public N?: G['State']

  constructor(
    /**
     * @see SignalInstance.e
     */
    public readonly e: Ecosystem,

    /**
     * @see SignalInstance.id
     */
    public readonly id: string,

    /**
     * The map of state properties to signals that control them
     */
    public M: SignalMap
  ) {
    const entries = Object.entries(M)
    const flattenedEvents = {} as {
      [K in keyof G['Events']]: () => G['Events'][K]
    }

    super(e, id, null, flattenedEvents)

    // `get` every signal and auto-add each one as a source of the mapped signal
    const { n, s } = getEvaluationContext()
    startBuffer(this)

    try {
      this.v = Object.fromEntries(
        entries.map(([key, val]) => {
          // flatten all events from all inner signals into the mapped signal's
          // events list
          Object.assign(flattenedEvents, val.E)
          this.I[val.id] = key

          return [key, e.live.get(val)]
        })
      )
    } catch (e) {
      destroyBuffer(n, s)

      throw e
    } finally {
      flushBuffer(n, s)
    }
  }

  public mutate(
    mutatable: Mutatable<G['State']>,
    events?: Partial<G['Events'] & ExplicitEvents>
  ) {
    const oldState = this.v

    if (
      DEV &&
      (typeof oldState !== 'object' || !oldState) &&
      !Array.isArray(oldState) &&
      !((oldState as any) instanceof Set)
    ) {
      throw new TypeError(
        'Zedux: signal.mutate only supports native JS objects, arrays, and sets'
      )
    }

    const transactions: Transaction[] = []
    let newState = oldState

    const parentProxy = {
      t: transactions,
      u: (val: G['State']) => (newState = val),
    }

    const proxyWrapper = recursivelyProxy(oldState, parentProxy)

    if (typeof mutatable === 'function') {
      const result = (mutatable as (state: G['State']) => any)(proxyWrapper.p)

      // if the callback function doesn't return void, assume it's a partial
      // state object that represents a set of mutations Zedux needs to apply to
      // the signal's state.
      if (result) recursivelyMutate(proxyWrapper.p, result)
    } else {
      recursivelyMutate(proxyWrapper.p, mutatable)
    }

    newState === oldState ||
      this.set(newState, {
        ...events,
        // TODO: put this whole function in a job so scheduler is already
        // running here rather than adding a `batch` event here
        batch: true,
        // TODO: instead of calling `this.set`, loop over object entries here
        // and pass each signal only the transactions that apply to it, with the
        // first path key removed (and the array flattened to a string if
        // there's only one key left)
        mutate: transactions,
      } as Partial<G['Events']> & ExplicitEvents)

    return [newState, transactions] as const
  }

  // public send<E extends UndefinedEvents<G['Events']>>(eventName: E): void

  // public send<E extends keyof G['Events']>(
  //   eventName: E,
  //   payload: G['Events'][E]
  // ): void

  /**
   * @see SignalInstance.send
   *
   * like atoms, mapped signals don't have events themselves, but they inherit
   * them from the signals they wrap.
   *
   * This forwards events on to all inner signals that expect them.
   */
  public send<E extends keyof G['Events']>(
    eventName: E,
    payload?: G['Events'][E]
  ) {
    for (const signal of Object.values(this.M)) {
      signal.E?.[eventName] && signal.send(eventName, payload, true)
    }

    // flush once now that all nodes are scheduled
    this.e._scheduler.flush()
  }

  public set(
    settable: Settable<G['State']>,
    events?: Partial<G['Events'] & ExplicitEvents>
  ) {
    const newState =
      typeof settable === 'function'
        ? (settable as (state: G['State']) => G['State'])(this.v)
        : settable

    for (const [key, value] of Object.entries(newState)) {
      if (value !== this.v[key]) {
        // TODO: filter out events that aren't either ExplicitEvents or
        // specified in this inner signal:
        this.M[key].set(value, events)
      }
    }
  }

  /**
   * @see SignalInstance.j
   */
  public j() {
    // Wrapped signal(s) changed. Propagate the change(s) to this wrapper
    // signal. Use `super.set` for this 'cause `this.set` intercepts set calls
    // and forwards them the other way - to the inner signals
    super.set(this.N)
    this.w = []
  }

  /**
   * @see SignalInstance.r
   */
  public r(reason: InternalEvaluationReason, defer?: boolean) {
    if (this.w.push(reason) === 1) {
      this.e._scheduler.schedule(this, defer)

      if (reason.s) this.N = { ...this.v }
    }

    if (reason.s) this.N![this.I[reason.s.id]] = reason.s.get()

    // forward events from wrapped signals to observers of this wrapper signal.
    // Use `super.send` for this 'cause `this.send` intercepts events and passes
    // them the other way (up to wrapped signals)
    reason.e && super.send(reason.e as SendableEvents<G>)
  }
}
