import { atom } from '@zedux/react/factories/atom'
import { AtomConfig, AtomValueOrFactory } from '@zedux/react/types'
import {
  EMPTY_CONTEXT,
  generateImplementationId,
  hashParams,
} from '@zedux/react/utils'
import { Context, createContext } from 'react'
import { AtomInstance } from '../AtomInstance'
import { Ecosystem } from '../Ecosystem'

export class Atom<
  State,
  Params extends any[],
  Exports extends Record<string, any>
> {
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

  /**
   * This method should be overridden when creating custom atom classes that
   * create a custom atom instance class. Return a new instance of your atom
   * instance class.
   */
  public _createInstance(
    ecosystem: Ecosystem,
    keyHash: string,
    params: Params
  ): AtomInstance<State, Params, Exports, any> {
    return new AtomInstance<State, Params, Exports, any>(
      ecosystem,
      this,
      keyHash,
      params
    )
  }

  public getKeyHash(params?: Params) {
    const base = `${this.key}`

    if (!params?.length) return base

    return `${base}-${hashParams(params)}`
  }

  public getReactContext() {
    if (this.reactContext) return this.reactContext

    return (this.reactContext = createContext(EMPTY_CONTEXT))
  }

  public override(newValue: AtomValueOrFactory<State, Params, Exports>) {
    return atom(this.key, newValue, {
      flags: this.flags,
      maxInstances: this.maxInstances,
      ttl: this.ttl,
    })
  }
}
