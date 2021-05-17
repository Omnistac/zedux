import { useContext } from 'react'
import { AtomValueOrFactory } from '../../types'
import { useAtomWithSubscription } from '../../hooks/useAtomWithSubscription'
import { injectAtomWithSubscription } from '../../injectors/injectAtomWithSubscription'
import { injectAtomWithoutSubscription } from '../../injectors/injectAtomWithoutSubscription'
import { useAtomWithoutSubscription } from '../../hooks'
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
  public injectDispatch(...params: Params) {
    return injectAtomWithoutSubscription<
      State,
      Params,
      AtomInstance<State, Params, Exports>
    >('injectDispatch', this, params).dispatch
  }

  public injectExports(...params: Params) {
    return injectAtomWithoutSubscription<
      State,
      Params,
      AtomInstance<State, Params, Exports>
    >('injectExports', this, params).api?.exports as Exports
  }

  public injectInstance(...params: Params) {
    return injectAtomWithoutSubscription<
      State,
      Params,
      AtomInstance<State, Params, Exports>
    >('injectInstance', this, params)
  }

  public injectInvalidate(...params: Params) {
    return injectAtomWithoutSubscription<
      State,
      Params,
      AtomInstance<State, Params, Exports>
    >('injectInvalidate', this, params).invalidate
  }

  public injectLazy() {
    const initialContext = diContext.consume()

    return (...params: Params): AtomInstance<State, Params, Exports> => {
      const newContext = ecosystemCsContext.consume(false)
      const ecosystemId =
        newContext?.ecosystemId || initialContext.instance.ecosystem.ecosystemId
      const ecosystem = getEcosystem(ecosystemId)

      return ecosystem.load<
        State,
        Params,
        AtomInstance<State, Params, Exports>
      >(this, params)
    }
  }

  public injectSelector<D = any>(
    paramsArg: Params | ((state: State) => D),
    selectorArg?: (state: State) => D
  ) {
    const params = selectorArg
      ? (paramsArg as Params)
      : (([] as unknown) as Params)

    return injectAtomWithoutSubscription<
      State,
      Params,
      AtomInstance<State, Params, Exports>
    >('injectSelector', this, params).injectSelector(
      selectorArg || (paramsArg as (state: State) => D)
    )
  }

  public injectSetState(...params: Params) {
    return injectAtomWithoutSubscription<
      State,
      Params,
      AtomInstance<State, Params, Exports>
    >('injectSetState', this, params).setState
  }

  public injectState(...params: Params) {
    const instance = injectAtomWithSubscription('injectState', this, params)

    return [instance._stateStore.getState(), instance.setState] as const
  }

  public injectStore(...params: Params) {
    return injectAtomWithoutSubscription<
      State,
      Params,
      AtomInstance<State, Params, Exports>
    >('injectStore', this, params).store
  }

  public injectValue(...params: Params) {
    return injectAtomWithSubscription<
      State,
      Params,
      AtomInstance<State, Params, Exports>
    >('injectValue', this, params)._stateStore.getState()
  }

  public override(newValue: AtomValueOrFactory<State, Params, Exports>) {
    return atom(this.key, newValue, {
      flags: this.flags,
      maxInstances: this.maxInstances,
      ttl: this.ttl,
    })
  }

  public useConsumer() {
    return useContext(this.getReactContext())
  }

  public useDispatch(...params: Params) {
    return useAtomWithoutSubscription<
      State,
      Params,
      AtomInstance<State, Params, Exports>
    >(this, params).dispatch
  }

  public useExports(...params: Params) {
    return useAtomWithoutSubscription<
      State,
      Params,
      AtomInstance<State, Params, Exports>
    >(this, params).api?.exports as Exports
  }

  public useInstance(...params: Params) {
    return useAtomWithoutSubscription<
      State,
      Params,
      AtomInstance<State, Params, Exports>
    >(this, params)
  }

  public useInvalidate(...params: Params) {
    return useAtomWithoutSubscription<
      State,
      Params,
      AtomInstance<State, Params, Exports>
    >(this, params).invalidate
  }

  public useLazy() {
    const initialAppId = useContext(ecosystemContext)

    return (...params: Params) => {
      const newAppId = ecosystemCsContext.consume(false)?.ecosystemId
      const ecosystemId = newAppId || initialAppId
      const ecosystem = getEcosystem(ecosystemId)

      return ecosystem.load<
        State,
        Params,
        AtomInstance<State, Params, Exports>
      >(this, params)
    }
  }

  public useSelector<D = any>(
    paramsArg: Params | ((state: State) => D),
    selectorArg?: (state: State) => D
  ) {
    const params = selectorArg
      ? (paramsArg as Params)
      : (([] as unknown) as Params)

    return useAtomWithoutSubscription<
      State,
      Params,
      AtomInstance<State, Params, Exports>
    >(this, params).useSelector(
      selectorArg || (paramsArg as (state: State) => D)
    )
  }

  public useSetState(...params: Params) {
    return useAtomWithoutSubscription<
      State,
      Params,
      AtomInstance<State, Params, Exports>
    >(this, params).setState
  }

  public useState(...params: Params) {
    const instance = useAtomWithSubscription<
      State,
      Params,
      AtomInstance<State, Params, Exports>
    >(this, params)

    return [instance.store.getState(), instance.setState] as const
  }

  public useStore(...params: Params) {
    return useAtomWithoutSubscription<
      State,
      Params,
      AtomInstance<State, Params, Exports>
    >(this, params).store
  }

  public useValue(...params: Params) {
    return useAtomWithSubscription<
      State,
      Params,
      AtomInstance<State, Params, Exports>
    >(this, params)._stateStore.getState()
  }
}
