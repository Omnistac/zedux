import { Settable } from '@zedux/core'
import { Atom } from '@zedux/react/classes/atoms/Atom'
import { api } from '@zedux/react/factories/api'
import { ion } from '@zedux/react/factories/ion'
import {
  injectEcosystem,
  injectGet,
  injectGetInstance,
} from '@zedux/react/injectors'
import { AtomConfig, IonGet, IonSet, IonSetUtils } from '@zedux/react/types'
import { diContext } from '@zedux/react/utils/csContexts'
import { AtomInstance } from '../AtomInstance'

export class Ion<
  State,
  Params extends any[],
  Exports extends Record<string, any>
> extends Atom<State, Params, Exports> {
  private _get: IonGet<State, Params, Exports>
  private _set?: IonSet<State, Params, Exports>

  constructor(
    key: string,
    get: IonGet<State, Params, Exports>,
    set?: IonSet<State, Params, Exports>,
    config?: AtomConfig
  ) {
    const value = (...params: Params) => {
      const ecosystem = injectEcosystem()
      const innerGet = injectGet()
      const getInstance = injectGetInstance()
      const { instance } = diContext.consume()
      const val = get({ ecosystem, get: innerGet, getInstance }, ...params)

      const ionApi = api(val)

      if (set) {
        ionApi.addSetStateInterceptor(settable => {
          const innerSet: IonSetUtils<State, Params, Exports>['set'] = (
            atom: Atom<any, [...any], any>,
            paramsIn: any[],
            settableIn?: Settable
          ) => {
            // TODO: Better error reporting for bad parameters passed here
            const params = settableIn ? paramsIn : []
            const settable = settableIn || paramsIn

            ecosystem.getInstance(atom, params).setState(settable)
          }

          const result = set(
            {
              ecosystem,
              get: innerGet,
              getInstance,
              instance: instance as AtomInstance<
                State,
                Params,
                Exports,
                Atom<State, Params, Exports>
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

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  public override(
    newGet?: IonGet<State, Params, Exports>,
    newSet?: IonSet<State, Params, Exports>
  ) {
    return ion(this.key, newGet || this._get, newSet || this._set, {
      flags: this.flags,
    })
  }
}
