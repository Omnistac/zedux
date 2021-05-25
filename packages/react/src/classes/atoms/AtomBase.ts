import { generateImplementationId, hashParams } from '@zedux/react/utils'
import { Ecosystem } from '../Ecosystem'
import { AtomInstanceBase } from '../instances/AtomInstanceBase'

export abstract class AtomBase<
  State,
  Params extends any[],
  InstanceType extends AtomInstanceBase<State, Params, any>
> {
  public internalId: string

  constructor(
    public readonly key: string,
    public readonly flags?: string[],
    public readonly maxInstances?: number
  ) {
    this.internalId = generateImplementationId()
  }

  public abstract createInstance(
    ecosystem: Ecosystem,
    keyHash: string,
    params: Params
  ): InstanceType

  public getKeyHash(params?: Params) {
    const base = `${this.key}`

    if (!params?.length) return base

    return `${base}-${hashParams(params)}`
  }
}
