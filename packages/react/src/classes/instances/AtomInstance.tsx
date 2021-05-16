import { ActionChain, Settable, Store } from '@zedux/core'
import { ActiveState, AtomValue } from '@zedux/react/types'
import {
  ExportsInjectorDescriptor,
  GraphEdgeSignal,
  InjectorDescriptor,
  InjectorType,
  SelectorInjectorDescriptor,
  split,
  StateInjectorDescriptor,
} from '@zedux/react/utils'
import React, { FC, useEffect, useRef, useState } from 'react'
import { StandardAtomBase } from '../atoms/StandardAtomBase'
import { Ecosystem } from '../Ecosystem'
import { AtomInstanceBase } from './AtomInstanceBase'

const getExports = <Exports extends Record<string, any>>(
  injectors?: InjectorDescriptor[]
) =>
  (injectors?.find(injector => injector.type === InjectorType.Exports) as
    | ExportsInjectorDescriptor<Exports>
    | undefined)?.exports

export class AtomInstance<
  State,
  Params extends any[],
  Exports extends Record<string, any>
> extends AtomInstanceBase<
  State,
  Params,
  StandardAtomBase<State, Params, Exports>
> {
  public _destructionTimeout?: ReturnType<typeof setTimeout>
  public exports?: Exports
  public store: Store<State>

  private dispatchInterceptor?: (
    action: ActionChain,
    next: (action: ActionChain) => State
  ) => State

  private setStateInterceptor?: (
    settable: Settable<State>,
    next: (settable: Settable<State>) => State
  ) => State

  constructor(
    ecosystem: Ecosystem,
    atom: StandardAtomBase<State, Params, Exports>,
    keyHash: string,
    params: Params
  ) {
    super(ecosystem, atom, keyHash, params)

    this.exports = getExports(this._injectors)

    // standard atom instances expose this (so consumers can use a
    // non-underscore-prefixed property)
    this.store = this._stateStore
  }

  /**
   * A standard atom's value can be one of:
   *
   * - A raw value
   * - A Zedux store
   * - A function that returns a raw value
   * - A function that returns a Zedux store
   * - A function that returns an AtomApi (TODO: this)
   */
  public _evaluate() {
    const { _value } = this.atom

    if (typeof _value !== 'function') {
      return _value
    }

    try {
      return (_value as (...params: Params) => AtomValue<State>)(...this.params)
    } catch (err) {
      console.error(
        `Zedux - Error while instantiating atom "${this.atom.key}" with params:`,
        this.params,
        err
      )

      throw err
    }
  }

  /**
   * When a standard atom instance's refCount hits 0 and a ttl is set, we set a
   * timeout to destroy this atom instance.
   */
  public _scheduleDestruction() {
    const { ttl } = this.atom

    // By default, atoms live forever. Also the atom may already be scheduled
    // for destruction or destroyed
    if (ttl == null || this._activeState !== ActiveState.Active) {
      return
    }

    if (ttl === 0) {
      return this._destroy()
    }

    // schedule destruction (if ttl is > 0)
    if (typeof ttl !== 'number') return

    const timeoutId = setTimeout(() => this._destroy(), ttl)

    // TODO: dispatch an action over stateStore for these mutations
    this._destructionTimeout = timeoutId
    this._activeState = ActiveState.Destroying
  }

  public dispatch = (action: ActionChain) => {
    if (this.dispatchInterceptor) {
      return this.dispatchInterceptor(action, (newAction: ActionChain) =>
        this._stateStore.dispatch(newAction)
      )
    }

    return this._stateStore.dispatch(action)
  }

  public injectSelector<D extends any = any>(selector: (state: State) => D) {
    const { selectorResult } = split<SelectorInjectorDescriptor<State, D>>(
      'injectSelector',
      InjectorType.Selector,
      ({ instance }) => {
        this.ecosystem.graph.addDependency<State>(
          instance.keyHash,
          this.keyHash,
          'injectSelector',
          false,
          false,
          newState => {
            const newResult = descriptor.selector(newState)
            const shouldUpdate = newResult !== descriptor.selectorResult
            descriptor.selectorResult = newResult

            return shouldUpdate
          }
        )

        const cleanup = () => {
          this.ecosystem.graph.removeDependency(instance.keyHash, this.keyHash)
        }

        const descriptor: SelectorInjectorDescriptor<State> = {
          cleanup,
          selector,
          selectorResult: selector(this._stateStore.getState()),
          type: InjectorType.Selector,
        }

        return descriptor
      },
      prevDescriptor => {
        if (prevDescriptor.selector === selector) return prevDescriptor

        const newResult = selector(this._stateStore.getState())
        prevDescriptor.selectorResult = newResult
        prevDescriptor.selector = selector

        return prevDescriptor
      }
    )

    return selectorResult
  }

  public injectState() {
    split<StateInjectorDescriptor>(
      'injectState',
      InjectorType.State,
      ({ instance }) => {
        this.ecosystem.graph.addDependency(
          instance.keyHash,
          this.keyHash,
          'injectState',
          false
        )

        const cleanup = () => {
          this.ecosystem.graph.removeDependency(instance.keyHash, this.keyHash)
        }

        return {
          cleanup,
          store: this._stateStore, // just 'cause we're reusing this injector descriptor type. It's fine.
          type: InjectorType.State,
        }
      }
    )

    return [this._stateStore.getState(), this.setState] as const
  }

  public injectValue() {
    split<InjectorDescriptor>(
      'injectValue',
      InjectorType.Value,
      ({ instance }) => {
        this.ecosystem.graph.addDependency(
          instance.keyHash,
          this.keyHash,
          'injectValue',
          false
        )

        const cleanup = () => {
          this.ecosystem.graph.removeDependency(instance.keyHash, this.keyHash)
        }

        return {
          cleanup,
          type: InjectorType.State,
        }
      }
    )

    return this._stateStore.getState()
  }

  public Provider: FC = ({ children }) => {
    const context = this.atom.getReactContext()

    return <context.Provider value={this}>{children}</context.Provider>
  }

  public setState = (settable: Settable<State>) => {
    if (this.setStateInterceptor) {
      return this.setStateInterceptor(
        settable,
        (newSettable: Settable<State>) => this._stateStore.setState(newSettable)
      )
    }

    return this._stateStore.setState(settable)
  }

  public useSelector<D extends any = any>(selector: (state: State) => D) {
    const [state, setState] = useState(() =>
      selector(this._stateStore.getState())
    )
    const [, forceRender] = useState<any>()
    const selectorRef = useRef(selector)
    selectorRef.current = selector

    useEffect(() => {
      const unregister = this.ecosystem.graph.registerExternalDependent(
        this,
        (signal, val) => {
          if (signal === GraphEdgeSignal.Destroyed) {
            forceRender({})
            return
          }

          setState(selectorRef.current(val))
        },
        'useSelector',
        false
      )

      return unregister
    }, [])

    return state
  }

  public useValue() {
    const [state, setState] = useState(this._stateStore.getState())
    const [, forceRender] = useState<any>()

    useEffect(() => {
      const unregister = this.ecosystem.graph.registerExternalDependent(
        this,
        (signal, val) => {
          if (signal === GraphEdgeSignal.Destroyed) {
            forceRender({})
            return
          }

          setState(val)
        },
        'useValue',
        false
      )

      return unregister
    })

    return state
  }

  public useState() {
    const [state, setState] = useState(this._stateStore.getState())
    const [, forceRender] = useState<any>()

    useEffect(() => {
      const unregister = this.ecosystem.graph.registerExternalDependent(
        this,
        (signal, val) => {
          if (signal === GraphEdgeSignal.Destroyed) {
            forceRender({})
            return
          }

          setState(val)
        },
        'useState',
        false
      )

      return unregister
    })

    return [state, this._stateStore.setState] as const
  }
}
