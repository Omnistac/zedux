import {
  ActionChain,
  metaTypes,
  Observable,
  Settable,
  Subscription,
} from '@zedux/core'
import {
  ActiveState,
  AtomInstanceStateType,
  AtomInstanceType,
  AtomParamsType,
  AtomStateType,
  AtomValue,
  PromiseStatus,
  StateType,
} from '@zedux/react/types'
import {
  DependentEdge,
  EvaluationReason,
  EvaluationTargetType,
  EvaluationType,
  GraphEdgeDynamicity,
  GraphEdgeInfo,
  InjectorDescriptor,
  InjectorType,
  JobType,
} from '@zedux/react/utils'
import { diContext } from '@zedux/react/utils/csContexts'
import { Atom } from './atoms/Atom'
import { Ecosystem } from './Ecosystem'
import { createStore, isZeduxStore, Store } from '@zedux/core'
import { AtomApi } from './AtomApi'
import { AtomInstanceBase } from './instances/AtomInstanceBase'
import { StandardAtomBase } from './atoms/StandardAtomBase'
import { AtomBase } from './atoms/AtomBase'

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

  private _getKeyHashes?: Record<string, DependentEdge>
  private _nextGetKeyHashes?: Record<string, GraphEdgeInfo>
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
    if (this.api?.dispatchInterceptors?.length) {
      return this.api._interceptDispatch(action, (newAction: ActionChain) =>
        this.store.dispatch(newAction)
      )
    }

    return this.store.dispatch(action)
  }

  public setState = (settable: Settable<State>) => {
    if (this.api?.setStateInterceptors?.length) {
      return this.api._interceptSetState(
        settable,
        (newSettable: Settable<State>) => this.store.setState(newSettable)
      )
    }

    return this.store.setState(settable)
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

    if (this._getKeyHashes) {
      Object.entries(this._getKeyHashes).forEach(([dependencyKey, edge]) => {
        this.ecosystem._graph.removeDependency(
          this.keyHash,
          dependencyKey,
          edge
        )
      })
    }

    this._subscription?.unsubscribe()
    this.ecosystem._destroyAtomInstance(this.keyHash)

    // TODO: any other cleanup items? (subscriptions to remove, timeouts to cancel, etc)
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

    if (_value instanceof AtomApi) {
      this.api = _value
      return _value.value
    }

    if (typeof _value !== 'function') {
      return _value
    }

    try {
      const val = (_value as (
        ...params: Params
      ) => AtomValue<State> | AtomApi<State, Exports>)(...this.params)

      if (val instanceof AtomApi) {
        this.api = val

        // Exports can only be set on initial evaluation
        if (this._activeState === ActiveState.Initializing) {
          this.exports = val.exports as Exports

          if (val.promise) this._setPromise(val.promise)
        }

        return val.value
      }

      return val
    } catch (err) {
      console.error(
        `Zedux - Error while instantiating atom "${this.atom.key}" with params:`,
        this.params,
        err
      )

      throw err
    }
  }

  public _get<A extends AtomBase<any, [], any>>(atom: A): AtomStateType<A>
  public _get<A extends AtomBase<any, [...any], any>>(
    atom: A,
    params: AtomParamsType<A>
  ): AtomStateType<A>

  public _get<I extends AtomInstanceBase<any, [...any], any>>(
    instance: I
  ): AtomInstanceStateType<I>

  public _get<A extends Atom<any, [...any], any>>(
    atomOrInstance: A | AtomInstanceBase<any, [], any>,
    params?: AtomParamsType<A>
  ) {
    // TODO: check if the instance exists so we know if we create it here so we
    // can destroy it if the evaluate call errors (to prevent that memory leak)
    const instance: AtomInstanceBase<any, any, any> =
      atomOrInstance instanceof AtomInstanceBase
        ? atomOrInstance
        : this.ecosystem.getInstance(
            atomOrInstance,
            params as AtomParamsType<A>
          )

    // if get is called during evaluation, track the loaded instances so we can
    // add graph dependencies for them
    if (this._isEvaluating) {
      if (!this._nextGetKeyHashes) {
        this._nextGetKeyHashes = {}
      }

      // we could add more flags on this enum to indicate whether we created the
      // instance in this call
      this._nextGetKeyHashes[instance.keyHash] = [
        GraphEdgeDynamicity.Dynamic,
        'get',
      ]
    }

    // otherwise, instance._get() is just an alias for
    // ecosystem.getInstance().store.getState()
    return instance.store.getState()
  }

  public _getInstance<A extends AtomBase<any, [], any>>(
    atom: A
  ): AtomInstanceType<A>

  public _getInstance<A extends AtomBase<any, [...any], any>>(
    atom: A,
    params: AtomParamsType<A>,
    edgeInfo?: GraphEdgeInfo
  ): AtomInstanceType<A>

  public _getInstance<AI extends AtomInstanceBase<any, any, any>>(
    instance: AI,
    params?: [],
    edgeInfo?: GraphEdgeInfo
  ): AI

  public _getInstance<A extends Atom<any, [...any], any>>(
    atom: A | AtomInstanceBase<any, any, any>,
    params?: AtomParamsType<A>,
    edgeInfo?: GraphEdgeInfo
  ): AtomInstanceType<A> {
    // TODO: check if the instance exists so we know if we create it here so we
    // can destroy it if the evaluate call errors (to prevent that memory leak)
    const instance =
      atom instanceof AtomInstanceBase
        ? atom
        : this.ecosystem.getInstance(atom, params as AtomParamsType<A>)

    // if getInstance is called during evaluation, track the loaded instances so
    // we can add graph dependencies for them
    if (this._isEvaluating) {
      if (!this._nextGetKeyHashes) {
        this._nextGetKeyHashes = {}
      }

      // if we've already registered a dynamic edge, don't make it static
      if (
        this._nextGetKeyHashes[instance.keyHash]?.[0] !==
        GraphEdgeDynamicity.Dynamic
      ) {
        // we could add more flags on this enum to indicate whether we created the
        // instance in this call
        this._nextGetKeyHashes[instance.keyHash] = edgeInfo || [
          GraphEdgeDynamicity.Static,
          'getInstance',
        ]
      }
    }

    // otherwise, instance._getInstance() is just an alias for ecosystem.getInstance()
    return instance as AtomInstanceType<A>
  }

  /**
   * When a standard atom instance's refCount hits 0 and a ttl is set, we set a
   * timeout to destroy this atom instance.
   */
  public _scheduleDestruction() {
    // the atom may already be scheduled for destruction or destroyed
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

    this._evaluationReasons = [reason]

    this.ecosystem._scheduler.scheduleJob({
      flagScore,
      keyHash: this.keyHash,
      task: this.evaluationTask,
      type: JobType.EvaluateAtom,
    })
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
    this._updateGetEdges()

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

  private _updateGetEdges() {
    const curr = this._getKeyHashes
    const next = this._nextGetKeyHashes

    // remove any edges that were not recreated this evaluation
    if (curr) {
      Object.entries(curr).forEach(([dependencyKey, edge]) => {
        const nextEdge = next?.[dependencyKey]
        const nextIsStatic = nextEdge?.[0] === GraphEdgeDynamicity.Static

        if (nextEdge && nextIsStatic === edge.isStatic) return

        this.ecosystem._graph.removeDependency(
          this.keyHash,
          dependencyKey,
          edge
        )
      })
    }

    // add new edges that were added this evaluation
    if (next) {
      const nextGetKeyHashes: Record<string, DependentEdge> = {}

      Object.keys(next).forEach(dependencyKey => {
        const nextEdge = next[dependencyKey]
        const isStatic = nextEdge[0] === GraphEdgeDynamicity.Static
        const existingEdge = curr?.[dependencyKey]

        if (existingEdge) {
          nextGetKeyHashes[dependencyKey] = existingEdge
          return
        }

        const edge = this.ecosystem._graph.addDependency(
          this.keyHash,
          dependencyKey,
          nextEdge[1],
          isStatic
        )

        nextGetKeyHashes[dependencyKey] = edge
      })

      this._getKeyHashes = nextGetKeyHashes
    }

    this._nextGetKeyHashes = undefined
  }
}
