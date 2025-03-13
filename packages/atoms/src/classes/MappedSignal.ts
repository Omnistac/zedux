import {
  AnyNodeGenerics,
  AtomGenerics,
  InternalEvaluationReason,
  Mutatable,
  SendableEvents,
  Settable,
  Transaction,
  UndefinedEvents,
} from '../types/index'
import { flushBuffer } from '../utils/evaluationContext'
import { Ecosystem } from './Ecosystem'
import { doMutate, Signal } from './Signal'
import { ACTIVE, EventSent, INITIALIZING, TopPrio } from '../utils/general'
import { setNodeStatus } from '../utils/graph'
import { schedulerPost, schedulerPre } from '../utils/ecosystem'

export type SignalMap = Record<string, Signal<AnyNodeGenerics> | unknown>

export class MappedSignal<
  G extends Pick<AtomGenerics, 'Events' | 'State'> & {
    Params?: any
    Template?: any
  } = {
    Events: any
    State: any
  }
> extends Signal<G> {
  /**
   * `C`hangeEvents - any events passed to `this.set`. We propagate these
   * directly to observers rather than re-inferring them all from inner signals
   * after passing the `set` changes along to them.
   */
  public C?: Partial<SendableEvents<G>>

  /**
   * `b`ufferedTransactions - when propagating mutate events from inner signals
   * that did _not_ originate from this wrapper signal, we attach the inner
   * signal's key path to each transaction and send those modified transactions
   * along with the change event when this wrapper signal's job runs.
   */
  public b?: Transaction[]

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
     * @see Signal.e
     */
    e: Ecosystem,

    /**
     * @see Signal.id
     */
    id: string,

    /**
     * The map of state properties to signals that control them
     */
    public M: SignalMap
  ) {
    super(
      e,
      id,
      undefined,
      {} as {
        [K in keyof G['Events']]: () => G['Events'][K]
      },
      true
    )
  }

  /**
   * @see Signal.send
   */
  public mutate(
    mutatable: Mutatable<G['State']>,
    events?: Partial<SendableEvents<G>>
  ) {
    doMutate(this, true, mutatable, events)
  }

  public send<E extends UndefinedEvents<G['Events']>>(eventName: E): void

  public send<E extends keyof G['Events']>(
    eventName: E,
    payload: G['Events'][E]
  ): void

  public send<E extends Partial<G['Events']>>(events: E): void

  /**
   * @see Signal.send
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
    schedulerPre(this.e)

    for (const signal of Object.values(this.M)) {
      if ((signal as Signal | undefined)?.izn) {
        ;(signal as Signal).E?.[eventName] &&
          (signal as Signal).send(eventName, payload)
      }
    }

    schedulerPost(this.e)
  }

  public set(
    settable: Settable<G['State']>,
    events?: Partial<SendableEvents<G>>
  ) {
    const newState =
      typeof settable === 'function'
        ? (settable as (state: G['State']) => G['State'])(this.v)
        : settable

    if (newState === this.v) return

    this.C = events

    schedulerPre(this.e)

    try {
      for (const [key, value] of Object.entries(newState)) {
        if (value !== this.v[key]) {
          const signal = this.M[key]

          if (!(signal as Signal | undefined)?.izn) {
            if (!this.N) this.N = { ...this.v }

            this.N![key] = value
            continue
          }

          const relevantEvents =
            (signal as Signal).E &&
            events &&
            Object.fromEntries(
              Object.entries(events).filter(
                // we don't pass mutate events to inner signals - they weren't
                // mutated, the outer signal was. This is to optimize
                // performance for the most common case - usually you won't
                // subscribe to individual inner signals; you subscribe to the
                // full, outer signal or the atom itself.
                ([eventName]) =>
                  eventName !== 'mutate' && eventName in (signal as Signal).E!
              )
            )

          ;(signal as Signal).set(value, relevantEvents)
        }
      }

      // if this wrapper signal hasn't been scheduled at this point, no inner
      // signals were updated. Either `set` was called with a different object
      // reference (making `this.N` undefined and this whole call a noop) or
      // `this.N` will contain one or more updates for non-signal inner values.
      if (!this.w && this.N) {
        if (this.e.syncScheduler.I) {
          // inner signals have updates, but they're deferred. Defer here too
          this.e.syncScheduler.i(() => this.j())
        } else {
          // No need to involve the scheduler. Update own state now.
          this.j()
        }
      }
    } finally {
      schedulerPost(this.e)
    }
  }

  /**
   * @see Signal.j
   */
  public j() {
    // Inner signal(s) or values changed. Propagate the change(s) to this
    // wrapper signal and its observers. Use `super.set` for this 'cause
    // `this.set` intercepts set calls and forwards them the other way - to the
    // inner signals
    super.set(
      this.N,
      this.C ?? (this.b && ({ mutate: this.b } as Partial<SendableEvents<G>>))
    )
    this.w = this.wt = this.C = this.N = this.b = undefined
  }

  /**
   * @see Signal.r
   */
  public r(reason: InternalEvaluationReason) {
    if (reason.t !== EventSent) {
      super.r(reason)

      if (reason.s) {
        this.N ??= { ...this.v }

        this.N![this.I[reason.s.id]] = reason.s.v

        // handle the `mutate` event specifically - add the inner node's key to
        // all transaction `k`ey paths
        if (!this.C && reason.e?.mutate) {
          this.b ??= []

          const key = this.I[reason.s.id]

          this.b.push(
            ...(reason.e.mutate as Transaction[]).map(transaction => ({
              ...transaction,
              k: Array.isArray(transaction.k)
                ? [key, ...transaction.k]
                : [key, transaction.k],
            }))
          )
        }
      }
    }

    // forward events from wrapped signals to observers of this wrapper signal.
    // Use `super.send` for this 'cause `this.send` intercepts events and passes
    // them the other way (up to wrapped signals)
    if (reason.e && (!reason.e.mutate || Object.keys(reason.e).length > 1)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { mutate, ...events } = reason.e

      super.send(events as Partial<G['Events']>)
    }
  }

  public u(map: SignalMap) {
    const entries = Object.entries(map)

    const prevNode = this.e.cs(this)

    // `get` every signal and auto-add each one as a source of the mapped signal
    const edgeConfig = { f: TopPrio }

    // we shouldn't need try..catch here - no user code can run when getting
    // these already-defined nodes
    if (this.l === INITIALIZING) {
      this.v = Object.fromEntries(
        entries.map(([key, val]) => {
          if (!(val as Signal | undefined)?.izn) return [key, val as any]

          // flatten all events from all inner signals into the mapped signal's
          // events list
          Object.assign(this.E!, (val as Signal).E)
          this.I[(val as Signal).id] = key

          return [key, (val as Signal).get(edgeConfig)]
        })
      )

      setNodeStatus(this, ACTIVE)
    } else {
      for (const [key, val] of entries) {
        if ((val as Signal).izn) {
          // make sure the edge is re-created
          ;(val as Signal).get(edgeConfig)

          // update the (forward) map and reverse map
          this.M[key] = val as Signal
          this.I[(val as Signal).id] = key
        }
      }
    }

    flushBuffer(prevNode)
  }
}
