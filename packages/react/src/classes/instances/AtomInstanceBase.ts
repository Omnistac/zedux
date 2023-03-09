import {
  ActiveState,
  EvaluationReason,
  Cleanup,
  PromiseStatus,
  DependentCallback,
  AnyAtomTemplate,
} from '@zedux/react/types'
import {
  Explicit,
  External,
  InjectorDescriptor,
  prefix,
} from '@zedux/react/utils'
import { Ecosystem } from '../Ecosystem'
import { Store } from '@zedux/core'

export abstract class AtomInstanceBase<
  State,
  TemplateType extends AnyAtomTemplate
> {
  public static $$typeof = Symbol.for(`${prefix}/AtomInstanceBase`)
  public abstract activeState: ActiveState
  public abstract ecosystem: Ecosystem
  public abstract id: string
  public abstract promise?: Promise<any>
  public abstract store: Store<State>
  public abstract template: TemplateType

  public abstract _createdAt: number
  public abstract _injectors?: InjectorDescriptor[]
  public abstract _prevEvaluationReasons?: EvaluationReason[]
  public abstract _promiseError?: Error
  public abstract _promiseStatus?: PromiseStatus

  public abstract destroy(force?: boolean): void

  public abstract _scheduleEvaluation(
    reason: EvaluationReason,
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
      this.id,
      operation,
      Explicit | External,
      callback
    )

    return () => this.ecosystem._graph.removeEdge(id, this.id)
  }
}
