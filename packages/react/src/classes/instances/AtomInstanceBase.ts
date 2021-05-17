import { Subscription } from '@zedux/core'
import { ActiveState, AtomValue, StateType } from '@zedux/react/types'
import {
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
  private _subscription?: Subscription

  constructor(
    public readonly ecosystem: Ecosystem,
    public readonly atom: AtomType,
    public readonly keyHash: string,
    public readonly params: Params
  ) {
    // Boot up the atom!
    let factoryResult: AtomValue<State>
    const injectors: InjectorDescriptor[] = []

    try {
      factoryResult = diContext.provide(
        {
          injectors,
          instance: this,
        },
        this.evaluate
      )
    } catch (err) {
      injectors.forEach(injector => {
        injector.cleanup?.()
      })
      throw err
    }

    this._injectors = injectors
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

  // create small, memory-efficient bound function properties we can pass around
  public invalidate = () => this._invalidate()
  private evaluate = () => this._evaluate()
  private evaluationTask = () => this._evaluationTask()

  private _evaluationTask() {
    const newInjectors: InjectorDescriptor[] = []
    let newFactoryResult: AtomValue<State>

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
      runWhyInjectors(newInjectors, this._evaluationReasons)

      this._evaluationReasons = []
    }

    this._injectors = newInjectors // TODO: dispatch an action over stateStore for this mutation
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
}
