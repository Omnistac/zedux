import {
  ActiveState,
  AtomInstanceStateType,
  AtomInstanceType,
  AtomParamsType,
  AtomStateType,
} from '@zedux/react/types'
import {
  EvaluationReason,
  GraphEdgeInfo,
  InjectorDescriptor,
} from '@zedux/react/utils'
import { AtomBase } from '../atoms/AtomBase'
import { Ecosystem } from '../Ecosystem'
import { Store } from '@zedux/core'

export abstract class AtomInstanceBase<
  State,
  Params extends any[],
  AtomType extends AtomBase<State, Params, any>
> {
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
}
