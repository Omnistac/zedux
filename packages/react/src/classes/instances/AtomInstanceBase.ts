import {
  ActiveState,
  AtomInstanceStateType,
  AtomInstanceType,
  AtomParamsType,
  AtomSelectorOrConfig,
  AtomStateType,
  DependentEdge,
  EvaluationReason,
} from '@zedux/react/types'
import { GraphEdgeInfo, InjectorDescriptor } from '@zedux/react/utils'
import { AtomBase } from '../atoms/AtomBase'
import { Ecosystem } from '../Ecosystem'
import { Selector, Store } from '@zedux/core'
import { Ghost } from '../Ghost'
import { ZeduxPlugin } from '../ZeduxPlugin'

export abstract class AtomInstanceBase<
  State,
  Params extends any[],
  AtomType extends AtomBase<State, Params, any>
> {
  public static $$typeof = Symbol.for('@@react/zedux/AtomInstanceBase')
  public abstract atom: AtomType
  public abstract ecosystem: Ecosystem
  public abstract keyHash: string
  public abstract store: Store<State>

  public abstract _activeState: ActiveState
  public abstract _evaluationReasons: EvaluationReason[]
  public abstract _injectors?: InjectorDescriptor[]
  public abstract _isEvaluating: boolean

  public abstract _get<A extends AtomBase<any, [], any>>(
    atom: A
  ): AtomStateType<A>

  public abstract _get<A extends AtomBase<any, [...any], any>>(
    atom: A,
    params: AtomParamsType<A>
  ): AtomStateType<A>

  public abstract _get<I extends AtomInstanceBase<any, [...any], any>>(
    instance: I
  ): AtomInstanceStateType<I>

  public abstract _getInstance<A extends AtomBase<any, [], any>>(
    atom: A
  ): AtomInstanceType<A>

  public abstract _getInstance<A extends AtomBase<any, [...any], any>>(
    atom: A,
    params: AtomParamsType<A>,
    edgeInfo?: GraphEdgeInfo
  ): AtomInstanceType<A>

  public abstract _getInstance<AI extends AtomInstanceBase<any, any, any>>(
    instance: AI,
    params?: [],
    edgeInfo?: GraphEdgeInfo
  ): AI

  public abstract _scheduleEvaluation(
    reason: EvaluationReason,
    flagScore?: number
  ): void

  public abstract _select<T, Args extends any[]>(
    atomSelector: AtomSelectorOrConfig<T, Args>,
    ...args: Args
  ): T

  public abstract _select<A extends AtomBase<any, [], any>, D>(
    atom: A,
    selector: Selector<AtomStateType<A>, D>
  ): D

  public abstract _select<A extends AtomBase<any, [...any], any>, D>(
    atom: A,
    params: AtomParamsType<A>,
    selector: Selector<AtomStateType<A>, D>
  ): D

  public abstract _select<I extends AtomInstanceBase<any, [...any], any>, D>(
    instance: I,
    selector: Selector<AtomInstanceStateType<I>, D>
  ): D

  public addDependent(
    operation: string,
    callback?: DependentEdge['callback']
  ): Ghost {
    const ghost = this.ecosystem._graph.registerGhostDependent(
      this,
      callback,
      operation,
      false,
      true
    )

    ghost.materialize()

    return ghost
  }

  public setActiveState(newActiveState: ActiveState) {
    const oldActiveState = this._activeState
    this._activeState = ActiveState.Active

    if (this.ecosystem.mods.instanceActiveStateChanged) {
      this.ecosystem.modsMessageBus.dispatch(
        ZeduxPlugin.actions.instanceActiveStateChanged({
          instance: this,
          newActiveState,
          oldActiveState,
        })
      )
    }
  }
}
