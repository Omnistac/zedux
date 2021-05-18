import { Subscription } from '@zedux/core'
import { ActiveState, AtomValue, StateType } from '@zedux/react/types'
import {
  DependentEdge,
  EvaluationReason,
  EvaluationTargetType,
  EvaluationType,
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
  public _stateType?: StateType
  public _stateStore: Store<State>
  private _getKeyHashes?: Record<string, DependentEdge>
  private _isEvaluating = false
  private _nextGetKeyHashes?: Record<string, true>
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
      ecosystem.graph.scheduleDependents(keyHash, this._evaluationReasons)
    })

    this._activeState = ActiveState.Active
  }

  // handle detaching this atom instance from the global store and all destruction stuff
  public _destroy() {
    // TODO: dispatch an action over stateStore for this mutation
    this._activeState = ActiveState.Destroyed

    if (this._evaluationReasons.length) {
      this.ecosystem.scheduler.unscheduleJob(this.evaluationTask)
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
        this.ecosystem.graph.removeDependency(this.keyHash, dependencyKey, edge)
      })
    }

    this._subscription?.unsubscribe()
    this.ecosystem.destroyAtomInstance(this.keyHash)

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

    this.ecosystem.scheduler.scheduleJob({
      flagScore,
      keyHash: this.keyHash,
      task: this.evaluationTask,
      type: JobType.EvaluateAtom,
    })
  }

  public _get<S>(atom: AtomBase<S, [], AtomInstanceBase<S, [], any>>): S

  public _get<S, P extends any[]>(
    atom: AtomBase<S, [...P], AtomInstanceBase<S, [...P], any>>,
    params: [...P]
  ): S

  public _get<
    S,
    InstanceType extends AtomInstanceBase<S, [], AtomType>,
    AtomType extends AtomBase<S, [], InstanceType>
  >(atom: AtomType): S

  public _get<
    S,
    P extends any[],
    InstanceType extends AtomInstanceBase<S, [...P], AtomType>,
    AtomType extends AtomBase<S, [...P], InstanceType>
  >(atom: AtomType, params: [...P]): S

  public _get<P extends any[]>(
    atom: AtomBase<any, [...P], AtomInstanceBase<any, [...P], any>>,
    params?: [...P]
  ) {
    // TODO: check if the instance exists so we know if we create it here so we
    // can destroy it if the evaluate call errors (to prevent that memory leak)
    const instance = this.ecosystem.load(atom, params as P)

    // if get is called during evaluation, track the loaded instances so we can
    // add graph dependencies for them
    if (this._isEvaluating) {
      if (!this._nextGetKeyHashes) {
        this._nextGetKeyHashes = {}
      }

      // we could make this true or false depending on whether we created the
      // instance in this call
      this._nextGetKeyHashes[instance.keyHash] = true
    }

    // otherwise, instance.get() is just an alias for ecosystem.load()
    return instance._stateStore.getState()
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

    // I believe there is no way to cause a scheduleEvaluation loop when the StateType is Value
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
    // remove any edges that were not recreated this evaluation
    if (this._getKeyHashes) {
      Object.entries(this._getKeyHashes).forEach(([dependencyKey, edge]) => {
        if (this._nextGetKeyHashes?.[dependencyKey]) return

        this.ecosystem.graph.removeDependency(this.keyHash, dependencyKey, edge)
      })
    }

    // add new edges that were added this evaluation
    if (this._nextGetKeyHashes) {
      const nextGetKeyHashes: Record<string, DependentEdge> = {}

      Object.keys(this._nextGetKeyHashes).forEach(dependencyKey => {
        const existingEdge = this._getKeyHashes?.[dependencyKey]

        if (existingEdge) {
          nextGetKeyHashes[dependencyKey] = existingEdge
          return
        }

        const edge = this.ecosystem.graph.addDependency(
          this.keyHash,
          dependencyKey,
          'get',
          false
        )

        nextGetKeyHashes[dependencyKey] = edge
      })

      this._getKeyHashes = nextGetKeyHashes
    }

    this._nextGetKeyHashes = undefined
  }
}
