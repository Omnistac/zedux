import { AtomConfig, AtomTemplateBase, Ecosystem } from '@zedux/atoms'
import { storeAtom } from './storeAtom'
import { StoreAtomInstance } from './StoreAtomInstance'
import {
  AnyStoreAtomGenerics,
  StoreAtomGenerics,
  StoreAtomValueOrFactory,
} from './types'

export type StoreAtomInstanceRecursive<
  G extends Omit<StoreAtomGenerics, 'Node' | 'Template'>
> = StoreAtomInstance<
  G & {
    Node: StoreAtomInstanceRecursive<G>
    Template: StoreAtomTemplateRecursive<G>
  }
>

export type StoreAtomTemplateRecursive<
  G extends Omit<StoreAtomGenerics, 'Node' | 'Template'>
> = StoreAtomTemplate<
  G & {
    Node: StoreAtomInstanceRecursive<G>
    Template: StoreAtomTemplateRecursive<G>
  }
>

export class StoreAtomTemplate<
  G extends StoreAtomGenerics = AnyStoreAtomGenerics
> extends AtomTemplateBase<G> {
  constructor(
    key: string,
    valueOrFactory: StoreAtomValueOrFactory<G>,
    config?: AtomConfig<G['State']> | undefined
  ) {
    super(key, valueOrFactory, config)
  }

  /**
   * This method should be overridden when creating custom atom classes that
   * create a custom atom instance class. Return a new instance of your atom
   * instance class.
   */
  public _instantiate(
    ecosystem: Ecosystem,
    id: string,
    params: G['Params']
  ): G['Node'] {
    return new StoreAtomInstance(ecosystem, this, id, params)
  }

  public override(newValue: StoreAtomValueOrFactory<G>): StoreAtomTemplate<G> {
    const newAtom = storeAtom(this.key, newValue, this.c)
    newAtom._isOverride = true
    return newAtom as any
  }
}
