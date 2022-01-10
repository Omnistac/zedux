import { Settable } from '@zedux/core'
import { StandardAtomBase } from '@zedux/react/classes/atoms/StandardAtomBase'
import { api } from '@zedux/react/factories/api'
import { ion } from '@zedux/react/factories/ion'
import { injectAtomGetters } from '@zedux/react/injectors'
import { AtomConfig, IonGet, IonSet, AtomSetters } from '@zedux/react/types'
import { hashParams } from '@zedux/react/utils'
import { diContext } from '@zedux/react/utils/csContexts'
import { AtomInstance } from '../instances/AtomInstance'
import { Ecosystem } from '../Ecosystem'

export class Ion<
  State,
  Params extends any[],
  Exports extends Record<string, any>
> extends StandardAtomBase<State, Params, Exports> {
  private _get: IonGet<State, Params, Exports>
  private _set?: IonSet<State, Params, Exports>

  constructor(
    key: string,
    get: IonGet<State, Params, Exports>,
    set?: IonSet<State, Params, Exports>,
    config?: AtomConfig
  ) {
    const value = (...params: Params) => {
      const atomGetters = injectAtomGetters()
      const { instance } = diContext.consume()
      const val = get(atomGetters, ...params)

      const ionApi = api(val)

      if (set) {
        ionApi.addSetStateInterceptor(settable => {
          const innerSet: AtomSetters<State, Params, Exports>['set'] = (
            atom: StandardAtomBase<any, [...any], any>,
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
              instance: instance as AtomInstance<State, Params, Exports>,
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
  ): AtomInstance<State, Params, Exports> {
    return new AtomInstance<State, Params, Exports>(
      ecosystem,
      this,
      keyHash,
      params
    )
  }

  public getKeyHash(params?: Params) {
    const base = this.key

    if (!params?.length) return base

    return `${base}-${hashParams(params)}`
  }

  public override(
    newGet?: IonGet<State, Params, Exports>,
    newSet?: IonSet<State, Params, Exports>
  ) {
    return ion(this.key, newGet || this._get, newSet || this._set, {
      flags: this.flags,
    })
  }
}
