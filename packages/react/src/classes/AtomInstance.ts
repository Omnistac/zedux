import {
  ActionChain,
  metaTypes,
  Observable,
  Selector,
  Settable,
  Subscription,
} from '@zedux/core'
import {
  ActiveState,
  AtomInstanceType,
  AtomParamsType,
  AtomSelector,
  AtomSelectorOrConfig,
  AtomStateType,
  AtomValue,
  PromiseStatus,
  Ref,
  StateType,
} from '@zedux/react/types'
import {
  Dep,
  DependentEdge,
  EvaluationReason,
  EvaluationTargetType,
  EvaluationType,
  generateAtomSelectorId,
  GraphEdgeDynamicity,
  GraphEdgeInfo,
  InjectorDescriptor,
  InjectorType,
  is,
  JobType,
} from '@zedux/react/utils'
import { diContext } from '@zedux/react/utils/csContexts'
import { Atom } from './atoms/Atom'
import { Ecosystem } from './Ecosystem'
import { createStore, isZeduxStore, Store } from '@zedux/core'
import { AtomApi } from './AtomApi'
import { AtomInstanceBase } from './instances/AtomInstanceBase'
import { StandardAtomBase } from './atoms/StandardAtomBase'
import { runAtomSelector } from '../utils/runAtomSelector'

interface AtomSelectorCache {
  id: string
  prevArgs: Ref<any[] | undefined>
  prevDeps: Ref<Record<string, Dep>>
  prevResult: Ref<any>
}

const SELECT_OPERATION = 'select'

const cleanupAtomSelector = (selectorCache: AtomSelectorCache) => {
  if (!Object.keys(selectorCache.prevDeps.current).length) return

  Object.values(selectorCache.prevDeps.current).forEach(dep => {
    dep.cleanup?.()
  })
}

const getEdgeDynamicity = (edge: DependentEdge) => {
  if (edge.isStatic) return GraphEdgeDynamicity.Static
  if (edge.cache) return GraphEdgeDynamicity.RestrictedDynamic

  return GraphEdgeDynamicity.Dynamic
}

const getStateType = (val: any) => {
  if (isZeduxStore(val)) return StateType.Store

  return StateType.Value
}

const getStateStore = <State extends any = any>(
  factoryResult: AtomValue<State>
) => {
  const stateType = getStateType(factoryResult)

  const stateStore =
    stateType === StateType.Store
      ? (factoryResult as Store<State>)
      : createStore<State>()

  // define how we populate our store (doesn't apply to user-supplied stores)
  if (stateType === StateType.Value) {
    stateStore.setState(
      typeof factoryResult === 'function'
        ? () => factoryResult as State
        : (factoryResult as State)
    )
  }

  return [stateType, stateStore] as const
}

export class AtomInstance<
  State,
  Params extends any[],
  Exports extends Record<string, any>
> extends AtomInstanceBase<
  State,
  Params,
  StandardAtomBase<State, Params, Exports>
> {
  public api?: AtomApi<State, Exports>
  public exports: Exports
  public promise?: Promise<any>
  public store: Store<State>

  public _activeState = ActiveState.Initializing
  public _cancelDestruction?: () => void
  public _evaluationReasons: EvaluationReason[] = [] // TODO: Maybe make this undefined in prod and don't use
  public _injectors?: InjectorDescriptor[]
  public _isEvaluating = false
  public _promiseError?: Error
  public _promiseStatus?: PromiseStatus
  public _stateType?: StateType

  private _atomSelectorCache?: Map<AtomSelector, AtomSelectorCache>
  private _atomSelectorsToCache?: Map<AtomSelector, AtomSelectorCache>
  private _edgesToAdd?: Record<string, GraphEdgeInfo>
  private _subscription?: Subscription

  constructor(
    public readonly ecosystem: Ecosystem,
    public readonly atom: Atom<State, Params, Exports>,
    public readonly keyHash: string,
    public readonly params: Params
  ) {
    super()
    const factoryResult = this._doEvaluate()

    ;[this._stateType, this.store] = getStateStore(factoryResult)

    this._subscription = this.store.subscribe((newState, oldState, action) => {
      if (action.meta === metaTypes.SKIP_EVALUATION) return

      ecosystem._graph.scheduleDependents(
        keyHash,
        this._evaluationReasons,
        newState,
        oldState
      )
    })

    if (!this.promise && this._shouldForwardPromise()) this._forwardPromises()

    // lol
    this.exports = (this as any).exports || undefined
    this._promiseStatus = (this as any)._promiseStatus ?? PromiseStatus.Resolved

    this._activeState = ActiveState.Active
  }

  public dispatch = (action: ActionChain) => {
    const val = this.api?.dispatchInterceptors?.length
      ? this.api._interceptDispatch(action, (newAction: ActionChain) =>
          this.store.dispatch(newAction)
        )
      : this.store.dispatch(action)

    this.ecosystem._scheduler.flush()
    return val
  }

  public setState = (settable: Settable<State>, meta?: any) => {
    const val = this.api?.setStateInterceptors?.length
      ? this.api._interceptSetState(settable, (newSettable: Settable<State>) =>
          this.store.setState(newSettable, meta)
        )
      : this.store.setState(settable, meta)

    this.ecosystem._scheduler.flush()
    return val
  }

  // handle detaching this atom instance from the global store and all destruction stuff
  public _destroy(force?: boolean) {
    if (this._activeState === ActiveState.Destroyed) return

    // If we're not force-destroying, don't destroy if there are dependents
    if (
      !force &&
      Object.keys(this.ecosystem._graph.nodes[this.keyHash]?.dependents || {})
        .length
    ) {
      return
    }

    // TODO: dispatch an action over stateStore for this mutation
    this._activeState = ActiveState.Destroyed

    if (this._evaluationReasons.length) {
      this.ecosystem._scheduler.unscheduleJob(this.evaluationTask)
    }

    // Clean up effect injectors first, then everything else
    const nonEffectInjectors: InjectorDescriptor[] = []
    this._injectors?.forEach(injector => {
      if (injector.type !== InjectorType.Effect) {
        nonEffectInjectors.push(injector)
        return
      }
      injector.cleanup?.()
    })
    nonEffectInjectors.forEach(injector => {
      injector.cleanup?.()
    })

    // Clean up cached AtomSelectors - normal selectors don't have anything to
    // clean up since their cached value should be garbage collected when the
    // graph edge with its `cache` goes out of scope
    this._atomSelectorCache?.forEach(cleanupAtomSelector)
    this.ecosystem._graph.removeDependencies(this.keyHash)

    this._subscription?.unsubscribe()
    this.ecosystem._destroyAtomInstance(this.keyHash)
  }

  /**
   * A standard atom's value can be one of:
   *
   * - A raw value
   * - A Zedux store
   * - An AtomApi
   * - A function that returns a raw value
   * - A function that returns a Zedux store
   * - A function that returns an AtomApi
   */
  public _evaluate() {
    const { _value } = this.atom

    if (is(_value, AtomApi)) {
      const asAtomApi = _value as AtomApi<State, Exports>
      this.api = asAtomApi
      return asAtomApi.value
    }

    if (typeof _value !== 'function') {
      return _value as AtomValue<State>
    }

    try {
      const val = (_value as (
        ...params: Params
      ) => AtomValue<State> | AtomApi<State, Exports>)(...this.params)

      if (is(val, AtomApi)) {
        this.api = val as AtomApi<State, Exports>

        // Exports can only be set on initial evaluation
        if (this._activeState === ActiveState.Initializing) {
          this.exports = this.api.exports as Exports

          if (this.api.promise) this._setPromise(this.api.promise)
        }

        return this.api.value
      }

      return val as AtomValue<State>
    } catch (err) {
      console.error(
        `Zedux - Error while instantiating atom "${this.atom.key}" with params:`,
        this.params,
        err
      )

      throw err
    }
  }

  public _get<A extends StandardAtomBase<any, [...any], any>>(
    atomOrInstance: A | AtomInstanceBase<any, [], any>,
    params?: AtomParamsType<A>
  ): A extends StandardAtomBase<infer T, any, any> ? T : never {
    // TODO: check if the instance exists so we know if we create it here so we
    // can destroy it if the evaluate call errors (to prevent that memory leak)
    const instance = this.ecosystem.getInstance(
      atomOrInstance as A,
      params as AtomParamsType<A>
    )

    // when called outside evaluation, instance._get() is just an alias
    // for ecosystem.getInstance().store.getState()
    if (!this._isEvaluating) return instance.store.getState()

    // if get is called during evaluation, track the loaded instances so we can
    // add graph dependencies for them
    if (!this._edgesToAdd) {
      this._edgesToAdd = {}
    }

    // we could add more flags on this enum to indicate whether we created the
    // instance in this call
    this._edgesToAdd[instance.keyHash] = [GraphEdgeDynamicity.Dynamic, 'get']

    return instance.store.getState()
  }

  public _getInstance<A extends Atom<any, [...any], any>>(
    atomOrInstance: A | AtomInstanceType<A>,
    params?: AtomParamsType<A>,
    edgeInfo?: GraphEdgeInfo
  ): AtomInstanceType<A> {
    // TODO: check if the instance exists so we know if we create it here so we
    // can destroy it if the evaluate call errors (to prevent that memory leak)
    const instance = this.ecosystem.getInstance(
      atomOrInstance as A,
      params as AtomParamsType<A>
    )

    // when called outside evaluation, instance._getInstance() is just an alias
    // for ecosystem.getInstance()
    if (!this._isEvaluating) return instance

    // if getInstance is called during evaluation, track the loaded instances so
    // we can add graph dependencies for them

    // if we've already registered a dynamic edge, don't make it static
    const existingDynamicity = this._edgesToAdd?.[instance.keyHash]?.[0]
    if (
      existingDynamicity &&
      existingDynamicity !== GraphEdgeDynamicity.Static
    ) {
      return instance
    }

    if (!this._edgesToAdd) {
      this._edgesToAdd = {}
    }

    // we could add more flags on this enum to indicate whether we created the
    // instance in this call
    this._edgesToAdd[instance.keyHash] = edgeInfo || [
      GraphEdgeDynamicity.Static,
      'getInstance',
    ]

    return instance as AtomInstanceType<A>
  }

  /**
   * When a standard atom instance's refCount hits 0 and a ttl is set, we set a
   * timeout to destroy this atom instance.
   */
  public _scheduleDestruction() {
    // the atom is already be scheduled for destruction or destroyed
    if (this._activeState !== ActiveState.Active) return

    this._activeState = ActiveState.Stale
    const { maxInstances } = this.atom

    if (maxInstances != null) {
      if (maxInstances === 0) return this._destroy()

      const currentCount = this.ecosystem.findInstances(this.atom).length

      if (currentCount > maxInstances) return this._destroy()
    }

    const ttl = this._getTtl()
    if (ttl == null || ttl === -1) return
    if (ttl === 0) return this._destroy()

    if (typeof ttl === 'number') {
      // ttl is > 0; schedule destruction
      const timeoutId = setTimeout(() => this._destroy(), ttl)

      // TODO: dispatch an action over stateStore for these mutations
      this._cancelDestruction = () => clearTimeout(timeoutId)

      return
    }

    if (typeof (ttl as Promise<any>).then === 'function') {
      let isCanceled = false
      ;(ttl as Promise<any>).then(() => {
        if (!isCanceled) this._destroy()
      })

      this._cancelDestruction = () => {
        isCanceled = true
      }

      return
    }

    // ttl is an observable; destroy as soon as it emits
    const subscription = (ttl as Observable).subscribe(() => this._destroy())

    this._cancelDestruction = () => subscription.unsubscribe()
  }

  public _scheduleEvaluation = (reason: EvaluationReason, flagScore = 0) => {
    // TODO: Any calls in this case probably indicate a memory leak on the
    // user's part. Notify them. TODO: Can we pause evaluations while
    // activeState is Stale (and should we just always evaluate once when
    // waking up a stale atom)?
    if (this._activeState === ActiveState.Destroyed) return

    if (this._evaluationReasons.length) {
      this._evaluationReasons.push(reason)
      return
    }

    // TODO: maybe we should keep previous evaluation reasons around until the
    // task runs? Or move _evaluationReasons to _previousEvaluationReasons when
    // the evaluation task finishes? Just feels odd suddenly overwriting them
    // here.
    this._evaluationReasons = [reason]

    this.ecosystem._scheduler.scheduleJob({
      flagScore,
      keyHash: this.keyHash,
      task: this.evaluationTask,
      type: JobType.EvaluateAtom,
    })
  }

  public _select<A extends Atom<any, [...any], any>, D>(
    atomOrInstanceOrSelector:
      | A
      | AtomInstanceType<A>
      | AtomSelectorOrConfig<D, any>,
    paramsOrSelector?: AtomParamsType<A> | Selector<any, D>,
    selector?: Selector<AtomStateType<A>>,
    ...rest: any[]
  ): D {
    // AtomSelectors are remembered across evaluations by reference.
    // Other selectors are remembered by [atomInstance, fnRef] tuple.
    if (
      typeof atomOrInstanceOrSelector === 'function' ||
      'selector' in atomOrInstanceOrSelector
    ) {
      const resolvedSelector =
        typeof atomOrInstanceOrSelector === 'function'
          ? atomOrInstanceOrSelector
          : atomOrInstanceOrSelector.selector

      const args = [paramsOrSelector, selector, ...rest]

      if (!this._atomSelectorsToCache) {
        this._atomSelectorsToCache = new Map()
      }

      // look in the current run's cache first (in case we've already copied the
      // old cache object over or already created one for this exact selector
      // this run), then the previous run
      let cache = this._atomSelectorsToCache.get(resolvedSelector)

      if (!cache) {
        cache = this._atomSelectorCache?.get(resolvedSelector)

        if (cache) {
          this._atomSelectorsToCache.set(resolvedSelector, cache)
        }
      }

      if (!cache) {
        // no cache has been created for this AtomSelector yet
        cache = {
          id: `${this.keyHash}-${generateAtomSelectorId()}`,
          prevArgs: { current: undefined },
          prevDeps: { current: {} },
          prevResult: { current: undefined },
        }
      }

      this._atomSelectorsToCache.set(resolvedSelector, cache)

      // have to update this value since this code never runs again as long as
      // the AtomSelector is cached
      let cachedPrevResult = cache.prevResult.current

      const result = runAtomSelector(
        atomOrInstanceOrSelector,
        args,
        this.ecosystem,
        cache.prevArgs,
        cache.prevDeps,
        cache.prevResult,
        { current: resolvedSelector },
        reasons => {
          this._scheduleEvaluation({
            newState: cache?.prevResult.current, // runAtomSelector updates this ref before calling this callback
            oldState: cachedPrevResult,
            operation: SELECT_OPERATION,
            reasons,
            targetType: EvaluationTargetType.Injector,
            type: EvaluationType.StateChanged,
          })

          cachedPrevResult = cache?.prevResult.current
        },
        SELECT_OPERATION,
        cache.id,
        !!cache.prevArgs.current // allow run to short-circuit if this isn't the first run
      )

      cache.prevResult.current = result

      return result
    }

    const params = Array.isArray(paramsOrSelector)
      ? paramsOrSelector
      : undefined

    const resolvedSelector =
      typeof paramsOrSelector === 'function'
        ? paramsOrSelector
        : (selector as Selector<AtomStateType<A>>)

    // TODO: check if the instance exists so we know if we create it here so we
    // can destroy it if the evaluate call errors (to prevent that memory leak)
    const instance = this.ecosystem.getInstance(
      atomOrInstanceOrSelector as A,
      params as AtomParamsType<A>
    )

    // when called outside evaluation, instance._select() is just an alias for
    // ecosystem.select()
    if (!this._isEvaluating) return resolvedSelector(instance.store.getState())

    // if we've already registered a dynamic edge, don't make it restricted
    const existingEdge = this._edgesToAdd?.[instance.keyHash]
    if (existingEdge && existingEdge[0] === GraphEdgeDynamicity.Dynamic) {
      return resolvedSelector(instance.store.getState())
    }

    // look in the current run's cache first (in case we've already copied the
    // old cache object over or already created one for this exact selector
    // this run), then the previous run
    let cache = existingEdge?.[2]?.get(resolvedSelector)

    if (cache) {
      return cache.prevResult
    }

    // if select is called during evaluation, track the loaded instances so we
    // can add graph dependencies for them
    if (!this._edgesToAdd) {
      this._edgesToAdd = {}
    }

    if (!this._edgesToAdd[instance.keyHash]) {
      // we could add more flags on this enum to indicate whether we created the
      // instance in this call. TODO: All logic around RestrictedDynamic could
      // just die if we removed the [atom, selectorFn], [instance, selectorFn],
      // and [atom, params, selectorFn] select overloads (AtomSelectors cover
      // all of them anyway). Sounds amazing.
      this._edgesToAdd[instance.keyHash] = [
        GraphEdgeDynamicity.RestrictedDynamic,
        'select',
        new Map(),
      ]
    }

    // reuse the old cache object
    cache = this.ecosystem._graph.nodes?.[instance.keyHash]?.dependents[
      this.keyHash
    ]?.cache?.get(resolvedSelector)

    if (!cache) {
      const shouldUpdate = (state: AtomStateType<A>) => {
        const newResult = resolvedSelector(state)

        if (!cache || newResult === cache.prevResult) return false

        cache.prevResult = newResult
        return true
      }

      cache = {
        prevResult: resolvedSelector(instance.store.getState()),
        shouldUpdate,
      }
    }

    this._edgesToAdd[instance.keyHash][2]?.set(resolvedSelector, cache)

    return cache.prevResult
  }

  // create small, memory-efficient bound function properties we can pass around
  public invalidate = () => this._invalidate()
  private evaluate = () => this._evaluate()
  private evaluationTask = () => this._evaluationTask()

  private _doEvaluate(): AtomValue<State> {
    const newInjectors: InjectorDescriptor[] = []
    let newFactoryResult: AtomValue<State>
    this._isEvaluating = true

    try {
      newFactoryResult = diContext.provide(
        {
          injectors: newInjectors,
          instance: this,
        },
        this.evaluate
      )
    } catch (err) {
      newInjectors.forEach(injector => {
        injector.cleanup?.()
      })
      throw err
    } finally {
      this._isEvaluating = false

      if (this._activeState !== ActiveState.Initializing) {
        this._evaluationReasons = []
      }
    }

    this._injectors = newInjectors // TODO: dispatch an action over stateStore for this mutation
    this._updateEdges()

    return newFactoryResult
  }

  private _evaluationTask() {
    const newFactoryResult = this._doEvaluate()

    const newStateType = getStateType(newFactoryResult)

    if (newStateType !== this._stateType) {
      throw new Error(
        `Zedux Error - atom factory for atom "${this.atom.key}" returned a different type than the previous evaluation. This can happen if the atom returned a store initially but then returned a non-store value on a later evaluation or vice versa`
      )
    }

    if (newStateType === StateType.Store && newFactoryResult !== this.store) {
      throw new Error(
        `Zedux Error - atom factory for atom "${this.atom.key}" returned a different store. Did you mean to use \`injectState()\`, \`injectStore()\`, or \`injectMemo()\`?`
      )
    }

    // I believe there is no way to cause an evaluation loop when the StateType is Value
    if (newStateType === StateType.Value) {
      this.store.setState(
        typeof newFactoryResult === 'function'
          ? () => newFactoryResult as State
          : (newFactoryResult as State)
      )
    }
  }

  private _forwardPromises() {
    const promises = Object.keys(
      this.ecosystem._graph.nodes[this.keyHash].dependencies
    )
      .map(keyHash => this.ecosystem._instances[keyHash].promise)
      .filter(Boolean) as Promise<any>[]

    if (!promises.length) return

    this._setPromise(Promise.all(promises))
  }

  private _getTtl() {
    if (this.api?.ttl == null) {
      return this.atom.ttl != null ? this.atom.ttl : this.ecosystem.defaultTtl
    }

    // this atom instance set its own ttl
    const { ttl } = this.api

    return typeof ttl === 'function' ? ttl() : ttl
  }

  private _invalidate() {
    this._scheduleEvaluation({
      operation: 'invalidate',
      targetType: EvaluationTargetType.External,
      type: EvaluationType.CacheInvalidated,
    })
  }

  private _setPromise(promise: Promise<any>) {
    this.promise = promise
    this._promiseStatus = PromiseStatus.Pending

    promise
      .then(() => {
        this._promiseStatus = PromiseStatus.Resolved
      })
      .catch(err => {
        this._promiseStatus = PromiseStatus.Rejected
        this._promiseError = err
      })
  }

  private _shouldForwardPromise() {
    return this.atom.forwardPromises != null
      ? this.atom.forwardPromises
      : this.ecosystem.defaultForwardPromises
  }

  private _updateEdges() {
    const edges = this.ecosystem._graph.nodes[this.keyHash].dependencies
    const edgesToAdd = this._edgesToAdd

    // remove any edges that were not recreated this evaluation
    if (edges) {
      Object.keys(edges).forEach(dependencyKey => {
        const existingEdge = this.ecosystem._graph.nodes[dependencyKey]
          .dependents[this.keyHash]

        const edgeToAdd = edgesToAdd?.[dependencyKey]
        const existingEdgeDynamicity = getEdgeDynamicity(existingEdge)

        if (edgeToAdd && edgeToAdd[0] === existingEdgeDynamicity) return

        this.ecosystem._graph.removeDependency(this.keyHash, dependencyKey)
      })
    }

    // add new edges that were added this evaluation
    if (edgesToAdd) {
      Object.keys(edgesToAdd).forEach(dependencyKey => {
        const edgeToAdd = edgesToAdd[dependencyKey]
        const existingEdge = edges?.[dependencyKey]

        if (existingEdge) {
          return
        }

        const edge = this.ecosystem._graph.addDependency(
          this.keyHash,
          dependencyKey,
          edgeToAdd[1],
          edgeToAdd[0] === GraphEdgeDynamicity.Static,
          false,
          edgeToAdd[0] === GraphEdgeDynamicity.RestrictedDynamic
            ? state =>
                [...(edgeToAdd[2]?.values() || [])].some(cache =>
                  cache.shouldUpdate(state)
                )
            : undefined
        )

        if (edgeToAdd[2]) edge.cache = edgeToAdd[2]
      })
    }

    // clean up any AtomSelectors that weren't run again this evaluation
    this._atomSelectorCache?.forEach((cache, selector) => {
      if (this._atomSelectorsToCache?.has(selector)) return

      cleanupAtomSelector(cache)
    })

    this._atomSelectorCache = this._atomSelectorsToCache
    this._atomSelectorsToCache = undefined
    this._edgesToAdd = undefined
  }
}
