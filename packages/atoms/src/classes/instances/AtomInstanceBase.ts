import {
  EvaluationReason,
  Cleanup,
  PromiseStatus,
  DependentCallback,
  AnyAtomTemplate,
  LifecycleStatus,
} from '@zedux/atoms/types/index'
import {
  Explicit,
  External,
  InjectorDescriptor,
  prefix,
} from '@zedux/atoms/utils/index'
import { Store } from '@zedux/core'
import { Ecosystem } from '../Ecosystem'

export abstract class AtomInstanceBase<
  State,
  TemplateType extends AnyAtomTemplate
> {
  public static $$typeof = Symbol.for(`${prefix}/AtomInstanceBase`)
  public abstract ecosystem: Ecosystem
  public abstract id: string
  public abstract status: LifecycleStatus
  public abstract promise?: Promise<any>
  public abstract store: Store<State>
  public abstract template: TemplateType

  public abstract _createdAt: number
  public abstract _injectors?: InjectorDescriptor[]
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
