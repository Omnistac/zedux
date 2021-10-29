import {
  ActiveState,
  AtomInstanceStateType,
  AtomInstanceType,
  AtomParamsType,
  AtomSelector,
  AtomStateType,
} from '@zedux/react/types'
import {
  EvaluationReason,
  GraphEdgeInfo,
  InjectorDescriptor,
} from '@zedux/react/utils'
import { AtomBase } from '../atoms/AtomBase'
import { Ecosystem } from '../Ecosystem'
import { Selector, Store } from '@zedux/core'

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

  public abstract _select<A extends AtomBase<any, [], any>, D>(
    atom: A,
    selector: Selector<AtomStateType<A>, D>
  ): AtomStateType<A>

  public abstract _select<A extends AtomBase<any, [...any], any>, D>(
    atom: A,
    params: AtomParamsType<A>,
    selector: Selector<AtomStateType<A>, D>
  ): AtomStateType<A>

  public abstract _select<I extends AtomInstanceBase<any, [...any], any>, D>(
    instance: I,
    selector: Selector<AtomInstanceStateType<I>, D>
  ): AtomInstanceStateType<I>

  public abstract _select<T>(atomSelector: AtomSelector<T>): T
}
