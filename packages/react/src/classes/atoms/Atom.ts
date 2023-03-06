import { atom } from '@zedux/react/factories/atom'
import { AtomGenerics, AtomValueOrFactory } from '@zedux/react/types'
import { AtomInstance } from '../instances/AtomInstance'
import { Ecosystem } from '../Ecosystem'
import { AtomBase } from './AtomBase'

export class Atom<G extends AtomGenerics> extends AtomBase<G, AtomInstance<G>> {
  /**
   * This method should be overridden when creating custom atom classes that
   * create a custom atom instance class. Return a new instance of your atom
   * instance class.
   */
  public _createInstance(
    ecosystem: Ecosystem,
    id: string,
    params: G['Params']
  ): AtomInstance<G> {
    return new AtomInstance<G>(ecosystem, this, id, params)
  }

  public getInstanceId(ecosystem: Ecosystem, params?: G['Params']) {
    const base = this.key

    if (!params?.length) return base

    return `${base}-${ecosystem._idGenerator.hashParams(
      params,
      ecosystem.complexParams
    )}`
  }

  public override(newValue: AtomValueOrFactory<G>) {
    return atom(this.key, newValue, this._config)
  }
}
