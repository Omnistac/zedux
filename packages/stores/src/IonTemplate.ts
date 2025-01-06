import { AtomConfig, injectAtomGetters } from '@zedux/atoms'
import { AtomInstance } from './AtomInstance'
import { AtomTemplate } from './AtomTemplate'
import { ion } from './ion'
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
