import { atom } from '@zedux/react/factories/atom'
import { AtomApiPromise, AtomValueOrFactory } from '@zedux/react/types'
import { AtomInstance } from '../instances/AtomInstance'
import { Ecosystem } from '../Ecosystem'
import { StandardAtomBase } from './StandardAtomBase'

export class Atom<
  State,
  Params extends any[],
  Exports extends Record<string, any>,
  PromiseType extends AtomApiPromise
> extends StandardAtomBase<State, Params, Exports, PromiseType> {
  /**
   * This method should be overridden when creating custom atom classes that
   * create a custom atom instance class. Return a new instance of your atom
   * instance class.
   */
  public _createInstance(
    ecosystem: Ecosystem,
    keyHash: string,
    params: Params
  ): AtomInstance<State, Params, Exports, PromiseType> {
    return new AtomInstance<State, Params, Exports, PromiseType>(
      ecosystem,
      this,
      keyHash,
      params
    )
  }

  public getKeyHash(ecosystem: Ecosystem, params?: Params) {
    const base = this.key

    if (!params?.length) return base

    return `${base}-${ecosystem._idGenerator.hashParams(
      params,
      ecosystem.allowComplexAtomParams
    )}`
  }

  public override(
    newValue: AtomValueOrFactory<State, Params, Exports, PromiseType>
  ) {
    return atom(this.key, newValue, {
      flags: this.flags,
      maxInstances: this.maxInstances,
      ttl: this.ttl,
    })
  }
}
