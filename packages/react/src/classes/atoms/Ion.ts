import { Store } from '@zedux/core'
import { StandardAtomBase } from '@zedux/react/classes/atoms/StandardAtomBase'
import { ion } from '@zedux/react/factories/ion'
import { injectAtomGetters } from '@zedux/react/injectors'
import { AtomConfig, IonStateFactory, AtomApiPromise } from '@zedux/react/types'
import { AtomInstance } from '../instances/AtomInstance'
import { Ecosystem } from '../Ecosystem'

export class Ion<
  State,
  Params extends any[],
  Exports extends Record<string, any>,
  StoreType extends Store<State>,
  PromiseType extends AtomApiPromise
> extends StandardAtomBase<State, Params, Exports, StoreType, PromiseType> {
  private _get: IonStateFactory<State, Params, Exports, StoreType, PromiseType>

  constructor(
    key: string,
    stateFactory: IonStateFactory<
      State,
      Params,
      Exports,
      StoreType,
      PromiseType
    >,
    private _config?: AtomConfig<State>
  ) {
    super(
      key,
      (...params: Params) => stateFactory(injectAtomGetters(), ...params),
      _config
    )

    this._get = stateFactory
  }

  public _createInstance(
    ecosystem: Ecosystem,
    keyHash: string,
    params: Params
  ): AtomInstance<State, Params, Exports, StoreType, PromiseType> {
    return new AtomInstance<State, Params, Exports, StoreType, PromiseType>(
      ecosystem,
      this,
      keyHash,
      params
    )
  }

  public getKeyHash(ecosystem: Ecosystem, params?: Params) {
    const base = this.key

    if (!params?.length) return base

    return `${base}-${ecosystem._idGenerator.hashParams(
      params,
      ecosystem.complexAtomParams
    )}`
  }

  public override(
    newGet?: IonStateFactory<State, Params, Exports, StoreType, PromiseType>
  ) {
    return ion(this.key, newGet || this._get, this._config)
  }
}
