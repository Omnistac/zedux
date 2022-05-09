import { Ecosystem } from '../Ecosystem'
import { AtomInstanceBase } from '../instances/AtomInstanceBase'

export abstract class AtomBase<
  State,
  Params extends any[],
  InstanceType extends AtomInstanceBase<State, Params, any>
> {
  public abstract flags?: string[]
  public abstract key: string

  public abstract _createInstance(
    ecosystem: Ecosystem,
    keyHash: string,
    params: Params
  ): InstanceType

  public abstract getKeyHash(ecosystem: Ecosystem, params?: Params): string
}
