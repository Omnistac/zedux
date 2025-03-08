import {
  Mutatable,
  SendableEvents,
  UndefinedEvents,
} from '@zedux/atoms/types/events'
import {
  AtomGenerics,
  AtomGenericsToAtomApiGenerics,
  ExportsInfusedSetter,
  PromiseState,
  PromiseStatus,
  DehydrationFilter,
  DehydrationOptions,
  AnyAtomGenerics,
  InternalEvaluationReason,
  Settable,
} from '@zedux/atoms/types/index'
import {
  ACTIVE,
  ERROR,
  EventSent,
  INITIALIZING,
  INVALIDATE,
  Invalidate,
  is,
  prefix,
  PROMISE_CHANGE,
  PromiseChange,
  STALE,
  Static,
  TopPrio,
} from '@zedux/atoms/utils/general'
import {
  getErrorPromiseState,
  getInitialPromiseState,
  getSuccessPromiseState,
} from '@zedux/atoms/utils/promiseUtils'
import { Ecosystem } from '../Ecosystem'
import { AtomApi } from '../AtomApi'
import { AtomTemplateBase } from '../templates/AtomTemplateBase'
import {
  destroyNodeFinish,
  destroyNodeStart,
  handleStateChange,
  scheduleEventListeners,
  scheduleStaticDependents,
  setNodeStatus,
} from '../../utils/graph'
import {
  bufferEdge,
  destroyBuffer,
  flushBuffer,
  getEvaluationContext,
  startBuffer,
} from '@zedux/atoms/utils/evaluationContext'
import { Signal } from '../Signal'
import {
  isListeningTo,
  sendEcosystemErrorEvent,
  sendEcosystemEvent,
  sendImplicitEcosystemEvent,
} from '@zedux/atoms/utils/events'

export type InjectorDescriptor<T = any> = {
  /**
   * `c`leanup - tracks cleanup functions, e.g. those returned from
   * `injectEffect` callbacks.
   */
  c: (() => void) | undefined

  /**
   * `t`ype - a unique injector name string. This is how we ensure the user
   * didn't add, remove, or reorder injector calls in the state factory.
   */
  t: string

  /**
   * `v`alue - can be anything. For `injectRef`, this is the ref object. For
   * `injectMemo` and `injectEffect`, this keeps track of the memoized value
   * and/or dependency arrays.
   */
  v: T
}

/**
 * A standard atom's value can be one of:
 *
 * - A raw value
 * - A signal instance
 * - A function that returns a raw value
 * - A function that returns a signal instance
 * - A function that returns an atom api
 */
const evaluate = <G extends Omit<AtomGenerics, 'Node'>>(
  instance: AtomInstance<G>
) => {
  const { _value } = instance.t

  if (typeof _value !== 'function') {
    return _value
  }

  try {
    const val = (
      _value as (
        ...params: G['Params']
      ) => Signal<G> | G['State'] | AtomApi<AtomGenericsToAtomApiGenerics<G>>
    )(...instance.p)

    if (!is(val, AtomApi)) return val as Signal<G> | G['State']

    const api = (instance.api = val as AtomApi<
      AtomGenericsToAtomApiGenerics<G>
    >)

    // Exports can only be set on initial evaluation
    if (instance.l === INITIALIZING && api.exports) {
      instance.exports = api.exports
    }

    // if api.value is a promise, we ignore api.promise
    if (typeof (api.value as unknown as Promise<any>)?.then === 'function') {
      return setPromise(instance, api.value as unknown as Promise<any>, true)
    } else if (api.promise) {
      setPromise(instance, api.promise)
    }

    return api.value as Signal<G> | G['State']
  } catch (err) {
    console.error(`Zedux: Error while evaluating atom "${instance.id}":`, err)

    if (isListeningTo(instance.e, ERROR)) {
      sendEcosystemErrorEvent(instance, err)
    }

    // TODO: can we get rid of the `AtomInstance.i`nit setup now? Would remove
    // the need for this:
    if (instance.l === INITIALIZING) instance.e.n.delete(instance.id)

    throw err
  }
}

const setPromise = <G extends Omit<AtomGenerics, 'Node'>>(
  instance: AtomInstance<G>,
  promise: Promise<any>,
  isStateUpdater?: boolean
) => {
  const currentState = instance.v
  if (promise === instance.promise) return currentState

  instance.promise = promise as G['Promise']

  // since we're the first to chain off the returned promise, we don't need to
  // track the chained promise - it will run first, before React suspense's
  // `.then` on the thrown promise, for example
  promise
    .then(data => {
      if (instance.promise !== promise) return

      instance.promiseStatus = 'success'
      if (!isStateUpdater) return

      instance.set(getSuccessPromiseState(data) as unknown as G['State'])
    })
    .catch(error => {
      if (instance.promise !== promise) return

      if (isListeningTo(instance.e, ERROR)) {
        sendEcosystemErrorEvent(instance, error)
      }

      instance.promiseStatus = 'error'
      instance.promiseError = error
      if (!isStateUpdater) return

      instance.set(getErrorPromiseState(error) as unknown as G['State'])
    })

  const state: PromiseState<any> = getInitialPromiseState(currentState?.data)
  instance.promiseStatus = state.status

  const reason = { r: instance.w, s: instance, t: PromiseChange } as const

  if (isListeningTo(instance.e, PROMISE_CHANGE)) {
    sendImplicitEcosystemEvent(instance.e, reason)
  }

  scheduleStaticDependents(reason)

  return state as unknown as G['State']
}

export class AtomInstance<
  G extends Omit<AtomGenerics, 'Node' | 'Template'> & {
    Template: AtomTemplateBase<G & { Node: any }>
  } = AnyAtomGenerics<{
    Node: any
  }>
> extends Signal<G> {
  public static $$typeof = Symbol.for(`${prefix}/AtomInstance`)

  public api: AtomApi<AtomGenericsToAtomApiGenerics<G>> | undefined = undefined

  // @ts-expect-error this is set in `this.i`nit, right after instantiation, so
  // it technically isn't set during construction. It's fine.
  public exports: G['Exports']

  // @ts-expect-error same as exports
  public promise: G['Promise']

  /**
   * `a`lteredEdge - tracks whether we've altered the edge between this atom and
   * its wrapped signal (if any).
   */
  public a: boolean | undefined = undefined

  /**
   * injected`H`ydration - whether `injectHydration` was called in the atom
   * state factory. If it was, we don't hydrate afterward.
   */
  public H = false

  /**
   * `I`njectors - tracks injector calls from the last time the state factory
   * ran. Initialized on-demand
   */
  public I: InjectorDescriptor[] | undefined = undefined

  /**
   * `N`extInjectors - tracks injector calls as they're made during evaluation
   */
  public N: InjectorDescriptor[] | undefined = undefined

  /**
   * `S`ignal - the signal returned from this atom's state factory. If this is
   * undefined, no signal was returned, and this atom itself becomes the signal.
   * If this is defined, this atom becomes a thin wrapper around this signal.
   */
  public S: Signal<G> | undefined = undefined

  public promiseError: Error | undefined = undefined
  public promiseStatus: PromiseStatus | undefined = undefined

  constructor(
    /**
     * @see Signal.e
     */
    e: Ecosystem,
    /**
     * @see Signal.t
     */
    public readonly t: G['Template'],
    /**
     * @see Signal.id
     */
    id: string,
    /**
     * @see Signal.p
     */
    public readonly p: G['Params']
  ) {
    super(e, id, undefined, undefined, true)
  }

  /**
   * @see Signal.destroy
   */
  public destroy(force?: boolean) {
    if (!destroyNodeStart(this, force)) return

    if (this.I) {
      for (const injector of this.I) {
        injector.c?.()
      }
    }

    destroyNodeFinish(this)
  }

  /**
   * Force this atom instance to reevaluate.
   */
  public invalidate() {
    const reason = { s: this, t: Invalidate } as const
    this.r(reason)

    if (isListeningTo(this.e, INVALIDATE)) {
      sendEcosystemEvent(this.e, { source: this, type: INVALIDATE })
    }

    scheduleEventListeners(reason)
  }

  /**
   * @see Signal.mutate
   *
   * If this atom is wrapping an internal signal, calls `mutate` on the wrapped
   * signal. Otherwise, this atom _is_ the signal, and the mutation is applied
   * to this atom's own value.
   */
  public mutate(
    mutatable: Mutatable<G['State']>,
    events?: Partial<SendableEvents<G>>
  ) {
    return this.S
      ? this.S.mutate(mutatable, events)
      : super.mutate(mutatable, events)
  }

  public send<E extends UndefinedEvents<G['Events']>>(eventName: E): void

  public send<E extends keyof G['Events']>(
    eventName: E,
    payload: G['Events'][E]
  ): void

  public send<E extends Partial<G['Events']>>(events: E): void

  /**
   * @see Signal.send atoms don't have events themselves, but they
   * inherit them from any signal returned from the state factory.
   *
   * This is a noop if no signal was returned (the atom's types reflect this).
   */
  public send<E extends keyof SendableEvents<G>>(
    eventName: E,
    payload?: G['Events'][E]
  ) {
    this.S?.send(eventName, payload as SendableEvents<G>[E])
  }

  /**
   * @see Signal.set
   *
   * If this atom is wrapping an internal signal, calls `set` on the wrapped
   * signal. Otherwise, this atom _is_ the signal, and the state change is
   * applied to this atom's own value.
   */
  public set(
    settable: Settable<G['State']>,
    events?: Partial<SendableEvents<G>>
  ) {
    return this.S ? this.S.set(settable, events) : super.set(settable, events)
  }

  /**
   * @see Signal.d
   */
  public d(options?: DehydrationFilter) {
    if (!this.f(options)) return

    const { t, v } = this
    const transform =
      (typeof options === 'object' &&
        !is(options, AtomTemplateBase) &&
        (options as DehydrationOptions).transform) ??
      true

    return transform && t.dehydrate ? t.dehydrate(v) : v
  }

  /**
   * @see Signal.h
   */
  public h(val: any) {
    this.set(this.t.hydrate ? this.t.hydrate(val) : val)
  }

  /**
   * `i`nit - Perform the initial run of this atom's state factory. Create the
   * `S`ignal (if any), promise, exports, and hydrate (all optional).
   */
  public i() {
    const { n } = getEvaluationContext()
    this.j()

    // hydrate if possible
    if (!this.H) {
      const hydration = this.e.hydration?.[this.id]

      if (typeof hydration !== 'undefined') this.h(hydration)
    }

    flushBuffer(n)
    setNodeStatus(this, ACTIVE)
  }

  /**
   * @see Signal.j
   */
  public j() {
    if (this.a && this.w?.s === this.S) {
      // if we altered the edge between this atom and its wrapped signal, the
      // wrapped signal should not trigger an evaluation of this atom. Skip
      // evaluation - just capture the state update and forward to this atom's
      // observers.
      const oldState = this.v
      this.v = this.S!.v // `this.S`ignal must exist if `this.a`lteredEdge does
      handleStateChange(this, oldState)

      return
    }

    const prevNode = startBuffer(this)

    try {
      const newFactoryResult = evaluate(this)

      if (this.l === INITIALIZING) {
        if ((newFactoryResult as Signal)?.izn) {
          this.S = newFactoryResult
          this.v = (newFactoryResult as Signal<G>).v
          this.E = (newFactoryResult as Signal<G>).E
        } else {
          this.v = newFactoryResult
        }
      } else {
        if (
          DEV &&
          (this.S
            ? newFactoryResult !== this.S
            : (newFactoryResult as Signal)?.izn)
        ) {
          throw new Error(
            `Zedux: state factories must either return the same signal or a non-signal value every evaluation. Check the implementation of atom "${this.id}".`
          )
        }

        const oldState = this.v
        this.v = this.S ? newFactoryResult.v : newFactoryResult

        this.v === oldState || handleStateChange(this, oldState)
      }

      if (this.S) {
        const edge = this.s.get(newFactoryResult)

        if (edge) {
          // the edge between this atom and its wrapped signal needs to be
          // reactive. Track whether we made the `p`endingFlags added by
          // `injectSignal`/similar non-Static. If we did, we need to make the
          // edge not reevaluate this atom.
          this.a = !!(edge.p! & Static) // `.p!` - doesn't matter if undefined
          edge.p = TopPrio
        } else {
          bufferEdge(newFactoryResult, 'implicit', TopPrio)
        }
      }
    } catch (err) {
      if (this.N) {
        for (const injector of this.N) {
          injector.c?.()
        }
      }

      this.N = undefined
      destroyBuffer(prevNode)

      // even if evaluation errored, we need to keep this atom in sync with its
      // signal and update transitive observers if the `S`ignal's state changed.
      if (this.S && this.S.v !== this.v) {
        const oldState = this.v
        this.v = this.S.v

        handleStateChange(this, oldState)
      }

      throw err
    } finally {
      this.w = this.wT = undefined
    }

    // store the new injectors
    if (this.N) {
      this.I = this.N
      this.N = undefined
    }

    // let this.i flush updates after status is set to Active
    this.l === INITIALIZING || flushBuffer(prevNode)
  }

  /**
   * @see Signal.m
   */
  public m() {
    const ttl = this._getTtl()
    if (ttl === 0) return this.destroy()

    setNodeStatus(this, STALE)
    if (ttl == null || ttl === -1) return

    if (typeof ttl === 'number') {
      // ttl is > 0; schedule destruction
      const timeoutId = setTimeout(() => {
        this.c = undefined
        this.destroy()
      }, ttl)

      this.c = () => {
        setNodeStatus(this, ACTIVE)
        this.c = undefined
        clearTimeout(timeoutId)
      }

      return
    }

    if (typeof (ttl as Promise<any>).then === 'function') {
      let isCanceled = false
      Promise.allSettled([ttl as Promise<any>]).then(() => {
        this.c = undefined
        if (!isCanceled) this.destroy()
      })

      this.c = () => {
        setNodeStatus(this, ACTIVE)
        this.c = undefined
        isCanceled = true
      }

      return
    }

    // ttl is an observable; destroy as soon as it emits
    const subscription = (
      ttl as { subscribe: (cb: () => void) => { unsubscribe: () => void } }
    ).subscribe(() => {
      this.c = undefined
      this.destroy()
    })

    this.c = () => {
      setNodeStatus(this, ACTIVE)
      this.c = undefined
      subscription.unsubscribe()
    }
  }

  /**
   * @see Signal.r
   */
  public r(reason: InternalEvaluationReason) {
    if (reason.t === EventSent) {
      // forward events from `this.S`ignal to observers of this atom instance.
      // Ignore events from other sources (shouldn't happen, but either way
      // those shouldn't be forwarded). Use `super.send` for this 'cause
      // `this.send` captures events and sends them the other way (up to
      // `this.S`ignal)
      reason.s === this.S && super.send(reason.e as SendableEvents<G>)

      return
    }

    super.r(reason)

    if (reason.s && reason.s === this.S && reason.e) {
      // when `this.S`ignal gives us events along with a state update, subsume
      // it as this atom's own state update. This atom will reevaluate before
      // any scheduled observers, giving the state factory an opportunity to
      // change the signal's state again, resulting in an additional event.
      const oldState = this.v
      this.v = reason.s.v

      this.v === oldState ||
        handleStateChange(this, oldState, reason.e as Partial<G['Events']>)
    }
  }

  public _set?: ExportsInfusedSetter<G['State'], G['Exports']>
  public get _infusedSetter() {
    if (this._set) return this._set
    const setState: any = (settable: any, meta?: any) =>
      this.set(settable, meta)

    return (this._set = Object.assign(setState, this.exports))
  }

  private _getTtl() {
    if (this.api?.ttl == null) {
      return this.t.ttl ?? this.e.atomDefaults?.ttl
    }

    // this atom instance set its own ttl
    const { ttl } = this.api

    return typeof ttl === 'function' ? ttl() : ttl
  }
}
