import { AtomConfig, injectEcosystem } from '@zedux/atoms'
import { StoreAtomInstance } from './StoreAtomInstance'
import { StoreAtomTemplate } from './StoreAtomTemplate'
import {
  AnyStoreAtomGenerics,
  StoreAtomGenerics,
  StoreIonStateFactory,
} from './types'

export type StoreIonInstanceRecursive<
  G extends Omit<StoreAtomGenerics, 'Node' | 'Template'>
> = StoreAtomInstance<
  G & {
    Node: StoreIonInstanceRecursive<G>
    Template: StoreIonTemplateRecursive<G>
  }
>

export type StoreIonTemplateRecursive<
  G extends Omit<StoreAtomGenerics, 'Node' | 'Template'>
> = StoreIonTemplate<
  G & {
    Node: StoreIonInstanceRecursive<G>
    Template: StoreIonTemplateRecursive<G>
  }
>

export class StoreIonTemplate<
  G extends StoreAtomGenerics = AnyStoreAtomGenerics
> extends StoreAtomTemplate<G> {
  constructor(
    key: string,
    stateFactory: StoreIonStateFactory<Omit<G, 'Node' | 'Template'>>,
    config?: AtomConfig<G['State']>
  ) {
    super(
      key,
      (...params: G['Params']) => stateFactory(injectEcosystem(), ...params),
      config
    )
  }
}
