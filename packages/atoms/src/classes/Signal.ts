import { Settable } from '@zedux/core'
import {
  AtomGenerics,
  ExplicitEvents,
  InternalEvaluationReason,
  Mutatable,
  SendableEvents,
  Transaction,
  UndefinedEvents,
} from '../types/index'
import { EventSent } from '../utils/general'
import {
  destroyNodeFinish,
  destroyNodeStart,
  handleStateChange,
  scheduleDependents,
} from '../utils/graph'
import { Ecosystem } from './Ecosystem'
import { GraphNode } from './GraphNode'
import { recursivelyMutate, recursivelyProxy } from './proxies'

export class Signal<
  G extends Pick<AtomGenerics, 'Events' | 'State'> & {
    Params?: any
    Template?: any
  } = {
    Events: any
    State: any
  }
> extends GraphNode<
  G & {
    Params: G extends { Params: infer P } ? P : undefined
    Template: G extends { Template: infer T } ? T : undefined
  }
> {
  /**
   * @see GraphNode.p
   */
  // @ts-expect-error params are not defined by signals, so this will always be
  // undefined here, doesn't matter that we don't specify it in the constructor.
  // Subclasses like `AtomInstance` do specify it
  public p: G['Params']

  /**
   * @see GraphNode.t
   */
  // @ts-expect-error this is undefined for signals, only defined by subclasses
  public t: G['Template']

  public constructor(
    /**
     * @see GraphNode.e
     */
    public readonly e: Ecosystem,

    /**
     * @see GraphNode.id
     */
    public readonly id: string,

    /**
     * @see GraphNode.v
     */
    public v: G['State'],

    /**
     * `E`ventMap - an object mapping all custom event names of this signal to
     * unused functions with typed return types. We use ReturnType on these to
     * infer the expected payload type of each custom event.
     */
    public E?: { [K in keyof G['Events']]: () => G['Events'][K] }
  ) {
    super()
  }

  /**
   * @see GraphNode.destroy
   */
  public destroy(force?: boolean) {
    destroyNodeStart(this, force) && destroyNodeFinish(this)
  }

  /**
   * Sets up a proxy that listens to all mutations on this signal's state in the
   * passed callback.
   *
   * If the state shape is a normal JS object, this method also accepts an
   * object shorthand (nested indefinitely as long as all nested fields are
   * normal JS objects):
   *
   * ```ts
   * mySignal.mutate({ a: { b: 1 } })
   * // is equivalent to:
   * mySignal.mutate(state => {
   *   state.a.b = 1
   * })
   * ```
   *
   * Accepts an optional second `events` object param. Any events specified here
   * will be sent (along with the native `change` and `mutate` events if state
   * changed) to event listeners of this signal.
   */
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
      u: (val: G['State']) => (newState = this.v = val),
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
      handleStateChange(this, oldState, {
        ...events,
        mutate: transactions,
      } as Partial<G['Events']> & ExplicitEvents)

    return [newState, transactions] as const
  }

  public send<E extends UndefinedEvents<SendableEvents<G>>>(eventName: E): void

  public send<E extends keyof SendableEvents<G>>(
    eventName: E,
    payload: SendableEvents<G>[E],
    defer?: boolean
  ): void

  public send<E extends Partial<SendableEvents<G>>>(events: E): void

  /**
   * Manually notify this signal's event listeners of an event. Accepts an
   * object to send multiple events at once.
   *
   * The optional third `defer` param is mostly for internal use. We pass
   * `false` and manually flush the scheduler to batch multiple sends.
   *
   * ```ts
   * signal.send({ eventA: 'payload for a', eventB: 'payload for b' })
   * ```
   */
  public send<E extends keyof SendableEvents<G>>(
    eventNameOrMap: E | Partial<SendableEvents<G>>,
    payload?: SendableEvents<G>[E],
    defer?: boolean
  ) {
    // TODO: maybe safeguard against users sending unrecognized events here
    // (especially `send`ing an ImplicitEvent would break everything)
    const events =
      typeof eventNameOrMap === 'object'
        ? eventNameOrMap
        : { [eventNameOrMap]: payload }

    scheduleDependents({ e: events, s: this, t: EventSent })

    defer || this.e._scheduler.flush()
  }

  /**
   * Completely overwrites the previous value of this signal with the passed
   * value.
   *
   * Accepts a function overload to set new state given the current state.
   *
   * Accepts an optional second `events` object param. Any events specified here
   * will be sent (along with the native `change` event if state changed) to
   * event listeners of this signal.
   */
  public set(
    settable: Settable<G['State']>,
    events?: Partial<G['Events'] & ExplicitEvents>
  ) {
    const oldState = this.v
    const newState = (this.v =
      typeof settable === 'function'
        ? (settable as (state: G['State']) => G['State'])(oldState)
        : settable)

    newState === oldState || handleStateChange(this, oldState, events)
  }

  /**
   * @see GraphNode.d
   *
   * TODO: When dehydrating, we could specifically not dehydrate atoms that wrap
   * signals and instead dehydrate the signal. Then that signal would rehydrate
   * itself. Would require signals to only use an incrementing id like
   * `@signal(atom-id)-1`
   */
  public d() {}

  /**
   * @see GraphNode.h
   */
  public h(val: any) {}

  /**
   * @see GraphNode.j a noop - signals are never scheduled as jobs - they have
   * no sources and nothing to evaluate
   */
  public j() {}

  /**
   * @see GraphNode.m Signals are always destroyed when no longer in use
   */
  public m() {
    this.destroy()
  }

  /**
   * @see GraphNode.r a noop - signals have nothing to evaluate
   */
  public r(reason: InternalEvaluationReason, defer?: boolean) {}
}
