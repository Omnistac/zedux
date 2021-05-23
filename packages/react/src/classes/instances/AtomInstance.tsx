import { ActionChain, Settable, Store } from '@zedux/core'
import { ActiveState, AtomValue } from '@zedux/react/types'
import {
  GraphEdgeSignal,
  InjectorDescriptor,
  InjectorType,
  SelectorInjectorDescriptor,
  split,
  StateInjectorDescriptor,
} from '@zedux/react/utils'
import React, { FC, useEffect, useRef, useState } from 'react'
import { AtomApi } from '../AtomApi'
import { StandardAtomBase } from '../atoms/StandardAtomBase'
import { Ecosystem } from '../Ecosystem'
import { AtomInstanceBase } from './AtomInstanceBase'

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
  public api?: AtomApi<State, Exports>
  public exports: Exports = undefined as any
  public store: Store<State>

  constructor(
    ecosystem: Ecosystem,
    atom: StandardAtomBase<State, Params, Exports>,
    keyHash: string,
    params: Params
  ) {
    super(ecosystem, atom, keyHash, params)

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

    if (_value instanceof AtomApi) {
      this.api = _value
      return _value.value
    }

    if (typeof _value !== 'function') {
      return _value
    }

    try {
      const val = (_value as (
        ...params: Params
      ) => AtomValue<State> | AtomApi<State, Exports>)(...this.params)

      if (val instanceof AtomApi) {
        this.api = val
        this.exports = val.exports as Exports
        return val.value
      }

      return val
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
    if (this.api?.dispatchInterceptors?.length) {
      return this.api._interceptDispatch(action, (newAction: ActionChain) =>
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
        const edge = this.ecosystem._graph.addDependency<State>(
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
          this.ecosystem._graph.removeDependency(
            instance.keyHash,
            this.keyHash,
            edge
          )
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
        const edge = this.ecosystem._graph.addDependency(
          instance.keyHash,
          this.keyHash,
          'injectState',
          false
        )

        const cleanup = () => {
          this.ecosystem._graph.removeDependency(
            instance.keyHash,
            this.keyHash,
            edge
          )
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
        const edge = this.ecosystem._graph.addDependency(
          instance.keyHash,
          this.keyHash,
          'injectValue',
          false
        )

        const cleanup = () => {
          this.ecosystem._graph.removeDependency(
            instance.keyHash,
            this.keyHash,
            edge
          )
        }

        return {
          cleanup,
          type: InjectorType.Value,
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
    if (this.api?.setStateInterceptors?.length) {
      return this.api._interceptSetState(
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
      const unregister = this.ecosystem._graph.registerExternalDependent(
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
      const unregister = this.ecosystem._graph.registerExternalDependent(
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
    }, [])

    return state
  }

  public useState() {
    const [state, setState] = useState(this._stateStore.getState())
    const [, forceRender] = useState<any>()

    useEffect(() => {
      const unregister = this.ecosystem._graph.registerExternalDependent(
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
    }, [])

    return [state, this._stateStore.setState] as const
  }
}
