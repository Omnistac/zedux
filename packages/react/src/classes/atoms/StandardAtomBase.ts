import { AtomConfig, AtomValueOrFactory } from '@zedux/react/types'
import { EMPTY_CONTEXT } from '@zedux/react/utils'
import { Context, createContext } from 'react'
import { Ecosystem } from '../Ecosystem'
import { AtomInstance } from '../instances/AtomInstance'
import { AtomBase } from './AtomBase'

export class StandardAtomBase<
  State,
  Params extends any[],
  Exports extends Record<string, any>
> extends AtomBase<State, Params, AtomInstance<State, Params, Exports>> {
  private reactContext?: Context<
    AtomInstance<State, Params, Exports> | Record<string, never>
  >
  public ttl?: number

  constructor(
    key: string,
    public readonly _value: AtomValueOrFactory<State, Params, Exports>,
    config?: AtomConfig
  ) {
    super(key, config?.flags, config?.maxInstances)
    this.ttl = config?.ttl

    // const map = new WeakMap();
    // map.set(newAtomInstance, true);
    // map.set({ control: true }, true);
    // console.log({ key: atom.key, map });
  }

  public createInstance(
    ecosystem: Ecosystem,
    keyHash: string,
    params: Params
  ): AtomInstance<State, Params, Exports> {
    return new AtomInstance<State, Params, Exports>(
      ecosystem,
      this,
      keyHash,
      params
    )
  }

  public getReactContext() {
    if (this.reactContext) return this.reactContext

    return (this.reactContext = createContext(EMPTY_CONTEXT))
  }
}
