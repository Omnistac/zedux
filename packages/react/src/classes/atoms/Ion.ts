import { Settable } from '@zedux/core'
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
import { diContext } from '@zedux/react/utils/csContexts'
import { AtomInstance } from '../instances/AtomInstance'
import { Ecosystem } from '../Ecosystem'

export class Ion<
  State,
  Params extends any[],
  Exports extends Record<string, any>,
  PromiseType extends AtomApiPromise
> extends StandardAtomBase<State, Params, Exports, PromiseType> {
  private _get: IonGet<State, Params, Exports, PromiseType>
  private _set?: IonSet<State, Params, Exports, PromiseType>

  constructor(
    key: string,
    get: IonGet<State, Params, Exports, PromiseType>,
    set?: IonSet<State, Params, Exports, PromiseType>,
    config?: AtomConfig
  ) {
    const value = (...params: Params) => {
      const atomGetters = injectAtomGetters()
      const { instance } = diContext.consume()
      const val = get(atomGetters, ...params)

      const ionApi = api(val)

      if (set) {
        ionApi.addSetStateInterceptor(settable => {
          const innerSet: AtomSetters<
            State,
            Params,
            Exports,
            PromiseType
          >['set'] = (
            atom: StandardAtomBase<any, [...any], any, any>,
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
  ): AtomInstance<State, Params, Exports, PromiseType> {
    return new AtomInstance<State, Params, Exports, PromiseType>(
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
      ecosystem.allowComplexAtomParams
    )}`
  }

  public override(
    newGet?: IonGet<State, Params, Exports, PromiseType>,
    newSet?: IonSet<State, Params, Exports, PromiseType>
  ) {
    return ion(this.key, newGet || this._get, newSet || this._set, {
      flags: this.flags,
    })
  }
}
