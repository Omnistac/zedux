import { localAtom } from '@zedux/react/factories'
import { useAtomWithoutSubscription } from '@zedux/react/hooks'
import { injectAtomWithoutSubscription } from '@zedux/react/injectors'
import { AtomValueOrFactory } from '@zedux/react/types'
import { generateLocalId, GraphEdgeSignal } from '@zedux/react/utils'
import { useContext, useLayoutEffect, useState } from 'react'
import { AtomInstance } from '../instances/AtomInstance'
import { StandardAtomBase } from './StandardAtomBase'

type LocalParams<Params extends any[]> = [string | undefined, ...Params]

export class LocalAtom<
  State,
  Params extends any[],
  Exports extends Record<string, any>
> extends StandardAtomBase<State, LocalParams<Params>, Exports> {
  public getKeyHash(params: LocalParams<Params>) {
    // If a string is passed as the first param, it's the id of the local atom. An existing hash can be recreated.
    if (typeof params[0] === 'string') return super.getKeyHash(params)

    // Otherwise, every time a local atom is got, we create a new hash.
    return super.getKeyHash([generateLocalId(), ...params.slice(1)] as [
      string,
      ...Params
    ])
  }

  public injectInstance(...params: LocalParams<Params>) {
    return injectAtomWithoutSubscription<
      State,
      LocalParams<Params>,
      AtomInstance<State, LocalParams<Params>, Exports>
    >('injectInstance', this, params)
  }

  public override(
    newValue: AtomValueOrFactory<State, LocalParams<Params>, Exports>
  ) {
    return localAtom(this.key, newValue, {
      flags: this.flags,
    })
  }

  public useConsumer() {
    return useContext(this.getReactContext())
  }

  private useConsumerWithSubscription() {
    const instance = this.useConsumer()
    const [, setState] = useState(instance._stateStore.getState())
    const [, forceRender] = useState<any>()

    useLayoutEffect(() => {
      const unregister = instance.ecosystem._graph.registerExternalDependent(
        instance,
        (signal, val) => {
          if (signal === GraphEdgeSignal.Destroyed) {
            forceRender({})
            return
          }

          setState(val)
        },
        'a dynamic React hook',
        false
      )

      return unregister
    }, [instance])

    return instance
  }

  public useDispatch() {
    return this.useConsumer().dispatch
  }

  public useExports() {
    return this.useConsumer().api?.exports as Exports
  }

  public useInstance(...params: LocalParams<Params>) {
    return useAtomWithoutSubscription<
      State,
      LocalParams<Params>,
      AtomInstance<State, LocalParams<Params>, Exports>
    >(this, params)
  }

  public useSelector<D = any>(selector: (state: State) => D) {
    return this.useConsumerWithSubscription().useSelector(selector)
  }

  public useSetState() {
    return this.useConsumer().setState
  }

  public useState() {
    const instance = this.useConsumerWithSubscription()

    return [instance._stateStore.getState(), instance.setState] as const
  }

  public useStore() {
    return this.useConsumer().store
  }

  public useValue() {
    return this.useConsumerWithSubscription()._stateStore.getState()
  }
}
