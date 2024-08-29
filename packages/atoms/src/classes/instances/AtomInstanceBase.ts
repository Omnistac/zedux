import {
  EvaluationReason,
  Cleanup,
  PromiseStatus,
  DependentCallback,
  AnyAtomTemplate,
  LifecycleStatus,
  EcosystemGraphNode,
  DependentEdge,
  DehydrationFilter,
  NodeFilter,
} from '@zedux/atoms/types/index'
import {
  Explicit,
  External,
  InjectorDescriptor,
} from '@zedux/atoms/utils/index'
import { Store } from '@zedux/core'
import { Ecosystem } from '../Ecosystem'

// TODO NOW: rework this class - make it the base Node class that Atom, Selector, Signal, and any custom user-made nodes all extend
export abstract class AtomInstanceBase<
  State,
  TemplateType extends AnyAtomTemplate
> implements EcosystemGraphNode
{
  public static $$typeof: symbol
  public abstract ecosystem: Ecosystem
  public abstract status: LifecycleStatus
  public abstract promise?: Promise<any>
  public abstract store: Store<State>
  public abstract template: TemplateType

  // "public" graph node props
  public abstract destroy(force?: boolean): void
  public abstract id: string

  // "internal" graph node props
  public abstract d(options?: DehydrationFilter): any
  public abstract f(options?: NodeFilter): boolean
  public abstract h(val: any): any
  public o = new Map<string, DependentEdge>()
  public s = new Map<string, DependentEdge>()

  public abstract _createdAt: number
  public abstract _injectors?: InjectorDescriptor[]
  public abstract _promiseError?: Error
  public abstract _promiseStatus?: PromiseStatus

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
