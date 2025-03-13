import {
  AtomConfig,
  IonStateFactory,
  AtomGenerics,
  AnyAtomGenerics,
} from '@zedux/atoms/types/index'
import { AtomInstance } from '../instances/AtomInstance'
import { AtomTemplate } from './AtomTemplate'
import { injectEcosystem } from '@zedux/atoms/injectors/injectEcosystem'

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
    config?: AtomConfig<G['State']>
  ) {
    super(
      key,
      (...params: G['Params']) => stateFactory(injectEcosystem(), ...params),
      config
    )
  }
}
