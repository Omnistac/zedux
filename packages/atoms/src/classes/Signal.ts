import { Settable } from '@zedux/core'
import {
  AtomGenerics,
  InternalEvaluationReason,
  Mutatable,
  NodeGenerics,
  SendableEvents,
  Transaction,
  UndefinedEvents,
} from '../types/index'
import { ACTIVE, EventSent } from '../utils/general'
import {
  destroyNodeFinish,
  destroyNodeStart,
  handleStateChange,
  scheduleEventListeners,
  setNodeStatus,
} from '../utils/graph'
import { Ecosystem } from './Ecosystem'
import { GraphNode } from './GraphNode'
import { recursivelyMutate, recursivelyProxy } from './proxies'

export const doMutate = <G extends NodeGenerics>(
  node: Signal<G>,
  isWrapperSignal: boolean,
  mutatable: Mutatable<G['State']>,
  events?: Partial<SendableEvents<G>>
) => {
  const oldState = node.v

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

  if (newState !== oldState) {
    if (isWrapperSignal) {
      node.set(newState, {
        ...events,
        mutate: transactions,
      } as Partial<SendableEvents<G>>)
    } else {
      node.v = newState

      handleStateChange(node, oldState, {
        ...events,
        mutate: transactions,
      } as Partial<SendableEvents<G>>)
    }
  }

  return [newState, transactions] as const
}

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
    public E?: { [K in keyof G['Events']]: () => G['Events'][K] },

    deferActiveStatus?: boolean
  ) {
    super()

    deferActiveStatus || setNodeStatus(this, ACTIVE)
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
    events?: Partial<SendableEvents<G>>
  ) {
    return doMutate(this, false, mutatable, events)
  }

  public send<E extends UndefinedEvents<G['Events']>>(eventName: E): void

  public send<E extends keyof G['Events']>(
    eventName: E,
    payload: G['Events'][E]
  ): void

  public send<E extends Partial<G['Events']>>(events: E): void

  /**
   * Manually notify this signal's event listeners of an event. Accepts an
   * object to send multiple events at once.
   *
   * ```ts
   * signal.send({ eventA: 'payload for a', eventB: 'payload for b' })
   * ```
   */
  public send<E extends keyof G['Events']>(
    eventNameOrMap: E | Partial<G['Events']>,
    payload?: G['Events'][E]
  ) {
    // TODO: maybe safeguard against users sending unrecognized events here
    // (especially `send`ing an ImplicitEvent would break everything)
    const events =
      typeof eventNameOrMap === 'object'
        ? eventNameOrMap
        : { [eventNameOrMap]: payload }

    scheduleEventListeners({ e: events, s: this, t: EventSent })
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
    events?: Partial<SendableEvents<G>>
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public r(reason: InternalEvaluationReason, defer?: boolean) {}
}
