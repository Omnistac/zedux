import { ion } from '@zedux/atoms/factories/ion'
import { injectAtomGetters } from '@zedux/atoms/injectors/injectAtomGetters'
import {
  AtomConfig,
  IonStateFactory,
  AtomGenerics,
  AnyAtomGenerics,
} from '@zedux/atoms/types/index'
import { AtomInstance } from '../instances/AtomInstance'
import { AtomTemplate } from './AtomTemplate'

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
  G extends AtomGenerics & {
    Node: IonInstanceRecursive<G>
    Template: IonTemplateRecursive<G>
  } = AnyAtomGenerics
> extends AtomTemplate<G> {
  private _get: IonStateFactory<G>

  constructor(
    key: string,
    stateFactory: IonStateFactory<Omit<G, 'Node' | 'Template'>>,
    _config?: AtomConfig<G['State']>
  ) {
    super(
      key,
      (...params: G['Params']) => stateFactory(injectAtomGetters(), ...params),
      _config
    )

    this._get = stateFactory
  }

  public override(newGet?: IonStateFactory<G>): IonTemplate<G> {
    const newIon = ion(this.key, newGet || this._get, this._config)
    newIon._isOverride = true
    return newIon
  }
}
