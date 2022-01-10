import { AtomConfig, AtomValueOrFactory } from '@zedux/react/types'
import { EMPTY_CONTEXT, generateImplementationId } from '@zedux/react/utils'
import { Context, createContext } from 'react'
import { AtomInstance } from '../instances/AtomInstance'
import { AtomBase } from './AtomBase'

export abstract class StandardAtomBase<
  State,
  Params extends any[],
  Exports extends Record<string, any>
> extends AtomBase<State, Params, AtomInstance<State, Params, Exports>> {
  public readonly flags?: string[]
  public readonly forwardPromises?: boolean
  public readonly internalId: string
  public readonly maxInstances?: number
  public readonly ttl?: number

  private reactContext?: Context<any>

  constructor(
    public readonly key: string,
    public readonly _value: AtomValueOrFactory<State, Params, Exports>,
    config?: AtomConfig
  ) {
    super()
    this.flags = config?.flags
    this.forwardPromises = config?.forwardPromises
    this.internalId = generateImplementationId()
    this.maxInstances = config?.maxInstances
    this.ttl = config?.ttl

    // const map = new WeakMap();
    // map.set(newAtomInstance, true);
    // map.set({ control: true }, true);
    // console.log({ key: atom.key, map });
  }

  public getReactContext() {
    if (this.reactContext) return this.reactContext

    return (this.reactContext = createContext(EMPTY_CONTEXT))
  }
}
