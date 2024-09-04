import {
  ActionChain,
  createStore,
  Dispatchable,
  zeduxTypes,
  is,
  Observable,
  RecursivePartial,
  Settable,
  Store,
  Subscription,
} from '@zedux/core'
import {
  AtomGenerics,
  AtomGenericsToAtomApiGenerics,
  Cleanup,
  EvaluationReason,
  EvaluationSourceType,
  ExportsInfusedSetter,
  LifecycleStatus,
  PromiseState,
  PromiseStatus,
  DehydrationFilter,
  NodeFilter,
  DehydrationOptions,
  AnyAtomGenerics,
} from '@zedux/atoms/types/index'
import { prefix } from '@zedux/atoms/utils/general'
import { pluginActions } from '@zedux/atoms/utils/plugin-actions'
import {
  getErrorPromiseState,
  getInitialPromiseState,
  getSuccessPromiseState,
} from '@zedux/atoms/utils/promiseUtils'
import { InjectorDescriptor } from '@zedux/atoms/utils/types'
import { Ecosystem } from '../Ecosystem'
import { AtomApi } from '../AtomApi'
import { AtomTemplateBase } from '../templates/AtomTemplateBase'
import {
  destroyNodeFinish,
  destroyNodeStart,
  GraphNode,
  normalizeNodeFilter,
  scheduleDependents,
} from '../GraphNode'
import {
  destroyBuffer,
  flushBuffer,
  getEvaluationContext,
  startBuffer,
} from '@zedux/atoms/utils/evaluationContext'

const StoreState = 1
const RawState = 2

const getStateType = (val: any) => {
  if (is(val, Store)) return StoreState

  return RawState
}

const getStateStore = <
  State = any,
  StoreType extends Store<State> = Store<State>,
  P extends State | StoreType = State | StoreType
>(
  factoryResult: P
) => {
  const stateType = getStateType(factoryResult)

  const stateStore =
    stateType === StoreState
      ? (factoryResult as unknown as StoreType)
      : (createStore<State>() as StoreType)

  // define how we populate our store (doesn't apply to user-supplied stores)
  if (stateType === RawState) {
    stateStore.setState(
      typeof factoryResult === 'function'
        ? () => factoryResult as State
        : (factoryResult as unknown as State)
    )
  }

  return [stateType, stateStore] as const
}

export class AtomInstance<
  G extends Omit<AtomGenerics, 'Node' | 'Template'> & {
    Template: AtomTemplateBase<G & { Node: any }>
  } = AnyAtomGenerics<{
    Node: any
  }>
> extends GraphNode<G> {
  public static $$typeof = Symbol.for(`${prefix}/AtomInstance`)
  public l: LifecycleStatus = 'Initializing'

  public api?: AtomApi<AtomGenericsToAtomApiGenerics<G>>

  // @ts-expect-error this is set in `this.i`nit, right after instantiation, so
  // it technically isn't set during construction. It's fine.
  public exports: G['Exports']

  // @ts-expect-error same as exports
  public promise: G['Promise']

  // @ts-expect-error same as exports
  public store: G['Store']

  /**
   * @see GraphNode.c
   */
  public c?: Cleanup
  public _createdAt: number
  public _injectors?: InjectorDescriptor[]
  public _isEvaluating?: boolean
  public _nextInjectors?: InjectorDescriptor[]
  public _promiseError?: Error
  public _promiseStatus?: PromiseStatus
  public _stateType?: typeof StoreState | typeof RawState

  private _bufferedUpdate?: {
    newState: G['State']
    oldState?: G['State']
    action: ActionChain
  }
  private _subscription?: Subscription

  constructor(
    /**
     * @see GraphNode.e
     */
    public readonly e: Ecosystem,
    /**
     * @see GraphNode.t
     */
    public readonly t: G['Template'],
    /**
     * @see GraphNode.id
     */
    public readonly id: string,
    /**
     * @see GraphNode.p
     */
    public readonly p: G['Params']
  ) {
    super()
    this._createdAt = e._idGenerator.now()
  }

  /**
   * @see GraphNode.destroy
   */
  public destroy(force?: boolean) {
    if (!destroyNodeStart(this, force)) return

    // Clean up effect injectors first, then everything else
    const nonEffectInjectors: InjectorDescriptor[] = []
    this._injectors?.forEach(injector => {
      if (injector.type !== '@@zedux/effect') {
        nonEffectInjectors.push(injector)
        return
      }
      injector.cleanup?.()
    })
    nonEffectInjectors.forEach(injector => {
      injector.cleanup?.()
    })
    this._subscription?.unsubscribe()

    destroyNodeFinish(this)
  }

  /**
   * An alias for `.store.dispatch()`
   */
  public dispatch = (action: Dispatchable) => this.store.dispatch(action)

  /**
   * An alias for `instance.store.getState()`. Returns the current state of this
   * atom instance's store.
   *
   * @deprecated - use `instance.get()` instead
   */
  public getState(): G['State'] {
    return this.store.getState()
  }

  /**
   * @see GraphNode.get
   *
   * An alias for `instance.store.getState()`.
   */
  public get() {
    return this.store.getState()
  }

  /**
   * Force this atom instance to reevaluate.
   */
  public invalidate(
    operation = 'invalidate',
    sourceType: EvaluationSourceType = 'External'
  ) {
    this.r(
      {
        operation,
        sourceType,
        type: 'cache invalidated',
      },
      false
    )

    // run the scheduler synchronously after invalidation
    this.e._scheduler.flush()
  }

  /**
   * An alias for `.store.setState()`
   */
  public setState = (settable: Settable<G['State']>, meta?: any): G['State'] =>
    this.store.setState(settable, meta)

  /**
   * An alias for `.store.setStateDeep()`
   */
  public setStateDeep = (
    settable: Settable<RecursivePartial<G['State']>, G['State']>,
    meta?: any
  ): G['State'] => this.store.setStateDeep(settable, meta)

  /**
   * @see GraphNode.d
   */
  public d(options?: DehydrationFilter) {
    if (!this.f(options)) return

    const { t } = this
    const state = this.get()
    const transform =
      (typeof options === 'object' &&
        !is(options, AtomTemplateBase) &&
        (options as DehydrationOptions).transform) ??
      true

    return transform && t.dehydrate ? t.dehydrate(state) : state
  }

  /**
   * @see GraphNode.f
   */
  public f(options?: NodeFilter) {
    const { id, t } = this
    const lowerCaseId = id.toLowerCase()
    const {
      exclude = [],
      excludeFlags = [],
      include = [],
      includeFlags = [],
    } = normalizeNodeFilter(options)

    if (
      exclude.some(templateOrKey =>
        typeof templateOrKey === 'string'
          ? lowerCaseId.includes(templateOrKey.toLowerCase())
          : is(templateOrKey, AtomTemplateBase) &&
            t.key === (templateOrKey as AtomTemplateBase).key
      ) ||
      excludeFlags.some(flag => t.flags?.includes(flag))
    ) {
      return false
    }

    if (
      (!include.length && !includeFlags.length) ||
      include.some(templateOrKey =>
        typeof templateOrKey === 'string'
          ? lowerCaseId.includes(templateOrKey.toLowerCase())
          : is(templateOrKey, AtomTemplateBase) &&
            t.key === (templateOrKey as AtomTemplateBase).key
      ) ||
      includeFlags.some(flag => t.flags?.includes(flag))
    ) {
      return true
    }

    return false
  }

  /**
   * @see GraphNode.h
   */
  public h(val: any) {
    this.setState(this.t.hydrate ? this.t.hydrate(val) : val)
  }

  /**
   * `i`nit - Perform the initial run of this atom's state factory. Create the
   * store, promise, exports, and hydrate (all optional except the store).
   */
  public i() {
    const { n, s } = getEvaluationContext()
    const factoryResult = this._doEvaluate()

    ;[this._stateType, this.store] = getStateStore(factoryResult)

    this._subscription = this.store.subscribe((newState, oldState, action) => {
      // buffer updates (with cache size of 1) if this instance is currently
      // evaluating
      if (this._isEvaluating) {
        this._bufferedUpdate = { newState, oldState, action }
        return
      }

      this._handleStateChange(newState, oldState, action)
    })

    this._setStatus('Active')
    flushBuffer(n, s)

    // hydrate if possible
    const hydration = this.e._consumeHydration(this)

    if (this.t.manualHydration || typeof hydration === 'undefined') {
      return
    }

    this.store.setState(hydration)
  }

  /**
   * @see GraphNode.j
   */
  public j() {
    this._evaluationTask()
  }

  /**
   * @see GraphNode.m
   */
  public m() {
    const ttl = this._getTtl()
    if (ttl === 0) return this.destroy()

    this._setStatus('Stale')
    if (ttl == null || ttl === -1) return

    if (typeof ttl === 'number') {
      // ttl is > 0; schedule destruction
      const timeoutId = setTimeout(() => {
        this.c = undefined
        this.destroy()
      }, ttl)

      // TODO: dispatch an action over stateStore for these mutations
      this.c = () => {
        this._setStatus('Active')
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
        this._setStatus('Active')
        this.c = undefined
        isCanceled = true
      }

      return
    }

    // ttl is an observable; destroy as soon as it emits
    const subscription = (ttl as Observable).subscribe(() => {
      this.c = undefined
      this.destroy()
    })

    this.c = () => {
      this._setStatus('Active')
      this.c = undefined
      subscription.unsubscribe()
    }
  }

  /**
   * @see GraphNode.r
   */
  public r(reason: EvaluationReason, shouldSetTimeout?: boolean) {
    // TODO: Any calls in this case probably indicate a memory leak on the
    // user's part. Notify them. TODO: Can we pause evaluations while
    // status is Stale (and should we just always evaluate once when
    // waking up a stale atom)?
    if (this.l !== 'Destroyed' && this.w.push(reason) === 1) {
      // refCount just hit 1; we haven't scheduled a job for this node yet
      this.e._scheduler.schedule(this, shouldSetTimeout)
    }
  }

  public _set?: ExportsInfusedSetter<G['State'], G['Exports']>
  public get _infusedSetter() {
    if (this._set) return this._set
    const setState: any = (settable: any, meta?: any) =>
      this.setState(settable, meta)

    return (this._set = Object.assign(setState, this.exports))
  }

  private _doEvaluate(): G['Store'] | G['State'] {
    const { n, s } = getEvaluationContext()
    this._nextInjectors = []
    let newFactoryResult: G['Store'] | G['State']
    this._isEvaluating = true
    startBuffer(this)

    try {
      newFactoryResult = this._evaluate()
    } catch (err) {
      this._nextInjectors.forEach(injector => {
        injector.cleanup?.()
      })

      destroyBuffer(n, s)

      throw err
    } finally {
      this._isEvaluating = false

      // even if evaluation errored, we need to update dependents if the store's
      // state changed
      if (this._bufferedUpdate) {
        this._handleStateChange(
          this._bufferedUpdate.newState,
          this._bufferedUpdate.oldState,
          this._bufferedUpdate.action
        )
        this._bufferedUpdate = undefined
      }

      this.w = []
    }

    this._injectors = this._nextInjectors

    if (this.l !== 'Initializing') {
      // let this.i flush updates after status is set to Active
      flushBuffer(n, s)
    }

    return newFactoryResult
  }

  /**
   * A standard atom's value can be one of:
   *
   * - A raw value
   * - A Zedux store
   * - A function that returns a raw value
   * - A function that returns a Zedux store
   * - A function that returns an AtomApi
   */
  private _evaluate() {
    const { _value } = this.t

    if (typeof _value !== 'function') {
      return _value
    }

    try {
      const val = (
        _value as (
          ...params: G['Params']
        ) => G['Store'] | G['State'] | AtomApi<AtomGenericsToAtomApiGenerics<G>>
      )(...this.p)

      if (!is(val, AtomApi)) return val as G['Store'] | G['State']

      const api = (this.api = val as AtomApi<AtomGenericsToAtomApiGenerics<G>>)

      // Exports can only be set on initial evaluation
      if (this.l === 'Initializing' && api.exports) {
        this.exports = api.exports
      }

      // if api.value is a promise, we ignore api.promise
      if (typeof (api.value as unknown as Promise<any>)?.then === 'function') {
        return this._setPromise(api.value as unknown as Promise<any>, true)
      } else if (api.promise) {
        this._setPromise(api.promise)
      }

      return api.value as G['Store'] | G['State']
    } catch (err) {
      console.error(
        `Zedux: Error while evaluating atom "${this.t.key}" with params:`,
        this.p,
        err
      )

      throw err
    }
  }

  private _evaluationTask() {
    const newFactoryResult = this._doEvaluate()

    const newStateType = getStateType(newFactoryResult)

    if (DEV && newStateType !== this._stateType) {
      throw new Error(
        `Zedux: atom factory for atom "${this.t.key}" returned a different type than the previous evaluation. This can happen if the atom returned a store initially but then returned a non-store value on a later evaluation or vice versa`
      )
    }

    if (DEV && newStateType === StoreState && newFactoryResult !== this.store) {
      throw new Error(
        `Zedux: atom factory for atom "${this.t.key}" returned a different store. Did you mean to use \`injectStore()\`, or \`injectMemo()\`?`
      )
    }

    // there is no way to cause an evaluation loop when the StateType is Value
    if (newStateType === RawState) {
      this.store.setState(
        typeof newFactoryResult === 'function'
          ? () => newFactoryResult as G['State']
          : (newFactoryResult as G['State'])
      )
    }
  }

  private _getTtl() {
    if (this.api?.ttl == null) {
      return this.t.ttl ?? this.e.atomDefaults?.ttl
    }

    // this atom instance set its own ttl
    const { ttl } = this.api

    return typeof ttl === 'function' ? ttl() : ttl
  }

  private _handleStateChange(
    newState: G['State'],
    oldState: G['State'] | undefined,
    action: ActionChain
  ) {
    scheduleDependents(this, newState, oldState, false)

    if (this.e._mods.stateChanged) {
      this.e.modBus.dispatch(
        pluginActions.stateChanged({
          action,
          node: this,
          newState,
          oldState,
          reasons: this.w,
        })
      )
    }

    // run the scheduler synchronously after any atom instance state update
    if (action.meta !== zeduxTypes.batch) {
      this.e._scheduler.flush()
    }
  }

  private _setStatus(newStatus: LifecycleStatus) {
    const oldStatus = this.l
    this.l = newStatus

    if (this.e._mods.statusChanged) {
      this.e.modBus.dispatch(
        pluginActions.statusChanged({
          newStatus,
          node: this,
          oldStatus,
        })
      )
    }
  }

  private _setPromise(promise: Promise<any>, isStateUpdater?: boolean) {
    const currentState = this.store?.getState()
    if (promise === this.promise) return currentState

    this.promise = promise as G['Promise']

    // since we're the first to chain off the returned promise, we don't need to
    // track the chained promise - it will run first, before React suspense's
    // `.then` on the thrown promise, for example
    promise
      .then(data => {
        if (this.promise !== promise) return

        this._promiseStatus = 'success'
        if (!isStateUpdater) return

        this.store.setState(
          getSuccessPromiseState(data) as unknown as G['State']
        )
      })
      .catch(error => {
        if (this.promise !== promise) return

        this._promiseStatus = 'error'
        this._promiseError = error
        if (!isStateUpdater) return

        this.store.setState(
          getErrorPromiseState(error) as unknown as G['State']
        )
      })

    const state: PromiseState<any> = getInitialPromiseState(currentState?.data)
    this._promiseStatus = state.status

    scheduleDependents(
      this,
      undefined,
      undefined,
      true,
      'promise changed',
      'Updated',
      true
    )

    return state as unknown as G['State']
  }
}
