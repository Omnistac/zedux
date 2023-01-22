import { Settable, Store } from '@zedux/core'
import { StandardAtomBase } from '@zedux/react/classes/atoms/StandardAtomBase'
import { api } from '@zedux/react/factories/api'
import { ion } from '@zedux/react/factories/ion'
import { injectAtomGetters } from '@zedux/react/injectors'
import {
  AtomConfig,
  IonGet,
  IonSet,
  AtomSetters,
  AtomApiPromise,
} from '@zedux/react/types'
import { AtomInstance } from '../instances/AtomInstance'
import { Ecosystem } from '../Ecosystem'
import { readInstance } from '../EvaluationStack'

export class Ion<
  State,
  Params extends any[],
  Exports extends Record<string, any>,
  StoreType extends Store<State>,
  PromiseType extends AtomApiPromise
> extends StandardAtomBase<State, Params, Exports, StoreType, PromiseType> {
  private _get: IonGet<State, Params, Exports, StoreType, PromiseType>
  private _set?: IonSet<State, Params, Exports, StoreType, PromiseType>

  constructor(
    key: string,
    get: IonGet<State, Params, Exports, StoreType, PromiseType>,
    set?: IonSet<State, Params, Exports, StoreType, PromiseType>,
    config?: AtomConfig<State>
  ) {
    const value = (...params: Params) => {
      const atomGetters = injectAtomGetters()
      const instance = readInstance()
      const val = get(atomGetters, ...params)

      const ionApi = api(val)

      if (set) {
        ionApi.addSetStateInterceptor(settable => {
          const innerSet: AtomSetters<
            State,
            Params,
            Exports,
            StoreType,
            PromiseType
          >['set'] = (
            atom: StandardAtomBase<any, [...any], any, any, any>,
            paramsIn: any[],
            settableIn?: Settable
          ) => {
            // TODO: Better error reporting for bad parameters passed here
            const params = settableIn ? paramsIn : []
            const settable = settableIn || paramsIn

            atomGetters.ecosystem.getInstance(atom, params).setState(settable)
          }

          const result = set(
            {
              ...atomGetters,
              instance: instance as AtomInstance<
                State,
                Params,
                Exports,
                StoreType,
                PromiseType
              >,
              set: innerSet,
            },
            settable
          )

          return typeof result === 'undefined'
            ? instance.store.getState()
            : result
        })
      }

      return ionApi
    }

    super(key, value, config)

    this._get = get
    this._set = set
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
    newGet?: IonGet<State, Params, Exports, StoreType, PromiseType>,
    newSet?: IonSet<State, Params, Exports, StoreType, PromiseType>
  ) {
    return ion(this.key, newGet || this._get, newSet || this._set, {
      flags: this.flags,
    })
  }
}
