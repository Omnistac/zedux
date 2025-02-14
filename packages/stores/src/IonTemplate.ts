import { AtomConfig, injectEcosystem } from '@zedux/atoms'
import { AtomInstance } from './AtomInstance'
import { AtomTemplate } from './AtomTemplate'
import { AnyAtomGenerics, AtomGenerics, IonStateFactory } from './types'

export type IonInstanceRecursive<
  G extends Omit<AtomGenerics, 'Node' | 'Template'>
> = AtomInstance<
  G & {
    Node: IonInstanceRecursive<G>
    Template: IonTemplateRecursive<G>
  }
>

export type IonTemplateRecursive<
  G extends Omit<AtomGenerics, 'Node' | 'Template'>
> = IonTemplate<
  G & {
    Node: IonInstanceRecursive<G>
    Template: IonTemplateRecursive<G>
  }
>

export class IonTemplate<
  G extends AtomGenerics = AnyAtomGenerics
> extends AtomTemplate<G> {
  constructor(
    key: string,
    stateFactory: IonStateFactory<Omit<G, 'Node' | 'Template'>>,
    _config?: AtomConfig<G['State']>
  ) {
    super(
      key,
      (...params: G['Params']) => stateFactory(injectEcosystem(), ...params),
      _config
    )
  }
}
