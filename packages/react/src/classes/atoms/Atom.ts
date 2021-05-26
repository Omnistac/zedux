import React from 'react'
import { AtomParamsType, AtomValueOrFactory } from '../../types'
import { useAtomInstanceDynamic } from '../../hooks/useAtomInstanceDynamic'
import { injectAtomWithSubscription } from '../../injectors/injectAtomWithSubscription'
import { injectAtomWithoutSubscription } from '../../injectors/injectAtomWithoutSubscription'
import { useAtomInstance } from '../../hooks'
import { ecosystemCsContext, diContext } from '../../utils/csContexts'
import { getEcosystem } from '../../store/public-api'
import { ecosystemContext } from '../Ecosystem'
import { AtomInstance } from '../instances/AtomInstance'
import { atom } from '@zedux/react/factories'
import { StandardAtomBase } from './StandardAtomBase'

export class Atom<
  State,
  Params extends any[],
  Exports extends Record<string, any>
> extends StandardAtomBase<State, Params, Exports> {
  public injectDispatch(...params: AtomParamsType<this>) {
    return injectAtomWithoutSubscription('injectDispatch', this, params)
      .dispatch
  }

  public injectExports(...params: AtomParamsType<this>) {
    return injectAtomWithoutSubscription('injectExports', this, params).api
      ?.exports as Exports
  }

  public injectInstance(...params: AtomParamsType<this>) {
    return injectAtomWithoutSubscription('injectInstance', this, params)
  }

  public injectInvalidate(...params: AtomParamsType<this>) {
    return injectAtomWithoutSubscription('injectInvalidate', this, params)
      .invalidate
  }

  public injectLazy() {
    const initialContext = diContext.consume()

    return (
      ...params: AtomParamsType<this>
    ): AtomInstance<State, Params, Exports> => {
      const newContext = ecosystemCsContext.consume(false)
      const ecosystemId =
        newContext?.ecosystemId || initialContext.instance.ecosystem.ecosystemId
      const ecosystem = getEcosystem(ecosystemId)

      return ecosystem.load(this, params)
    }
  }

  public injectSelector<D = any>(
    paramsArg: AtomParamsType<this> | ((state: State) => D),
    selectorArg?: (state: State) => D
  ) {
    const params = selectorArg
      ? (paramsArg as AtomParamsType<this>)
      : (([] as unknown) as AtomParamsType<this>)

    return injectAtomWithoutSubscription(
      'injectSelector',
      this,
      params
    ).injectSelector(selectorArg || (paramsArg as (state: State) => D))
  }

  public injectSetState(...params: AtomParamsType<this>) {
    return injectAtomWithoutSubscription('injectSetState', this, params)
      .setState
  }

  public injectState(...params: AtomParamsType<this>) {
    const instance = injectAtomWithSubscription('injectState', this, params)

    return [instance._stateStore.getState(), instance.setState] as const
  }

  public injectStore(...params: AtomParamsType<this>) {
    return injectAtomWithoutSubscription('injectStore', this, params).store
  }

  public injectValue(...params: AtomParamsType<this>) {
    return injectAtomWithSubscription(
      'injectValue',
      this,
      params
    )._stateStore.getState()
  }

  public override(newValue: AtomValueOrFactory<State, Params, Exports>) {
    return atom(this.key, newValue, {
      flags: this.flags,
      maxInstances: this.maxInstances,
      ttl: this.ttl,
    })
  }

  public useConsumer(react: typeof React = React) {
    return react.useContext(this.getReactContext())
  }

  public useDispatch(...params: AtomParamsType<this>) {
    return useAtomInstance(this, params).dispatch
  }

  public useExports(...params: AtomParamsType<this>) {
    return useAtomInstance(this, params).api?.exports as Exports
  }

  public useInstance(...params: AtomParamsType<this>) {
    return useAtomInstance(this, params)
  }

  public useInvalidate(...params: AtomParamsType<this>) {
    return useAtomInstance(this, params).invalidate
  }

  public useLazy(react: typeof React = React) {
    const initialAppId = react.useContext(ecosystemContext)

    return (...params: AtomParamsType<this>) => {
      const newAppId = ecosystemCsContext.consume(false)?.ecosystemId
      const ecosystemId = newAppId || initialAppId
      const ecosystem = getEcosystem(ecosystemId)

      return ecosystem.load(this, params)
    }
  }

  public useSelector<D = any>(
    paramsArg: AtomParamsType<this> | ((state: State) => D),
    selectorArg?: (state: State) => D
  ) {
    const params = selectorArg
      ? (paramsArg as AtomParamsType<this>)
      : (([] as unknown) as AtomParamsType<this>)

    return useAtomInstance(this, params).useSelector(
      selectorArg || (paramsArg as (state: State) => D)
    )
  }

  public useSetState(...params: AtomParamsType<this>) {
    return useAtomInstance(this, params).setState
  }

  public useState(...params: AtomParamsType<this>) {
    const instance = useAtomInstanceDynamic(this, params)

    return [instance.store.getState(), instance.setState] as const
  }

  public useStore(...params: AtomParamsType<this>) {
    return useAtomInstance(this, params).store
  }

  public useValue(...params: AtomParamsType<this>) {
    return useAtomInstanceDynamic(this, params)._stateStore.getState()
  }
}
