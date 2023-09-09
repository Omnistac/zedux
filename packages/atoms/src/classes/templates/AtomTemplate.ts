import { atom } from '@zedux/atoms/factories/atom'
import { AtomGenerics, AtomValueOrFactory } from '@zedux/atoms/types/index'
import { AtomInstance } from '../instances/AtomInstance'
import { Ecosystem } from '../Ecosystem'
import { AtomTemplateBase } from './AtomTemplateBase'

export class AtomTemplate<
  G extends AtomGenerics,
  AtomInstanceType extends AtomInstance<G> = AtomInstance<G>
> extends AtomTemplateBase<G, AtomInstanceType> {
  /**
   * This method should be overridden when creating custom atom classes that
   * create a custom atom instance class. Return a new instance of your atom
   * instance class.
   */
  public _createInstance(
    ecosystem: Ecosystem,
    id: string,
    params: G['Params']
  ): AtomInstanceType {
    return new AtomInstance<G>(ecosystem, this, id, params) as AtomInstanceType
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
    const newAtom = atom(this.key, newValue, this._config)
    newAtom._isOverride = true
    return newAtom
  }
}
