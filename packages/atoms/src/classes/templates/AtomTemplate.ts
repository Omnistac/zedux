import { atom } from '@zedux/atoms/factories/atom'
import {
  AnyAtomGenerics,
  AtomGenerics,
  AtomValueOrFactory,
} from '@zedux/atoms/types/index'
import { AtomInstance } from '../instances/AtomInstance'
import { Ecosystem } from '../Ecosystem'
import { AtomTemplateBase } from './AtomTemplateBase'
import { Signal } from '../Signal'

export type AtomInstanceRecursive<
  G extends Omit<AtomGenerics, 'Node' | 'Template'>
> = AtomInstance<
  G & {
    Node: AtomInstanceRecursive<G>
    Template: AtomTemplateRecursive<G>
  }
>

export type AtomTemplateRecursive<
  G extends Omit<AtomGenerics, 'Node' | 'Template'>
> = AtomTemplate<
  G & {
    Node: AtomInstanceRecursive<G>
    Template: AtomTemplateRecursive<G>
  }
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
    return new AtomInstance(ecosystem, this, id, params)
  }

  public getInstanceId(ecosystem: Ecosystem, params?: G['Params']) {
    const base = this.key

    if (!params?.length) return base

    return `${base}-${ecosystem._idGenerator.hashParams(
      params,
      ecosystem.complexParams
    )}`
  }

  public override(
    newValue: AtomValueOrFactory<
      G & {
        Signal: Signal<{ State: G['State']; Events: G['Events'] }> | undefined
      }
    >
  ): AtomTemplate<G> {
    const newAtom = atom(this.key, newValue, this._config)
    newAtom._isOverride = true
    return newAtom as any
  }
}
