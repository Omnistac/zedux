import { atom } from '@zedux/atoms/factories/atom'
import {
  AnyAtomGenerics,
  AtomGenerics,
  AtomValueOrFactory,
} from '@zedux/atoms/types/index'
import { AtomInstance, AtomInstanceRecursive } from '../instances/AtomInstance'
import { Ecosystem } from '../Ecosystem'
import { AtomTemplateBase } from './AtomTemplateBase'

export type AtomTemplateRecursive<G extends AtomGenerics> = AtomTemplate<
  G & { Node: AtomInstanceRecursive<G> }
>

export class AtomTemplate<
  G extends AtomGenerics = AnyAtomGenerics
> extends AtomTemplateBase<G> {
  /**
   * This method should be overridden when creating custom atom classes that
   * create a custom atom instance class. Return a new instance of your atom
   * instance class.
   */
  public _createInstance(
    ecosystem: Ecosystem,
    id: string,
    params: G['Params']
  ): G['Node'] {
    return new AtomInstance<G>(ecosystem, this, id, params) as G['Node']
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
