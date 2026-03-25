import {
  GraphEdge,
  Job,
  Mutatable,
  NodeGenerics,
  SendableEvents,
  Settable,
  Transaction,
} from '../types/index'
import {
  destroyNodeFinish,
  destroyNodeStart,
  initializeNode,
} from '../utils/graph'
import { Ecosystem } from './Ecosystem'
import { ZeduxNode } from './ZeduxNode'
import {
  isMutatable,
  recursivelyMutate,
  recursivelyProxy,
} from './proxies'
import { getEvaluationContext } from '../utils/evaluationContext'
import { schedulerPost, schedulerPre } from '../utils/ecosystem'

/**
 * Drain local jobs from the scheduler's sorted job queue. Iterates the
 * scheduler's `j` array (which is already sorted by type and weight via
 * `schedule()`), finds jobs owned by the evaluating atom, splices them out
 * and runs them. Recursive signal sets are handled naturally via the `lf`
 * counter on the owning atom.
 */
const flushLocalJobs = (
  scheduler: { j: Job[]; r: number },
  owner: ZeduxNode
) => {
  const { j } = scheduler
  let i = scheduler.r

  while (i < j.length) {
    if ((j[i] as any).O === owner) {
      const [job] = j.splice(i, 1)
      job.j()
      // Restart from scheduler.r - splice shifted indices and job.j() may
      // have inserted new local jobs via schedule()
      i = scheduler.r
    } else {
      i++
    }
  }
}

export const doMutate = <G extends NodeGenerics>(
  node: Signal<G>,
  isWrapperSignal: boolean,
  mutatable: Mutatable<G['State']>,
  events?: Partial<SendableEvents<G>>
) => {
  const { n } = getEvaluationContext()

  if (n) {
    // local signal - bypass deferral, proceed with mutation below
    if (node.O !== n) {
      // external signal - defer
      node.e.syncScheduler.i(() => node.mutate(mutatable, events))

      return
    }
  }

  const oldState = node.v

  if (oldState == null) {
    const newState =
      typeof mutatable === 'function'
        ? (mutatable as (state: G['State']) => any)(oldState)
        : mutatable

    const transactions: Transaction[] = []

    if (Array.isArray(newState)) {
      transactions.push({ k: [], v: newState })
    } else if (isMutatable(newState)) {
      const empty = (
        newState instanceof Set ? new Set() : {}
      ) as G['State']

      recursivelyMutate(
        recursivelyProxy(empty, { t: transactions, u: () => {} }).p,
        newState
      )
    }

    node.set(
      newState as Settable<G['State']>,
      {
        ...events,
        mutate: transactions,
      } as Partial<SendableEvents<G>>
    )

    return
  }

  if (!isMutatable(oldState)) {
    const newState =
      typeof mutatable === 'function'
        ? (mutatable as (state: G['State']) => any)(oldState)
        : mutatable

    node.set(newState as Settable<G['State']>, {
      ...events,
      mutate: [],
    } as Partial<SendableEvents<G>>)

    return
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

    // if the callback function doesn't return void and no proxy mutations
    // were made, apply the return value: mutatable values are recursively
    // applied as mutations; non-mutatable values (primitives, class instances,
    // etc.) are set as the entire new state.
    if (!transactions.length && result !== undefined) {
      if (Array.isArray(result)) {
        newState = result
        transactions.push({ k: [], v: result })
      } else if (isMutatable(result)) {
        recursivelyMutate(proxyWrapper.p, result)
      } else {
        node.set(result as Settable<G['State']>, {
          ...events,
          mutate: [],
        } as Partial<SendableEvents<G>>)

        return
      }
    }
  } else if (Array.isArray(mutatable)) {
    newState = mutatable as G['State']
    transactions.push({ k: [], v: mutatable })
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
      const mutateEvents = {
        ...events,
        mutate: transactions,
      } as Partial<SendableEvents<G>>

      node.v = newState

      if (n && node.O === n) {
        // local non-wrapper signal during evaluation - flush locally
        ;(n as any).lf++
        node.e.ch(node, oldState, mutateEvents)

        if (--(n as any).lf === 0) {
          flushLocalJobs(node.e.syncScheduler, n)
        }
      } else {
        schedulerPre(node.e)
        node.e.ch(node, oldState, mutateEvents)
        schedulerPost(node.e)
      }
    }
  }
}

export class Signal<
  G extends NodeGenerics = {
    Events: any
    Params: undefined
    State: any
    Template: undefined
  }
> extends ZeduxNode<G> {
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

  /**
   * `O`wner - the atom instance that created this signal via `injectSignal` or
   * `injectMappedSignal`. Used to identify "local" signals whose state updates
   * should propagate immediately during the owning atom's evaluation.
   */
  public O: ZeduxNode | undefined = undefined

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

    deferActiveStatus || initializeNode(this)
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
    const { n } = getEvaluationContext()

    if (n) {
      if (this.O === n) {
        // local signal - set state immediately and flush through local graph
        const oldState = this.v
        const newState = (this.v =
          typeof settable === 'function'
            ? (settable as (state: G['State']) => G['State'])(oldState)
            : settable)

        if (newState !== oldState) {
          ;(n as any).lf++
          this.e.ch(this, oldState, events)

          if (--(n as any).lf === 0) {
            flushLocalJobs(this.e.syncScheduler, n)
          }
        }

        return
      }

      // external signal during evaluation - defer
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
