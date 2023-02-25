import {
  ActiveState,
  EvaluationReason,
  Cleanup,
  EdgeFlag,
  PromiseStatus,
  DependentCallback,
} from '@zedux/react/types'
import { InjectorDescriptor, prefix } from '@zedux/react/utils'
import { AtomBase } from '../atoms/AtomBase'
import { Ecosystem } from '../Ecosystem'
import { Store } from '@zedux/core'

export abstract class AtomInstanceBase<
  State,
  Params extends any[],
  AtomType extends AtomBase<State, Params, any>
> {
  public static $$typeof = Symbol.for(`${prefix}/AtomInstanceBase`)
  public abstract activeState: ActiveState
  public abstract atom: AtomType
  public abstract ecosystem: Ecosystem
  public abstract keyHash: string
  public abstract promise?: Promise<any>
  public abstract store: Store<State>

  public abstract _createdAt: number
  public abstract _injectors?: InjectorDescriptor[]
  public abstract _prevEvaluationReasons?: EvaluationReason[]
  public abstract _promiseError?: Error
  public abstract _promiseStatus?: PromiseStatus

  public abstract destroy(force?: boolean): void

  public abstract _scheduleEvaluation(
    reason: EvaluationReason,
    flags?: number,
    shouldSetTimeout?: boolean
  ): void

  public addDependent({
    callback,
    operation = 'addDependent',
  }: {
    callback?: DependentCallback
    operation?: string
  } = {}): Cleanup {
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
}
