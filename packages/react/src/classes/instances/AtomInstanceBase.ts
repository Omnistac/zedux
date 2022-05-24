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
  Cleanup,
  EdgeFlag,
  PromiseStatus,
} from '@zedux/react/types'
import { InjectorDescriptor } from '@zedux/react/utils'
import { AtomBase } from '../atoms/AtomBase'
import { Ecosystem } from '../Ecosystem'
import { Store } from '@zedux/core'
import { ZeduxPlugin } from '../ZeduxPlugin'

export abstract class AtomInstanceBase<
  State,
  Params extends any[],
  AtomType extends AtomBase<State, Params, any>
> implements AtomGettersBase {
  public static $$typeof = Symbol.for('@@react/zedux/AtomInstanceBase')
  public abstract atom: AtomType
  public abstract ecosystem: Ecosystem
  public abstract keyHash: string
  public abstract promise?: Promise<any>
  public abstract store: Store<State>

  public abstract _activeState: ActiveState
  public abstract _createdAt: number
  public abstract _prevEvaluationReasons: EvaluationReason[]
  public abstract _injectors?: InjectorDescriptor[]
  public abstract _isEvaluating: boolean
  public abstract _promiseError?: Error
  public abstract _promiseStatus?: PromiseStatus

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

  public abstract _scheduleEvaluation(
    reason: EvaluationReason,
    flags?: number
  ): void

  public addDependent(
    callback?: DependentEdge['callback'],
    operation = 'addDependent'
  ): Cleanup {
    const id = this.ecosystem._idGenerator.generateNodeId()
    this.ecosystem._graph.addEdge(
      id,
      this.keyHash,
      operation,
      EdgeFlag.Explicit | EdgeFlag.External,
      callback
    )

    return () => this.ecosystem._graph.removeEdge(id, this.keyHash)
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
