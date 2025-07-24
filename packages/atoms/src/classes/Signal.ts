import {
  AtomGenerics,
  GraphEdge,
  Mutatable,
  NodeGenerics,
  SendableEvents,
  Settable,
  Transaction,
  UndefinedEvents,
} from '../types/index'
import { ACTIVE, EventSent } from '../utils/general'
import {
  destroyNodeFinish,
  destroyNodeStart,
  scheduleEventListeners,
  setNodeStatus,
} from '../utils/graph'
import { Ecosystem } from './Ecosystem'
import { ZeduxNode } from './ZeduxNode'
import { recursivelyMutate, recursivelyProxy } from './proxies'
import { getEvaluationContext } from '../utils/evaluationContext'
import { schedulerPost, schedulerPre } from '../utils/ecosystem'

export const doMutate = <G extends NodeGenerics>(
  node: Signal<G>,
  isWrapperSignal: boolean,
  mutatable: Mutatable<G['State']>,
  events?: Partial<SendableEvents<G>>
) => {
  if (getEvaluationContext().n) {
    node.e.syncScheduler.i(() => node.mutate(mutatable, events))

    return
  }

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
    if (result && typeof result === 'object' && !transactions.length) {
      recursivelyMutate(proxyWrapper.p, result)
    }
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

      schedulerPre(node.e)
      node.e.ch(node, oldState, {
        ...events,
        mutate: transactions,
      } as Partial<SendableEvents<G>>)
      schedulerPost(node.e)
    }
  }
}

export class Signal<
  G extends Pick<AtomGenerics, 'Events' | 'State'> & {
    Params?: any
    Template?: any
  } = {
    Events: any
    State: any
  }
> extends ZeduxNode<
  G & {
    Params: G extends { Params: infer P } ? P : undefined
    Template: G extends { Template: infer T } ? T : undefined
  }
> {
  /**
   * @see ZeduxNode.o
   */
  public o = new Map<ZeduxNode, GraphEdge>()

  /**
   * @see ZeduxNode.p
   */
  // @ts-expect-error params are not defined by signals, so this will always be
  // undefined here, doesn't matter that we don't specify it in the constructor.
  // Subclasses like `AtomInstance` do specify it
  public p: G['Params']

  /**
   * @see ZeduxNode.s Signals don't typically have sources. So this starts off
   * as a getter for efficiency.
   */
  public get s(): Map<ZeduxNode, GraphEdge> {
    Object.defineProperty(this, 's', { value: new Map() })
    return this.s
  }

  /**
   * @see ZeduxNode.t
   */
  // @ts-expect-error this is undefined for signals, only defined by subclasses
  public t: G['Template']

  public constructor(
    /**
     * @see ZeduxNode.e
     */
    public readonly e: Ecosystem,

    /**
     * @see ZeduxNode.id
     */
    public readonly id: string,

    /**
     * @see ZeduxNode.v
     */
    public v: G['State'],

    deferActiveStatus?: boolean
  ) {
    super()

    deferActiveStatus || setNodeStatus(this, ACTIVE)
  }

  /**
   * @see ZeduxNode.destroy
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
    doMutate(this, false, mutatable, events)
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
    const { n, u } = getEvaluationContext()

    if (n || u) {
      this.e.syncScheduler.i(() => this.set(settable, events))

      return
    }

    const oldState = this.v
    const newState = (this.v =
      typeof settable === 'function'
        ? (settable as (state: G['State']) => G['State'])(oldState)
        : settable)

    if (newState !== oldState) {
      schedulerPre(this.e)
      this.e.ch(this, oldState, events)
      schedulerPost(this.e)
    }
  }

  /**
   * @see ZeduxNode.d
   *
   * TODO: When dehydrating, we could specifically not dehydrate atoms that wrap
   * signals and instead dehydrate the signal. Then that signal would rehydrate
   * itself. Would require signals to only use an incrementing id like
   * `@signal(atom-id)-1`
   */
  public d() {}

  /**
   * @see ZeduxNode.h
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public h(val: any) {}

  /**
   * @see ZeduxNode.j
   */
  public j() {}

  /**
   * @see ZeduxNode.m Signals are always destroyed when no longer in use
   */
  public m() {
    this.destroy()
  }
}
