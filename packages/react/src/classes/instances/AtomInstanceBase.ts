import { Subscription } from '@zedux/core'
import {
  ActiveState,
  AtomInstanceStateType,
  AtomInstanceType,
  AtomParamsType,
  AtomStateType,
  AtomValue,
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
  WhyInjectorDescriptor,
} from '@zedux/react/utils'
import { diContext } from '@zedux/react/utils/csContexts'
import { AtomBase } from '../atoms/AtomBase'
import { Ecosystem } from '../Ecosystem'
import { createStore, isZeduxStore, Store } from '@zedux/core'

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

const runWhyInjectors = (
  newInjectors: InjectorDescriptor[],
  evaluationReasons: EvaluationReason[]
) => {
  const whyInjectors = newInjectors.filter(
    injector => injector.type === InjectorType.Why
  ) as WhyInjectorDescriptor[]

  whyInjectors.forEach(({ callback }) => {
    callback(evaluationReasons)
  })
}

export abstract class AtomInstanceBase<
  State,
  Params extends any[],
  AtomType extends AtomBase<State, Params, any>
> {
  public _activeState = ActiveState.Initializing
  public _evaluationReasons: EvaluationReason[] = [] // TODO: Make this undefined in prod and don't use
  public _injectors?: InjectorDescriptor[]
  public _isEvaluating = false
  public _stateType?: StateType
  public _stateStore: Store<State>
  private _getKeyHashes?: Record<string, DependentEdge>
  private _nextGetKeyHashes?: Record<string, GraphEdgeInfo>
  private _subscription?: Subscription

  constructor(
    public readonly ecosystem: Ecosystem,
    public readonly atom: AtomType,
    public readonly keyHash: string,
    public readonly params: Params
  ) {
    const factoryResult = this._doEvaluate()

    ;[this._stateType, this._stateStore] = getStateStore(factoryResult)

    this._subscription = this._stateStore.subscribe(() => {
      ecosystem._graph.scheduleDependents(keyHash, this._evaluationReasons)
    })

    this._activeState = ActiveState.Active
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

  public abstract _evaluate(): AtomValue<State>
  public abstract _scheduleDestruction(): void

  public _scheduleEvaluation = (reason: EvaluationReason, flagScore = 0) => {
    // TODO: Any calls in this case probably indicate a memory leak on the
    // user's part. Notify them. TODO: Can we pause evaluations while
    // activeState is Destroying (and should we just always evaluate once when
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

  public _get<A extends AtomBase<any, [], any>>(atom: A): AtomStateType<A>
  public _get<A extends AtomBase<any, [...any], any>>(
    atom: A,
    params: AtomParamsType<A>
  ): AtomStateType<A>

  public _get<I extends AtomInstanceBase<any, [...any], any>>(
    instance: I
  ): AtomInstanceStateType<I>

  public _get<A extends AtomBase<any, [...any], any>>(
    atomOrInstance: A | AtomInstanceBase<any, [], AtomBase<any, [], any>>,
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
    // ecosystem.getInstance()._stateStore.getState()
    return instance._stateStore.getState()
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
    instance: AI | AtomBase<any, any, any>,
    params?: [],
    edgeInfo?: GraphEdgeInfo
  ): AI

  public _getInstance<A extends AtomBase<any, [...any], any>>(
    atom: A | AtomInstanceBase<any, any, any>,
    params?: AtomParamsType<A>,
    edgeInfo?: GraphEdgeInfo
  ) {
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

      // we could add more flags on this enum to indicate whether we created the
      // instance in this call
      this._nextGetKeyHashes[instance.keyHash] = edgeInfo || [
        GraphEdgeDynamicity.Static,
        'getInstance',
      ]
    }

    // otherwise, instance._getInstance() is just an alias for ecosystem.getInstance()
    return instance
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
        runWhyInjectors(newInjectors, this._evaluationReasons)

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

    if (
      newStateType === StateType.Store &&
      newFactoryResult !== this._stateStore
    ) {
      throw new Error(
        `Zedux Error - atom factory for atom "${this.atom.key}" returned a different store. Did you mean to use \`injectState()\`, \`injectStore()\`, or \`injectMemo()\`?`
      )
    }

    // I believe there is no way to cause an evaluation loop when the StateType is Value
    if (newStateType === StateType.Value) {
      this._stateStore.setState(
        typeof newFactoryResult === 'function'
          ? () => newFactoryResult as State
          : (newFactoryResult as State)
      )
    }
  }

  private _invalidate() {
    this._scheduleEvaluation({
      operation: 'invalidate',
      targetType: EvaluationTargetType.External,
      type: EvaluationType.CacheInvalidated,
    })
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
