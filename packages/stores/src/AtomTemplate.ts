import { AtomConfig, AtomTemplateBase, Ecosystem } from '@zedux/atoms'
import { atom } from './atom'
import { AtomInstance } from './AtomInstance'
import { AnyAtomGenerics, AtomGenerics, AtomValueOrFactory } from './types'

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
  constructor(
    key: string,
    valueOrFactory: AtomValueOrFactory<G>,
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
    return new AtomInstance(ecosystem, this, id, params)
  }

  public override(newValue: AtomValueOrFactory<G>): AtomTemplate<G> {
    const newAtom = atom(this.key, newValue, this.c)
    newAtom._isOverride = true
    return newAtom as any
  }
}
