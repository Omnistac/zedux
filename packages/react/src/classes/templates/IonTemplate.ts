import { ion } from '@zedux/react/factories/ion'
import { injectAtomGetters } from '@zedux/react/injectors'
import { AtomConfig, IonStateFactory, AtomGenerics } from '@zedux/react/types'
import { AtomInstance } from '../instances/AtomInstance'
import { Ecosystem } from '../Ecosystem'
import { AtomTemplateBase } from './AtomTemplateBase'

export class IonTemplate<G extends AtomGenerics> extends AtomTemplateBase<
  G,
  AtomInstance<G>
> {
  private _get: IonStateFactory<G>

  constructor(
    key: string,
    stateFactory: IonStateFactory<G>,
    _config?: AtomConfig<G['State']>
  ) {
    super(
      key,
      (...params: G['Params']) => stateFactory(injectAtomGetters(), ...params),
      _config
    )

    this._get = stateFactory
  }

  public _createInstance(
    ecosystem: Ecosystem,
    id: string,
    params: G['Params']
  ): AtomInstance<G> {
    return new AtomInstance<G>(ecosystem, this, id, params)
  }

  public getInstanceId(ecosystem: Ecosystem, params?: G['Params']) {
    const base = this.key

    if (!params?.length) return base

    return `${base}-${ecosystem._idGenerator.hashParams(
      params,
      ecosystem.complexParams
    )}`
  }

  public override(newGet?: IonStateFactory<G>) {
    const newIon = ion(this.key, newGet || this._get, this._config)
    newIon._isOverride = true
    return newIon
  }
}
