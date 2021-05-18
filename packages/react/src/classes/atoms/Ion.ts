import { Settable } from '@zedux/core'
import { Atom } from '@zedux/react/classes/atoms/Atom'
import { api } from '@zedux/react/factories'
import { injectEcosystem, injectGet } from '@zedux/react/injectors'
import { AtomConfig, IonGet, IonSet, IonSetUtils } from '@zedux/react/types'
import { diContext } from '@zedux/react/utils/csContexts'
import { AtomInstance } from '../instances/AtomInstance'
import { AtomBase } from './AtomBase'

export class Ion<
  State,
  Params extends any[],
  Exports extends Record<string, any>
> extends Atom<State, Params, Exports> {
  constructor(
    key: string,
    get: IonGet<State, Params, Exports>,
    set?: IonSet<State, Params, Exports>,
    config?: AtomConfig
  ) {
    const value = (...params: Params) => {
      const ecosystem = injectEcosystem()
      const innerGet = injectGet()
      const { instance } = diContext.consume()
      const val = get({ ecosystem, get: innerGet }, ...params)

      const ionApi = api(val)

      if (set) {
        ionApi.addSetStateInterceptor(settable => {
          const innerSet: IonSetUtils<State, Params, Exports>['set'] = (
            atom: AtomBase<any, any[], any>,
            paramsIn: any[],
            settableIn?: Settable
          ) => {
            // TODO: Better error reporting for bad parameters passed here
            const params = settableIn ? paramsIn : []
            const settable = settableIn || paramsIn

            ecosystem.load(atom, params).setState(settable)
          }

          const result = set(
            {
              ecosystem,
              get: innerGet,
              instance: instance as AtomInstance<State, Params, Exports>,
              set: innerSet,
            },
            settable
          )

          return typeof result === 'undefined'
            ? instance._stateStore.getState()
            : result
        })
      }

      return ionApi
    }

    super(key, value, config)
  }
}
