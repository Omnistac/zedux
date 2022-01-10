import { Selector } from '@zedux/core'
import {
  ActiveState,
  AtomGettersBase,
  AtomInstanceStateType,
  AtomInstanceType,
  AtomParamsType,
  AtomSelectorOrConfig,
  AtomStateType,
  GraphEdgeInfo,
  DependentEdge,
  EvaluationReason,
} from '@zedux/react/types'
import { InjectorDescriptor } from '@zedux/react/utils'
import { AtomBase } from '../atoms/AtomBase'
import { Ecosystem } from '../Ecosystem'
import { Store } from '@zedux/core'
import { Ghost } from '../Ghost'
import { ZeduxPlugin } from '../ZeduxPlugin'
import {} from '@zedux/react'

export abstract class AtomInstanceBase<
  State,
  Params extends any[],
  AtomType extends AtomBase<State, Params, any>
> implements AtomGettersBase {
  public static $$typeof = Symbol.for('@@react/zedux/AtomInstanceBase')
  public abstract atom: AtomType
  public abstract ecosystem: Ecosystem
  public abstract keyHash: string
  public abstract store: Store<State>

  public abstract _activeState: ActiveState
  public abstract _createdAt: number
  public abstract _evaluationReasons: EvaluationReason[]
  public abstract _injectors?: InjectorDescriptor[]
  public abstract _isEvaluating: boolean

  public abstract get<A extends AtomBase<any, [], any>>(
    atom: A
  ): AtomStateType<A>

  public abstract get<A extends AtomBase<any, [...any], any>>(
    atom: A,
    params: AtomParamsType<A>
  ): AtomStateType<A>

  public abstract get<AI extends AtomInstanceBase<any, [...any], any>>(
    instance: AI
  ): AtomInstanceStateType<AI>

  public abstract getInstance<A extends AtomBase<any, [], any>>(
    atom: A
  ): AtomInstanceType<A>

  public abstract getInstance<A extends AtomBase<any, [...any], any>>(
    atom: A,
    params: AtomParamsType<A>,
    edgeInfo?: GraphEdgeInfo
  ): AtomInstanceType<A>

  public abstract getInstance<AI extends AtomInstanceBase<any, any, any>>(
    instance: AI,
    params?: [],
    edgeInfo?: GraphEdgeInfo
  ): AI

  public abstract select<T, Args extends any[]>(
    atomSelector: AtomSelectorOrConfig<T, Args>,
    ...args: Args
  ): T

  public abstract select<A extends AtomBase<any, [], any>, D>(
    atom: A,
    selector: Selector<AtomStateType<A>, D>
  ): D

  public abstract select<A extends AtomBase<any, [...any], any>, D>(
    atom: A,
    params: AtomParamsType<A>,
    selector: Selector<AtomStateType<A>, D>
  ): D

  public abstract select<I extends AtomInstanceBase<any, [...any], any>, D>(
    instance: I,
    selector: Selector<AtomInstanceStateType<I>, D>
  ): D

  public abstract _scheduleEvaluation(
    reason: EvaluationReason,
    flagScore?: number
  ): void

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
    this._activeState = newActiveState

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
